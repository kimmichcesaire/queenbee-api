import { ValidationError } from "../errors.js";

function parseIntParam(value, defaut, min, max) {
  if (value === undefined) return defaut;
  if (!/^\d+$/.test(value)) return null;
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

      // On garde le timestamp de la trame (instant de la mesure, pas de la réception).
      return measuresRepository.add({ ...body, hive_id: hive.id });
    },

    // Une page de mesures. limit et offset arrivent bruts (chaînes ou undefined).
    async list(hiveId, { limit: rawLimit, offset: rawOffset } = {}) {
      await hivesService.getById(hiveId); // 404 avant 400, comme dans le contrat

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
