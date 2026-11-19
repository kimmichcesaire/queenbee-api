import { ValidationError } from "../errors.js";

const RANGES = {
  position_lat: [-90, 90],
  position_lon: [-180, 180],
  weight_kg: [0, 150],
  temp_internal_c: [-10, 60],
  temp_external_c: [-20, 60],
  humidity_pct: [0, 100],
  acoustic_activity_score: [0, 1],
  battery_pct: [0, 100],
};


function parseIntParam(value, defaut, min, max) {
  if (value === undefined) return defaut;
  if (!/^\d+$/.test(value)) return null; // que des chiffres
  const n = Number(value);
  if (n < min || n > max) return null;
  return n;
}


export function createMeasuresService({ hivesService, measuresRepository }) {
  return {
    async add(hiveId, data) {
      const hive = await hivesService.getById(hiveId);
      const body = data ?? {};

      if (body.timestamp === undefined || body.weight_kg === undefined) {
        throw new ValidationError("Les champs timestamp et weight_kg sont obligatoires.");
      }
      if (body.hive_id !== undefined && body.hive_id !== hive.id) {
        throw new ValidationError(
          `Le hive_id du corps (${body.hive_id}) ne correspond pas à celui du chemin (${hive.id}).`
        );
      }

      // Chaque champ présent doit être un nombre dans sa plage physique.
      for (const [champ, [min, max]] of Object.entries(RANGES)) {
        const valeur = body[champ];
        if (valeur === undefined) continue;
        if (typeof valeur !== "number" || !Number.isFinite(valeur) || valeur < min || valeur > max) {
          throw new ValidationError(
            `Le champ ${champ} doit être un nombre compris entre ${min} et ${max} (reçu : ${JSON.stringify(valeur)}).`
          );
        }
      }

      // On garde le timestamp de la trame (instant de la mesure, pas de la réception).
      return measuresRepository.add({ ...body, hive_id: hive.id });
    },

    // Une page de mesures. limit et offset arrivent bruts (chaînes ou undefined).
    async list(hiveId, { limit: rawLimit, offset: rawOffset } = {}) {
      await hivesService.getById(hiveId);

      const limit = parseIntParam(rawLimit, 50, 1, 500);
      if (limit === null) {
        throw new ValidationError("Le paramètre limit doit être un entier compris entre 1 et 500.");
      }
      const offset = parseIntParam(rawOffset, 0, 0, Number.MAX_SAFE_INTEGER);
      if (offset === null) {
        throw new ValidationError("Le paramètre offset doit être un entier positif ou nul.");
      }

      const items = await measuresRepository.findByHive(hiveId, { limit, offset });
      return { items, limit, offset };
    },
  };
}
