import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import {
  hivesQuerySchema,
  paginationSchema,
  measureSchema,
  inspectionSchema,
} from "../../validators/schemas.js";

export function createHivesRouter(controller) {
  const router = Router();

  router.get("/", validate(hivesQuerySchema, "query"), controller.listHives);
  router.get("/:id", controller.getHive);

  router.post("/:id/measures", validate(measureSchema), controller.addMeasure);
  router.get("/:id/measures", validate(paginationSchema, "query"), controller.listMeasures);

  router.get("/:id/inspections", controller.listInspections);
  router.post("/:id/inspections", validate(inspectionSchema), controller.addInspection);

  return router;
}
