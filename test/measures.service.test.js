import { test } from "node:test";
import assert from "node:assert/strict";
import { createMeasuresService } from "../src/services/measures.service.js";
import { ValidationError } from "../src/errors.js";


function prepare() {
  const enregistrees = [];
  const fauxRepository = {
    async add(measure) {
      enregistrees.push(measure);
      return measure;
    },
    async findByHive() {
      return [];
    },
  };
  const fauxHivesService = {
    async getById(id) {
      return { id, site_id: "SN-CASA", status: "active" };
    },
  };
  const service = createMeasuresService({
    hivesService: fauxHivesService,
    measuresRepository: fauxRepository,
  });
  return { service, enregistrees };
}

test("refuse un poids hors de sa plage physique", async () => {
  
  const { service, enregistrees } = prepare();

 
  const ajout = service.add("SN-CASA-001", { timestamp: "2026-10-31T10:00:00Z", weight_kg: 500 });

  await assert.rejects(ajout, ValidationError);
  assert.equal(enregistrees.length, 0);
});

test("enregistre une mesure valide", async () => {
  
  const { service, enregistrees } = prepare();

  const mesure = await service.add("SN-CASA-001", { timestamp: "2026-10-31T10:00:00Z", weight_kg: 36.84 });

  assert.equal(enregistrees.length, 1);
  assert.equal(mesure.hive_id, "SN-CASA-001");
  assert.equal(mesure.weight_kg, 36.84);
});
