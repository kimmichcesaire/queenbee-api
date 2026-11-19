import { Router } from "express";
import { hives, measures, inspections } from "../data/hives.js";
import { sendProblem } from "../utils/problem.js";

export const hivesRouter = Router();

// Fonctions de validation
function parseIntParam(value, defaut, min, max) {
  if (value === undefined) return defaut;
  if (!/^\d+$/.test(value)) return null; // que des chiffres
  const n = Number(value);
  if (n < min || n > max) return null;
  return n;
}


const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;


const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?)?$/;
function isIsoDate(value) {
 
  return typeof value === "string" && ISO_DATE_RE.test(value) && !Number.isNaN(Date.parse(value));
}

const COLONY_STATUSES = ["forte", "normale", "faible", "morte"];

// Trouve la ruche du chemin, ou envoie un 404 et renvoie undefined.
function findHiveOr404(req, res) {
  const hive = hives.find((h) => h.id === req.params.id);
  if (!hive) {
    sendProblem(res, 404, `Aucune ruche ne porte l'identifiant ${req.params.id}.`);
  }
  return hive;
}

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
  const hive = findHiveOr404(req, res);
  if (!hive) return;

  res.json(hive);
});


// Mesures


// POST /api/hives/:id/measures
hivesRouter.post("/:id/measures", (req, res) => {
  const hive = findHiveOr404(req, res);
  if (!hive) return;

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

// GET /api/hives/:id/measures?limit=50&offset=0
hivesRouter.get("/:id/measures", (req, res) => {
  const hive = findHiveOr404(req, res);
  if (!hive) return;

  const limit = parseIntParam(req.query.limit, 50, 1, 500);
  if (limit === null) {
    return sendProblem(res, 400, "Le paramètre limit doit être un entier compris entre 1 et 500.");
  }

  const offset = parseIntParam(req.query.offset, 0, 0, Number.MAX_SAFE_INTEGER);
  if (offset === null) {
    return sendProblem(res, 400, "Le paramètre offset doit être un entier positif ou nul.");
  }

  const items = measures
    .filter((m) => m.hive_id === hive.id)
    // filter crée une copie : le tri ne modifie pas le tableau measures.
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
    .slice(offset, offset + limit); // la page demandée

  res.json({ items, limit, offset });
});


// Inspections


// GET /api/hives/:id/inspections 
hivesRouter.get("/:id/inspections", (req, res) => {
  const hive = findHiveOr404(req, res);
  if (!hive) return;

  const items = inspections
    .filter((i) => i.hive_id === hive.id)
    .sort((a, b) => Date.parse(b.inspected_at) - Date.parse(a.inspected_at));

  res.json({ items });
});

// POST /api/hives/:id/inspections 
hivesRouter.post("/:id/inspections", (req, res) => {
  const hive = findHiveOr404(req, res);
  if (!hive) return;

  const body = req.body ?? {};

  // 400 : un message précis par champ, pour que le client sache quoi corriger.
  if (typeof body.id !== "string" || !UUID_RE.test(body.id)) {
    return sendProblem(res, 400, "Le champ id est obligatoire et doit être un UUID.");
  }
  if (!isIsoDate(body.inspected_at)) {
    return sendProblem(res, 400, "Le champ inspected_at est obligatoire et doit être une date ISO 8601.");
  }
  if (!COLONY_STATUSES.includes(body.colony_status)) {
    return sendProblem(res, 400, "Le champ colony_status doit valoir forte, normale, faible ou morte.");
  }
  if (body.queen_present !== undefined && typeof body.queen_present !== "boolean") {
    return sendProblem(res, 400, "Le champ queen_present doit être un booléen (true ou false).");
  }
  if (body.observations !== undefined && typeof body.observations !== "string") {
    return sendProblem(res, 400, "Le champ observations doit être un texte.");
  }

  // 409 : l'application a déjà envoyé cette inspection (double envoi).
  if (inspections.some((i) => i.id === body.id)) {
    return sendProblem(res, 409, `Une inspection porte déjà l'identifiant ${body.id}.`);
  }

  // On ne garde que les champs du contrat (un champ inconnu dans le corps est ignoré).
  // Un champ facultatif absent vaut undefined et n'apparaît pas dans le JSON.
  const inspection = {
    id: body.id,
    hive_id: hive.id,
    inspected_at: body.inspected_at,
    colony_status: body.colony_status,
    queen_present: body.queen_present,
    observations: body.observations,
  };
  inspections.push(inspection);

  res.status(201).json(inspection);
});
