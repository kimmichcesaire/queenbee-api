const NODE_ENVS = ["development", "production", "test"];
const STORAGES = ["postgres", "memory"];

function fail(message) {
  console.error(`Configuration invalide : ${message}`);
  console.error("Vérifiez votre fichier .env (modèle : .env.example).");
  process.exit(1);
}

// Lit un entier dans une plage, avec une valeur par défaut.
function readInt(name, defaut, min, max) {
  const raw = process.env[name] ?? String(defaut);
  if (!/^\d+$/.test(raw) || Number(raw) < min || Number(raw) > max) {
    fail(`${name} doit être un entier entre ${min} et ${max} (reçu : "${raw}").`);
  }
  return Number(raw);
}

// PORT : entier de 1 à 65535, 3000 par défaut.
const port = readInt("PORT", 3000, 1, 65535);

// NODE_ENV : development, production ou test, development par défaut.
const nodeEnv = process.env.NODE_ENV ?? "development";
if (!NODE_ENVS.includes(nodeEnv)) {
  fail(`NODE_ENV doit valoir ${NODE_ENVS.join(", ")} (reçu : "${nodeEnv}").`);
}

// STORAGE : postgres (par défaut) ou memory.
const storage = process.env.STORAGE ?? "postgres";
if (!STORAGES.includes(storage)) {
  fail(`STORAGE doit valoir ${STORAGES.join(" ou ")} (reçu : "${storage}").`);
}

// Base de données. Aucune valeur par défaut pour un mot de passe.
const db = {
  host: process.env.DB_HOST ?? "localhost",
  port: readInt("DB_PORT", 5432, 1, 65535),
  user: process.env.DB_USER ?? "queenbee",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME ?? "queenbee",
  poolMax: readInt("DB_POOL_MAX", 10, 1, 100),
};
if (storage === "postgres" && db.password === "") {
  fail("DB_PASSWORD est obligatoire quand STORAGE vaut postgres.");
}

export const config = {
  port,
  nodeEnv,
  storage,
  db,
};
