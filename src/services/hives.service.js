import { NotFoundError } from "../errors.js";

export function createHivesService({ hivesRepository }) {
  return {
    // Pas de filtre si siteId est absent ou vide.
    async list({ siteId } = {}) {
      if (!siteId) return hivesRepository.findAll();
      return hivesRepository.findBySite(siteId);
    },

    // Renvoie la ruche, ou lève NotFoundError. Les autres services s'en servent
    // pour vérifier qu'une ruche existe.
    async getById(id) {
      const hive = await hivesRepository.findById(id);
      if (!hive) {
        throw new NotFoundError(`Aucune ruche ne porte l'identifiant ${id}.`);
      }
      return hive;
    },
  };
}
