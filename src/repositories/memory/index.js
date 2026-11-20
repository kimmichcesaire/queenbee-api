import { seedHives, loadSeedMeasures } from "./seed.js";
import { createHivesRepository } from "./hives.repository.js";
import { createMeasuresRepository } from "./measures.repository.js";
import { createInspectionsRepository } from "./inspections.repository.js";

// Les trois repositories en mémoire 
export function createMemoryRepositories() {
  return {
    hivesRepository: createHivesRepository(seedHives),
    measuresRepository: createMeasuresRepository(loadSeedMeasures(seedHives.map((h) => h.id))),
    inspectionsRepository: createInspectionsRepository(),
  };
}
