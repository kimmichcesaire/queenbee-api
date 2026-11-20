import { ValidationError, ConflictError } from "../errors.js";

export function createInspectionsService({ hivesService, inspectionsRepository }) {
  return {
    async list(hiveId) {
      await hivesService.getById(hiveId);
      return inspectionsRepository.findByHive(hiveId);
    },

    async add(hiveId, data) {
      const hive = await hivesService.getById(hiveId);

      if (data.hive_id !== undefined && data.hive_id !== hive.id) {
        throw new ValidationError(
          `Le hive_id du corps (${data.hive_id}) ne correspond pas à celui du chemin (${hive.id}).`
        );
      }

   
      if (await inspectionsRepository.findById(data.id)) {
        throw new ConflictError(`Une inspection porte déjà l'identifiant ${data.id}.`);
      }

      return inspectionsRepository.add({
        id: data.id,
        hive_id: hive.id,
        inspected_at: data.inspected_at,
        colony_status: data.colony_status,
        queen_present: data.queen_present,
        observations: data.observations,
      });
    },
  };
}
