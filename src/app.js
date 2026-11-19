import express from "express";
import { hivesRouter } from "./routes/hives.router.js";
import { requestLogger } from "./middlewares/requestLogger.js";
import { notFoundHandler, errorHandler } from "./middlewares/errorHandler.js";

export const app = express();

// Journal : déclaré en premier pour mesurer toute la requête.
app.use(requestLogger);

// Transforme le corps JSON des requêtes en objet dans req.body (avant les routes).
app.use(express.json());

// Route de santé
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/hives", hivesRouter);


app.use(notFoundHandler);
app.use(errorHandler);
