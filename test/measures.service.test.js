import { test } from "node:test";
import assert from "node:assert/strict";
import { createMeasuresService } from "../src/services/measures.service.js";
import { ValidationError, NotFoundError } from "../src/errors.js";

// Ici, on teste ce qui a besoin du CONTEXTE (la ruche, l'utilisateur). Les plages et les
// types sont testés dans validators.test.js, à travers le schéma Joi.

// Les services reçoivent maintenant l'utilisateur en premier.
const admin = { id: "u-admin", role: "admin", site_id: null };

// Faux service des ruches : seule SN-CASA-001 existe.
const fakeHivesService = {
  async getHive(user, id) {
    if (id !== "SN-CASA-001") throw new NotFoundError(`Aucune ruche ne porte l'identifiant ${id}.`);
    return { id, site_id: "SN-CASA", owner_id: "u-api1", status: "active" };
  },
};

// Faux repository : garde dans un tableau ce qu'on lui donne.
function createFakeMeasuresRepository() {
  const added = [];
  return {
    added,
    async add(measure) {
      added.push(measure);
      return measure;
    },
    async findByHive() {
      return [];
    },
  };
}

const validMeasure = { timestamp: "2026-10-31T10:00:00Z", weight_kg: 36.84 };

test("enregistre une mesure valide", async () => {
  const measuresRepository = createFakeMeasuresRepository();
  const service = createMeasuresService({ hivesService: fakeHivesService, measuresRepository });

  const measure = await service.addMeasure(admin, "SN-CASA-001", validMeasure);

  assert.equal(measuresRepository.added.length, 1);
  assert.equal(measure.hive_id, "SN-CASA-001");
  assert.equal(measure.weight_kg, 36.84);
});

test("refuse une trame qui désigne une autre ruche que le chemin", async () => {
  const measuresRepository = createFakeMeasuresRepository();
  const service = createMeasuresService({ hivesService: fakeHivesService, measuresRepository });

  await assert.rejects(
    service.addMeasure(admin, "SN-CASA-001", { ...validMeasure, hive_id: "SN-CASA-002" }),
    ValidationError,
  );
  assert.equal(measuresRepository.added.length, 0); // rien n'a été enregistré
});

test("refuse une mesure pour une ruche inconnue", async () => {
  const measuresRepository = createFakeMeasuresRepository();
  const service = createMeasuresService({ hivesService: fakeHivesService, measuresRepository });

  await assert.rejects(service.addMeasure(admin, "XX-NOPE-999", validMeasure), NotFoundError);
  assert.equal(measuresRepository.added.length, 0);
});
