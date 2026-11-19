import { readFileSync } from "node:fs";

// Quelques ruches copiées du jeu de données (deux sites)
export const hives = [
  { id: "SN-CASA-001", site_id: "SN-CASA", status: "active" },
  { id: "SN-CASA-002", site_id: "SN-CASA", status: "active" },
  { id: "SN-CASA-003", site_id: "SN-CASA", status: "active" },
  { id: "CI-AGBO-001", site_id: "CI-AGBO", status: "active" },
  { id: "CI-AGBO-049", site_id: "CI-AGBO", status: "inactive" },
];


const FICHIER = "data/mesures-SN-CASA-2026-10-31.ndjson";
const ids = new Set(hives.map((h) => h.id));

export const measures = readFileSync(FICHIER, "utf8")
  .split("\n")
  .filter((ligne) => ligne.trim() !== "")
  .map((ligne) => JSON.parse(ligne))
  .filter((m) => ids.has(m.hive_id));

// Les inspections, en mémoire (vides au démarrage).
export const inspections = [];
