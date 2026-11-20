import { ValidationError } from "../errors.js";

export function createMeasuresService({ hivesService, measuresRepository }) {
  return {
    async add(hiveId, data) {
      const hive = await hivesService.getById(hiveId);

      if (data.hive_id !== undefined && data.hive_id !== hive.id) {
        throw new ValidationError(
          `Le hive_id du corps (${data.hive_id}) ne correspond pas à celui du chemin (${hive.id}).`
        );
      }

      
      return measuresRepository.add({ ...data, hive_id: hive.id });
    },

    
    async list(hiveId, { limit, offset }) {
      await hivesService.getById(hiveId);
      const items = await measuresRepository.findByHive(hiveId, { limit, offset });
      return { items, limit, offset };
    },
  };
}
