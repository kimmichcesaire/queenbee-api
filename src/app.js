import express from "express";
import { config } from "./config.js";
import { requestLogger } from "./middlewares/requestLogger.js";
import { notFoundHandler, errorHandler } from "./middlewares/errorHandler.js";
import { createRequireAuth } from "./middlewares/auth.js";
import { createAuthService } from "./services/auth.service.js";
import { createHivesService } from "./services/hives.service.js";
import { createMeasuresService } from "./services/measures.service.js";
import { createInspectionsService } from "./services/inspections.service.js";
import { createAuthController } from "./controllers/auth.controller.js";
import { createHivesController } from "./controllers/hives.controller.js";
import { createInspectionsController } from "./controllers/inspections.controller.js";
import { createAuthRouter } from "./routes/auth/auth.router.js";
import { createHivesRouter } from "./routes/hives/hives.router.js";
import { createInspectionsRouter } from "./routes/inspections/inspections.router.js";

// Crée l'application à partir des repositories qu'on lui passe.
export function createApp({ hivesRepository, measuresRepository, inspectionsRepository, usersRepository }) {
  // Authentification : le service, puis l'intergiciel qui en dépend.
  const authService = createAuthService({ usersRepository, auth: config.auth });
  const requireAuth = createRequireAuth(authService);

  // Assemblage des couches : repositories -> services -> contrôleurs -> routeurs.
  const hivesService = createHivesService({ hivesRepository });
  const measuresService = createMeasuresService({ hivesService, measuresRepository });
  const inspectionsService = createInspectionsService({ hivesService, inspectionsRepository });

  const app = express();

  // Journal : déclaré en premier pour mesurer toute la requête.
  app.use(requestLogger);

  // Corps JSON -> req.body, 1 Mo au plus (au-delà : 413).
  app.use(express.json({ limit: "1mb" }));

  // Route de santé (publique)
  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", createAuthRouter({ controller: createAuthController({ authService }), requireAuth }));
  app.use("/api/hives", createHivesRouter({
    controller: createHivesController({ hivesService, measuresService, inspectionsService }),
    requireAuth, // le routeur des ruches fait router.use(requireAuth) en tête
  }));
  app.use("/api/inspections", createInspectionsRouter({
    controller: createInspectionsController({ inspectionsService }),
    requireAuth,
  }));

  // En DERNIER, après toutes les routes :
  app.use(notFoundHandler); // aucune route n'a répondu -> 404
  app.use(errorHandler);    // toute erreur -> 400, 401, 403, 404, 409, 413 ou 500

  return app;
}
