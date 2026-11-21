import { ValidationError, ConflictError } from "../errors.js";

export function createInspectionsService({ hivesService, inspectionsRepository }) {
  return {
    async listInspections(user, hiveId) {
      await hivesService.getHive(user, hiveId);
      return inspectionsRepository.findByHive(hiveId);
    },

    async addInspection(user, hiveId, data) {
      const hive = await hivesService.getHive(user, hiveId);

      if (data.hive_id !== undefined && data.hive_id !== hive.id) {
        throw new ValidationError(
          `Le hive_id du corps (${data.hive_id}) ne correspond pas à celui du chemin (${hive.id}).`
        );
      }

      // Double envoi de l'application mobile : on refuse le doublon.
      if (await inspectionsRepository.findById(data.id)) {
        throw new ConflictError(`Une inspection porte déjà l'identifiant ${data.id}.`);
      }

      return inspectionsRepository.add({
        id: data.id,
        hive_id: hive.id,
        author_id: user.id, 
        inspected_at: data.inspected_at,
        colony_status: data.colony_status,
        queen_present: data.queen_present,
        observations: data.observations,
      });
    },
  };
}
