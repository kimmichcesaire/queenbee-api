import { test } from "node:test";
import assert from "node:assert/strict";
import { validate } from "../src/middlewares/validate.js";
import { measureSchema, paginationSchema, inspectionSchema } from "../src/validators/schemas.js";
import { ValidationError } from "../src/errors.js";

function run(schema, data, source = "body") {
  const req = { [source]: data };
  validate(schema, source)(req, {}, () => {});
  return req.validated;
}

test("refuse un poids hors de sa plage physique", () => {
  assert.throws(
    () => run(measureSchema, { timestamp: "2026-10-31T00:00:00Z", weight_kg: 500 }),
    ValidationError,
  );
});

test("refuse un poids qui n'est pas un nombre", () => {
  assert.throws(
    () => run(measureSchema, { timestamp: "2026-10-31T00:00:00Z", weight_kg: "abc" }),
    ValidationError,
  );
});

test("donne toutes les erreurs d'un coup, en français", () => {
  assert.throws(
    () => run(measureSchema, { timestamp: "2026-11-06T08:00:00Z", weight_kg: 500, humidity_pct: 120 }),
    { message: "weight_kg doit être inférieur ou égal à 150. humidity_pct doit être inférieur ou égal à 100." },
  );
});

test("pagination : convertit les chaînes et applique les défauts", () => {
  assert.deepEqual(run(paginationSchema, {}, "query"), { limit: 50, offset: 0 });
  assert.deepEqual(run(paginationSchema, { limit: "10", offset: "20" }, "query"), { limit: 10, offset: 20 });
  assert.throws(() => run(paginationSchema, { limit: "abc" }, "query"), ValidationError);
  assert.throws(() => run(paginationSchema, { limit: "501" }, "query"), ValidationError);
});

test("refuse un champ non déclaré dans une inspection", () => {
  assert.throws(
    () => run(inspectionSchema, {
      id: "3f1c2a9e-8b7d-4c6e-9f10-2a3b4c5d6e7f",
      inspected_at: "2026-11-01T09:00:00Z",
      colony_status: "forte",
      author_id: "x",
    }),
    { message: "author_id n'est pas un champ autorisé." },
  );
});
