import { sendProblem } from "../utils/problem.js";
import { AppError } from "../errors.js";

const PG_BAD_REQUEST = ["23503", "23514", "22P02"];

// Route inconnue : un 404 au format RFC 9457, au lieu de la page HTML d'Express.
export function notFoundHandler(req, res) {
  sendProblem(res, 404, `Aucune route ne correspond à ${req.method} ${req.originalUrl}.`);
}

export function errorHandler(err, req, res, next) {
  // Nos erreurs : elles portent leur code HTTP.
  if (err instanceof AppError) {
    return sendProblem(res, err.status, err.message);
  }

  // Erreurs levées par express.json().
  if (err.type === "entity.parse.failed") {
    return sendProblem(res, 400, "Le corps de la requête n'est pas un JSON valide.");
  }
  if (err.type === "entity.too.large") {
    return sendProblem(res, 413, "Le corps de la requête dépasse la taille maximale (1 Mo).");
  }

  // Erreurs PostgreSQL : traduites, jamais recopiées.
  if (err.code === "23505") {
    return sendProblem(res, 409, "Cette ressource existe déjà.");
  }
  if (PG_BAD_REQUEST.includes(err.code)) {
    return sendProblem(res, 400, "Une valeur de la requête n'est pas acceptée par la base de données.");
  }

  // Tout le reste est un bug : la pile va dans le journal du serveur, jamais dans la réponse.
  console.error(err);
  sendProblem(res, 500, "Une erreur interne est survenue.");
}
