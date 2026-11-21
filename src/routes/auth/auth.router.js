import { Router } from "express";
import { requireRole } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { loginSchema, refreshSchema, registerSchema } from "../../validators/schemas.js";

// Routes d'authentification, montées sur /api/auth.
export function createAuthRouter({ controller, requireAuth }) {
  const router = Router();

  router.post("/login", validate(loginSchema), controller.login);       // public
  router.post("/refresh", validate(refreshSchema), controller.refresh); // public
  // L'inscription est réservée à l'administrateur (UC-AD01).
  router.post("/register", requireAuth, requireRole("admin"), validate(registerSchema), controller.register);
  router.get("/me", requireAuth, controller.me);

  return router;
}
