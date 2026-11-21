import { Router } from "express";
import { requireRole } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { syncSchema } from "../../validators/schemas.js";

// Routes des inspections hors d'une ruche précise, montées sur /api/inspections.
export function createInspectionsRouter({ controller, requireAuth }) {
  const router = Router();

  router.post("/sync", requireAuth, requireRole("apiculteur", "coordinateur"), validate(syncSchema), controller.sync);

  return router;
}
