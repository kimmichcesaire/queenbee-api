import { ValidationError, ConflictError } from "../errors.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?)?$/;
function isIsoDate(value) {
  return typeof value === "string" && ISO_DATE_RE.test(value) && !Number.isNaN(Date.parse(value));
}

const COLONY_STATUSES = ["forte", "normale", "faible", "morte"];

export function createInspectionsService({ hivesService, inspectionsRepository }) {
  return {
    async list(hiveId) {
      await hivesService.getById(hiveId);
      return inspectionsRepository.findByHive(hiveId);
    },

    async add(hiveId, data) {
      const hive = await hivesService.getById(hiveId);
      const body = data ?? {};

      // Un message précis par champ, pour que le client sache quoi corriger.
      if (typeof body.id !== "string" || !UUID_RE.test(body.id)) {
        throw new ValidationError("Le champ id est obligatoire et doit être un UUID.");
      }
      if (!isIsoDate(body.inspected_at)) {
        throw new ValidationError("Le champ inspected_at est obligatoire et doit être une date ISO 8601.");
      }
      if (!COLONY_STATUSES.includes(body.colony_status)) {
        throw new ValidationError("Le champ colony_status doit valoir forte, normale, faible ou morte.");
      }
      if (body.queen_present !== undefined && typeof body.queen_present !== "boolean") {
        throw new ValidationError("Le champ queen_present doit être un booléen (true ou false).");
      }
      if (body.observations !== undefined && typeof body.observations !== "string") {
        throw new ValidationError("Le champ observations doit être un texte.");
      }

      // Double envoi de l'application mobile : on refuse le doublon.
      if (await inspectionsRepository.findById(body.id)) {
        throw new ConflictError(`Une inspection porte déjà l'identifiant ${body.id}.`);
      }

      return inspectionsRepository.add({
        id: body.id,
        hive_id: hive.id,
        inspected_at: body.inspected_at,
        colony_status: body.colony_status,
        queen_present: body.queen_present,
        observations: body.observations,
      });
    },
  };
}
