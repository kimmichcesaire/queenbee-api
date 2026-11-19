import express from "express";
import { hivesRouter } from "./routes/hives.router.js";

export const app = express();


app.use(express.json());

// Route de santé 
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});


app.use("/api/hives", hivesRouter);
