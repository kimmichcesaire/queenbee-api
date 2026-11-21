import { createHivesRepository } from "./hives.repository.js";
import { createMeasuresRepository } from "./measures.repository.js";
import { createInspectionsRepository } from "./inspections.repository.js";
import { createUsersRepository } from "./users.repository.js";

// Les repositories PostgreSQL, sous les noms qu'attend createApp.
export function createPostgresRepositories(pool) {
  return {
    hivesRepository: createHivesRepository(pool),
    measuresRepository: createMeasuresRepository(pool),
    inspectionsRepository: createInspectionsRepository(pool),
    usersRepository: createUsersRepository(pool),
  };
}
