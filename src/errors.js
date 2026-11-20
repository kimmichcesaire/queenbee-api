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

// Une ressource demandée n'existe pas (404).
export class NotFoundError extends AppError {
  constructor(message) { super(message, 404); }
}

// La ressource existe déjà (409).
export class ConflictError extends AppError {
  constructor(message) { super(message, 409); }
}
