const NODE_ENVS = ["development", "production", "test"];

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

// Lit une valeur obligatoire (un secret) : jamais de valeur par défaut.
function readRequired(name) {
  const value = process.env[name] ?? "";
  if (value === "") {
    fail(`${name} est obligatoire.`);
  }
  return value;
}

// PORT : entier de 1 à 65535, 3000 par défaut.
const port = readInt("PORT", 3000, 1, 65535);

// NODE_ENV : development, production ou test, development par défaut.
const nodeEnv = process.env.NODE_ENV ?? "development";
if (!NODE_ENVS.includes(nodeEnv)) {
  fail(`NODE_ENV doit valoir ${NODE_ENVS.join(", ")} (reçu : "${nodeEnv}").`);
}

// Base de données. Aucune valeur par défaut pour un mot de passe.
const db = {
  host: process.env.DB_HOST ?? "localhost",
  port: readInt("DB_PORT", 5432, 1, 65535),
  user: process.env.DB_USER ?? "queenbee",
  password: readRequired("DB_PASSWORD"),
  database: process.env.DB_NAME ?? "queenbee",
  poolMax: readInt("DB_POOL_MAX", 10, 1, 100),
};


const auth = {
  accessSecret: readRequired("JWT_ACCESS_SECRET"),
  refreshSecret: readRequired("JWT_REFRESH_SECRET"),
  accessTtl: process.env.JWT_ACCESS_TTL ?? "15m",
  refreshTtl: process.env.JWT_REFRESH_TTL ?? "7d",
  maxFailedLogins: 5,
  lockMinutes: 15,
};
if (auth.accessSecret === auth.refreshSecret) {
  fail("JWT_ACCESS_SECRET et JWT_REFRESH_SECRET doivent être différents.");
}

export const config = {
  port,
  nodeEnv,
  db,
  auth,
};
