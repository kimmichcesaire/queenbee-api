import express from "express";
import { requestLogger } from "./middlewares/requestLogger.js";
import { notFoundHandler, errorHandler } from "./middlewares/errorHandler.js";
import { createHivesService } from "./services/hives.service.js";
import { createMeasuresService } from "./services/measures.service.js";
import { createInspectionsService } from "./services/inspections.service.js";
import { createHivesController } from "./controllers/hives.controller.js";
import { createHivesRouter } from "./routes/hives/hives.router.js";


export function createApp({ hivesRepository, measuresRepository, inspectionsRepository }) {
  
  const hivesService = createHivesService({ hivesRepository });
  const measuresService = createMeasuresService({ hivesService, measuresRepository });
  const inspectionsService = createInspectionsService({ hivesService, inspectionsRepository });
  const hivesController = createHivesController({ hivesService, measuresService, inspectionsService });

  const app = express();

  // Journal : déclaré en premier pour mesurer toute la requête.
  app.use(requestLogger);

  // Transforme le corps JSON des requêtes en objet dans req.body (avant les routes).
  app.use(express.json());

  // Route de santé
  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Toutes les routes des ruches commencent par /api/hives.
  app.use("/api/hives", createHivesRouter(hivesController));

  // En DERNIER, après toutes les routes :
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
