import { test } from "node:test";
import assert from "node:assert/strict";
import { createMeasuresService } from "../src/services/measures.service.js";
import { ValidationError, NotFoundError } from "../src/errors.js";


const fakeHivesService = {
  async getById(id) {
    if (id !== "SN-CASA-001") throw new NotFoundError(`Aucune ruche ne porte l'identifiant ${id}.`);
    return { id, site_id: "SN-CASA", status: "active" };
  },
};


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

  const measure = await service.add("SN-CASA-001", validMeasure);

  assert.equal(measuresRepository.added.length, 1);
  assert.equal(measure.hive_id, "SN-CASA-001");
  assert.equal(measure.weight_kg, 36.84);
});

test("refuse une trame qui désigne une autre ruche que le chemin", async () => {
  const measuresRepository = createFakeMeasuresRepository();
  const service = createMeasuresService({ hivesService: fakeHivesService, measuresRepository });

  await assert.rejects(
    service.add("SN-CASA-001", { ...validMeasure, hive_id: "SN-CASA-002" }),
    ValidationError,
  );
  assert.equal(measuresRepository.added.length, 0); // rien n'a été enregistré
});

test("refuse une mesure pour une ruche inconnue", async () => {
  const measuresRepository = createFakeMeasuresRepository();
  const service = createMeasuresService({ hivesService: fakeHivesService, measuresRepository });

  await assert.rejects(service.add("XX-NOPE-999", validMeasure), NotFoundError);
  assert.equal(measuresRepository.added.length, 0);
});
