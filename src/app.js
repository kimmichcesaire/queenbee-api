import express from "express";

export const app = express();

// Transforme le corps JSON des requêtes en objet dans req.body.
// À déclarer AVANT les routes, sinon req.body vaut undefined.
app.use(express.json());

// Route de santé : sert à vérifier que le serveur répond (supervision, déploiement).
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});
