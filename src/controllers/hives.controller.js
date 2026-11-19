export function createHivesController({ hivesService, measuresService, inspectionsService }) {
  return {
    async listHives(req, res) {
      res.json(await hivesService.list({ siteId: req.query.site_id }));
    },

    async getHive(req, res) {
      res.json(await hivesService.getById(req.params.id));
    },

    async addMeasure(req, res) {
      const measure = await measuresService.add(req.params.id, req.body);
      res.status(201).json(measure);
    },

    async listMeasures(req, res) {
      const { limit, offset } = req.query;
      res.json(await measuresService.list(req.params.id, { limit, offset }));
    },

    async listInspections(req, res) {
      const items = await inspectionsService.list(req.params.id);
      res.json({ items });
    },

    async addInspection(req, res) {
      const inspection = await inspectionsService.add(req.params.id, req.body);
      res.status(201).json(inspection);
    },
  };
}
