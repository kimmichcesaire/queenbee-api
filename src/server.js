import { config } from "./config.js";
import { createApp } from "./app.js";
import { seedHives, loadSeedMeasures } from "./repositories/memory/seed.js";
import { createHivesRepository } from "./repositories/memory/hives.repository.js";
import { createMeasuresRepository } from "./repositories/memory/measures.repository.js";
import { createInspectionsRepository } from "./repositories/memory/inspections.repository.js";

// server.js choisit les repositories (ici : en mémoire), crée l'application, puis l'écoute.
const hivesRepository = createHivesRepository(seedHives);
const measuresRepository = createMeasuresRepository(loadSeedMeasures(seedHives.map((h) => h.id)));
const inspectionsRepository = createInspectionsRepository();

const app = createApp({ hivesRepository, measuresRepository, inspectionsRepository });

app.listen(config.port, () => {
  console.log(`API Queen Bee sur http://localhost:${config.port} (${config.nodeEnv})`);
});
