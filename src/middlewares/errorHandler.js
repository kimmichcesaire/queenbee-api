import { sendProblem } from "../utils/problem.js";
import { NotFoundError, ValidationError, ConflictError } from "../errors.js";

// Route inconnue : un 404 au format RFC 9457, au lieu de la page HTML d'Express.
export function notFoundHandler(req, res) {
  sendProblem(res, 404, `Aucune route ne correspond à ${req.method} ${req.originalUrl}.`);
}

// C'est ICI, qu'une erreur métier devient un code HTTP.
export function errorHandler(err, req, res, next) {
  if (err instanceof ValidationError) return sendProblem(res, 400, err.message);
  if (err instanceof NotFoundError) return sendProblem(res, 404, err.message);
  if (err instanceof ConflictError) return sendProblem(res, 409, err.message);

  // Erreur levée par express.json() quand le corps n'est pas du JSON valide.
  if (err.type === "entity.parse.failed") {
    return sendProblem(res, 400, "Le corps de la requête n'est pas un JSON valide.");
  }

  console.error(err);
  sendProblem(res, 500, "Une erreur interne est survenue.");
}
