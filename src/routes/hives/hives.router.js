import { Router } from "express";

export function createHivesRouter(controller) {
  const router = Router();

  router.get("/", controller.listHives);
  router.get("/:id", controller.getHive);

  router.post("/:id/measures", controller.addMeasure);
  router.get("/:id/measures", controller.listMeasures);

  router.get("/:id/inspections", controller.listInspections);
  router.post("/:id/inspections", controller.addInspection);

  return router;
}
