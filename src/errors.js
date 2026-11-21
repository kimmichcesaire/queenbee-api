export class AppError extends Error {
  constructor(message, status) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
  }
}

// Les données reçues ne respectent pas une règle (400).
export class ValidationError extends AppError {
  constructor(message) { super(message, 400); }
}

// 401 : « je ne sais pas qui vous êtes » (jeton absent, invalide ou expiré).
export class UnauthorizedError extends AppError {
  constructor(message) { super(message, 401); }
}

// 403 : « je sais qui vous êtes, mais vous n'avez pas le droit ».
export class ForbiddenError extends AppError {
  constructor(message) { super(message, 403); }
}

// Une ressource demandée n'existe pas (404).
export class NotFoundError extends AppError {
  constructor(message) { super(message, 404); }
}

// La ressource existe déjà (409).
export class ConflictError extends AppError {
  constructor(message) { super(message, 409); }
}
