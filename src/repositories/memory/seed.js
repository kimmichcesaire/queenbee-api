import { readFileSync } from "node:fs";


export const seedHives = [
  { id: "SN-CASA-001", site_id: "SN-CASA", status: "active" },
  { id: "SN-CASA-002", site_id: "SN-CASA", status: "active" },
  { id: "SN-CASA-003", site_id: "SN-CASA", status: "active" },
  { id: "CI-AGBO-001", site_id: "CI-AGBO", status: "active" },
  { id: "CI-AGBO-049", site_id: "CI-AGBO", status: "inactive" },
];


export function loadSeedMeasures(hiveIds, fichier = "data/mesures-SN-CASA-2026-10-31.ndjson") {
  const ids = new Set(hiveIds);
  return readFileSync(fichier, "utf8")
    .split("\n")
    .filter((ligne) => ligne.trim() !== "")
    .map((ligne) => JSON.parse(ligne))
    .filter((m) => ids.has(m.hive_id));
}
