import { Router } from "express";
import { requireRole } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import {
  hivesQuerySchema,
  paginationSchema,
  measureSchema,
  inspectionSchema,
} from "../../validators/schemas.js";

// Routeur : quelle URL, quel verbe, quels intergiciels. Aucune logique.
// Ordre des intergiciels : qui êtes-vous (requireAuth), en avez-vous le droit (requireRole),
// vos données sont-elles valides (validate), puis le contrôleur.
export function createHivesRouter({ controller, requireAuth }) {
  const router = Router();

  router.use(requireAuth); // toutes les routes des ruches demandent un jeton

  router.get("/", validate(hivesQuerySchema, "query"), controller.listHives);
  router.get("/:id", controller.getHive);

  // L'envoi de mesures est réservé à l'admin (il simule la passerelle).
  router.post("/:id/measures", requireRole("admin"), validate(measureSchema), controller.addMeasure);
  router.get("/:id/measures", validate(paginationSchema, "query"), controller.listMeasures);

  router.get("/:id/inspections", controller.listInspections);
  router.post(
    "/:id/inspections",
    requireRole("apiculteur", "coordinateur"),
    validate(inspectionSchema),
    controller.addInspection,
  );

  return router;
}
