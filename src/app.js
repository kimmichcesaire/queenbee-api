import express from "express";
import { hivesRouter } from "./routes/hives.router.js";
import { requestLogger } from "./middlewares/requestLogger.js";

export const app = express();

// Journal : déclaré en premier pour mesurer toute la requête.
app.use(requestLogger);


app.use(express.json());

// Route de santé
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});


app.use("/api/hives", hivesRouter);
