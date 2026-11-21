import Joi from "joi";

// Un schéma Joi.object refuse tout champ qu'il ne déclare pas : un client ne peut donc pas
// glisser un champ inattendu (par exemple un author_id dans une inspection).

// GET /api/hives : ?site_id= facultatif. Vide (?site_id=) est accepté et ne filtre rien.
export const hivesQuerySchema = Joi.object({
  site_id: Joi.string().allow(""),
});

// Les paramètres de requête arrivent en chaînes : Joi les convertit et applique les défauts.
export const paginationSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(500).default(50),
  offset: Joi.number().integer().min(0).default(0),
});

// Trame du § 6.5, avec les plages physiques du TP 4. Un champ facultatif peut valoir null.
export const measureSchema = Joi.object({
  hive_id: Joi.string(),
  site_id: Joi.string(),
  timestamp: Joi.date().iso().required(),
  position_lat: Joi.number().min(-90).max(90).allow(null),
  position_lon: Joi.number().min(-180).max(180).allow(null),
  weight_kg: Joi.number().min(0).max(150).required(),
  temp_internal_c: Joi.number().min(-10).max(60).allow(null),
  temp_external_c: Joi.number().min(-20).max(60).allow(null),
  humidity_pct: Joi.number().integer().min(0).max(100).allow(null),
  acoustic_activity_score: Joi.number().min(0).max(1).allow(null),
  battery_pct: Joi.number().integer().min(0).max(100).allow(null),
});

export const COLONY_STATUSES = ["forte", "normale", "faible", "morte"];

// Inspection saisie dans l'application mobile. L'id (UUID) est choisi par l'application.
export const inspectionSchema = Joi.object({
  id: Joi.string().guid().required(),
  hive_id: Joi.string(),
  inspected_at: Joi.date().iso().max("now").required()
    .messages({ "date.max": "{{#label}} ne peut pas être dans le futur." }),
  colony_status: Joi.string().valid(...COLONY_STATUSES).required(),
  queen_present: Joi.boolean().allow(null),
  observations: Joi.string().max(2000).allow("", null),
});

// --- Authentification ---

// tlds: { allow: false } : sinon les adresses en .test du jeu de données seraient refusées.
const email = Joi.string().email({ tlds: { allow: false } }).max(254);

export const loginSchema = Joi.object({
  email: email.required(),
  password: Joi.string().required(),
});

export const refreshSchema = Joi.object({
  refresh_token: Joi.string().required(),
});

// Création de compte (admin) : site_id est lié au rôle.
export const registerSchema = Joi.object({
  email: email.required(),
  password: Joi.string().min(12).max(72).required(), // bcrypt ignore tout au-delà de 72 octets
  role: Joi.string().valid("apiculteur", "coordinateur", "gestionnaire", "admin").required(),
  site_id: Joi.when("role", {
    is: Joi.valid("apiculteur", "coordinateur"),
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),
});
