import { Router } from "express";
import { hives, measures } from "../data/hives.js";
import { sendProblem } from "../utils/problem.js";

export const hivesRouter = Router();

// GET /api/hives           
// GET /api/hives?site_id=X 
hivesRouter.get("/", (req, res) => {
  const { site_id } = req.query;

  if (!site_id) {
    return res.json(hives);
  }

  res.json(hives.filter((hive) => hive.site_id === site_id));
});

// GET /api/hives/:id 
hivesRouter.get("/:id", (req, res) => {
  const hive = hives.find((h) => h.id === req.params.id);

  if (!hive) {
    return sendProblem(res, 404, `Aucune ruche ne porte l'identifiant ${req.params.id}.`);
  }

  res.json(hive);
});

// POST /api/hives/:id/measures 
hivesRouter.post("/:id/measures", (req, res) => {
  const hive = hives.find((h) => h.id === req.params.id);
  if (!hive) {
    return sendProblem(res, 404, `Aucune ruche ne porte l'identifiant ${req.params.id}.`);
  }

  const body = req.body ?? {};

  if (body.timestamp === undefined || body.weight_kg === undefined) {
    return sendProblem(res, 400, "Les champs timestamp et weight_kg sont obligatoires.");
  }

  if (body.hive_id !== undefined && body.hive_id !== hive.id) {
    return sendProblem(res, 400, `Le hive_id du corps (${body.hive_id}) ne correspond pas à celui du chemin (${hive.id}).`);
  }

  const measure = { ...body, hive_id: hive.id };
  measures.push(measure);

  res.status(201).json(measure);
});
