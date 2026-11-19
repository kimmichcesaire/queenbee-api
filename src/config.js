
const NODE_ENVS = ["development", "production", "test"];

function fail(message) {
  console.error(`Configuration invalide : ${message}`);
  console.error("Vérifiez votre fichier .env (modèle : .env.example).");
  process.exit(1);
}


const rawPort = process.env.PORT ?? "3000";
if (!/^\d+$/.test(rawPort) || Number(rawPort) < 1 || Number(rawPort) > 65535) {
  fail(`PORT doit être un entier entre 1 et 65535 (reçu : "${rawPort}").`);
}


const nodeEnv = process.env.NODE_ENV ?? "development";
if (!NODE_ENVS.includes(nodeEnv)) {
  fail(`NODE_ENV doit valoir ${NODE_ENVS.join(", ")} (reçu : "${nodeEnv}").`);
}

export const config = {
  port: Number(rawPort),
  nodeEnv,
};
