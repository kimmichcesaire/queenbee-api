import express from "express";
import { hivesRouter } from "./routes/hives.router.js";
import { requestLogger } from "./middlewares/requestLogger.js";
import { notFoundHandler, errorHandler } from "./middlewares/errorHandler.js";

// Fabrique : crée une application neuve à chaque appel.
export function createApp() {
  const app = express();

  // Journal : déclaré en premier pour mesurer toute la requête.
  app.use(requestLogger);

  // Transforme le corps JSON des requêtes en objet dans req.body (avant les routes).
  app.use(express.json());

  // Route de santé
  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Toutes les routes du routeur commencent par /api/hives.
  app.use("/api/hives", hivesRouter);

  // En DERNIER, après toutes les routes :
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
