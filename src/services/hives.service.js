import { NotFoundError, ForbiddenError } from "../errors.js";

// La règle d'accès, écrite une seule fois. Fonction pure : un utilisateur, une ruche, un booléen.
export function canAccessHive(user, hive) {
  switch (user.role) {
    case "admin":
    case "gestionnaire":
      return true;
    case "coordinateur":
      return hive.site_id === user.site_id;
    case "apiculteur":
      return hive.owner_id === user.id;
    default:
      return false;
  }
}

// Service des ruches. Chaque méthode reçoit l'utilisateur du jeton en premier paramètre.
export function createHivesService({ hivesRepository }) {
  return {
    // La liste dépend du rôle. Un site_id vide (?site_id=) ne filtre rien.
    async listHives(user, { site_id } = {}) {
      const siteId = site_id || null;
      if (user.role === "coordinateur") {
        if (siteId && siteId !== user.site_id) {
          throw new ForbiddenError(`Vous n'avez pas accès au site ${siteId}.`);
        }
        return hivesRepository.findAll({ site_id: user.site_id });
      }
      if (user.role === "apiculteur") {
        return hivesRepository.findAll({ site_id: siteId, owner_id: user.id });
      }
      return hivesRepository.findAll({ site_id: siteId }); // admin, gestionnaire
    },

    // L'existence d'abord (404), les droits ensuite (403). Les services des mesures et des
    // inspections passent tous par là.
    async getHive(user, id) {
      const hive = await hivesRepository.findById(id);
      if (!hive) {
        throw new NotFoundError(`Aucune ruche ne porte l'identifiant ${id}.`);
      }
      if (!canAccessHive(user, hive)) {
        throw new ForbiddenError(`Vous n'avez pas accès à la ruche ${id}.`);
      }
      return hive;
    },
  };
}
