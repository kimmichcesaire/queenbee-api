import { ValidationError } from "../errors.js";


export function createMeasuresService({ hivesService, measuresRepository }) {
  return {
    async addMeasure(user, hiveId, data) {
      const hive = await hivesService.getHive(user, hiveId); // 404 ou 403

      if (data.hive_id !== undefined && data.hive_id !== hive.id) {
        throw new ValidationError(
          `Le hive_id du corps (${data.hive_id}) ne correspond pas à celui du chemin (${hive.id}).`
        );
      }

      
      return measuresRepository.add({ ...data, hive_id: hive.id });
    },

    
    async listMeasures(user, hiveId, { limit, offset }) {
      await hivesService.getHive(user, hiveId);
      const items = await measuresRepository.findByHive(hiveId, { limit, offset });
      return { items, limit, offset };
    },
  };
}
