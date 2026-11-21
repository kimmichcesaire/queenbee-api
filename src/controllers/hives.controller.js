// Contrôleur : traduit la requête HTTP en appel de service, puis le résultat en réponse.
// Il passe toujours l'utilisateur du jeton (req.user) en premier, et lit req.validated.
// Pas de try/catch : avec Express 5, une erreur levée arrive seule dans errorHandler.
export function createHivesController({ hivesService, measuresService, inspectionsService }) {
  return {
    async listHives(req, res) {
      res.json(await hivesService.listHives(req.user, req.validated));
    },

    async getHive(req, res) {
      res.json(await hivesService.getHive(req.user, req.params.id));
    },

    // 201 si la mesure vient d'être créée, 200 si elle avait déjà été reçue (rejeu).
    async addMeasure(req, res) {
      const { measure, created } = await measuresService.addMeasure(req.user, req.params.id, req.validated);
      res.status(created ? 201 : 200).json(measure);
    },

    async listMeasures(req, res) {
      res.json(await measuresService.listMeasures(req.user, req.params.id, req.validated));
    },

    async listInspections(req, res) {
      const items = await inspectionsService.listInspections(req.user, req.params.id);
      res.json({ items });
    },

    // 201 si l'inspection vient d'être créée, 200 si elle avait déjà été reçue (rejeu).
    async addInspection(req, res) {
      const { inspection, created } = await inspectionsService.addInspection(req.user, req.params.id, req.validated);
      res.status(created ? 201 : 200).json(inspection);
    },
  };
}
