# Contrat de l'API Queen Bee — v0

URL de base : `http://localhost:3000`. Toutes les réponses sont en JSON.

## Format des erreurs (RFC 9457)

Toute erreur renvoie l'en-tête `Content-Type: application/problem+json` et un corps de la forme :

```json
{
  "type": "about:blank",
  "title": "Requête invalide",
  "status": 400,
  "detail": "Le paramètre limit doit être un entier compris entre 1 et 500."
}
```

- `title` : l'intitulé du code, identique pour toutes les erreurs d'un même code.
- `detail` : ce qui s'est passé pour cette requête précise.
- Jamais de pile d'exécution ni de message interne dans une réponse.

| Code | title |
|------|-------|
| 400 | Requête invalide |
| 404 | Ressource introuvable |
| 409 | Conflit |
| 500 | Erreur interne |

Erreurs communes à toutes les routes :

- 400 : le corps de la requête n'est pas un JSON valide.
- 404 : aucune route ne correspond à la méthode et au chemin.
- 500 : erreur inattendue du serveur.

---

### GET /health

Indique que le serveur répond.

Paramètres : aucun.

200 :
```json
{ "status": "ok" }
```

---

### GET /api/hives

Liste des ruches, éventuellement filtrée par site.

Paramètres de requête
- `site_id` : chaîne, facultatif. Absent ou vide : toutes les ruches. Un site inconnu donne une liste vide (pas une erreur).

200 :
```json
[
  { "id": "SN-CASA-001", "site_id": "SN-CASA", "status": "active" },
  { "id": "SN-CASA-002", "site_id": "SN-CASA", "status": "active" }
]
```

---

### GET /api/hives/:id

Une ruche.

Paramètres de chemin
- `id` : chaîne, identifiant de la ruche (ex. `SN-CASA-001`).

200 :
```json
{ "id": "SN-CASA-001", "site_id": "SN-CASA", "status": "active" }
```

404 : aucune ruche ne porte cet identifiant.
```json
{
  "type": "about:blank",
  "title": "Ressource introuvable",
  "status": 404,
  "detail": "Aucune ruche ne porte l'identifiant XX-NOPE-999."
}
```

---

### POST /api/hives/:id/measures

Enregistre une mesure envoyée par la passerelle d'un site. Le `timestamp` est celui de la trame (instant de la mesure), pas celui de la réception.

Paramètres de chemin
- `id` : chaîne, identifiant de la ruche.

Corps (JSON, en-tête `Content-Type: application/json`)
- Obligatoires : `timestamp` (date ISO 8601), `weight_kg` (nombre).
- Facultatifs : `hive_id` (s'il est présent, il doit être égal à `id`), `site_id`, `position_lat`, `position_lon`, `temp_internal_c`, `temp_external_c`, `humidity_pct`, `acoustic_activity_score`, `battery_pct`.

Plages physiques (UC-CY02) : chaque champ présent doit être un nombre compris dans sa plage, bornes incluses.

| Champ | Minimum | Maximum |
|-------|---------|---------|
| `position_lat` | -90 | 90 |
| `position_lon` | -180 | 180 |
| `weight_kg` | 0 | 150 |
| `temp_internal_c` | -10 | 60 |
| `temp_external_c` | -20 | 60 |
| `humidity_pct` | 0 | 100 |
| `acoustic_activity_score` | 0 | 1 |
| `battery_pct` | 0 | 100 |

201 : la mesure enregistrée.
```json
{
  "hive_id": "SN-CASA-001",
  "site_id": "SN-CASA",
  "timestamp": "2026-10-31T10:00:00Z",
  "weight_kg": 36.84,
  "temp_internal_c": 34.4,
  "battery_pct": 88
}
```

400 : `timestamp` ou `weight_kg` manquant, `hive_id` du corps différent de celui du chemin, ou champ hors de sa plage physique (ou qui n'est pas un nombre).
```json
{
  "type": "about:blank",
  "title": "Requête invalide",
  "status": 400,
  "detail": "Le champ weight_kg doit être un nombre compris entre 0 et 150 (reçu : 500)."
}
```

404 : aucune ruche ne porte cet identifiant.

---

### GET /api/hives/:id/measures

Historique des mesures d'une ruche, de la plus récente à la plus ancienne (tri sur `timestamp`).

Paramètres de chemin
- `id` : chaîne, identifiant de la ruche.

Paramètres de requête
- `limit` : entier de 1 à 500, 50 par défaut.
- `offset` : entier positif ou nul, 0 par défaut.

200 :
```json
{
  "items": [
    { "hive_id": "SN-CASA-001", "timestamp": "2026-10-31T23:45:00Z", "weight_kg": 37.12 },
    { "hive_id": "SN-CASA-001", "timestamp": "2026-10-31T23:30:00Z", "weight_kg": 37.10 }
  ],
  "limit": 50,
  "offset": 0
}
```

400 : `limit` ou `offset` invalide (pas un entier, ou hors bornes).
```json
{
  "type": "about:blank",
  "title": "Requête invalide",
  "status": 400,
  "detail": "Le paramètre limit doit être un entier compris entre 1 et 500."
}
```

404 : aucune ruche ne porte cet identifiant.

---

### GET /api/hives/:id/inspections

Inspections d'une ruche, de la plus récente à la plus ancienne (tri sur `inspected_at`).

Paramètres de chemin
- `id` : chaîne, identifiant de la ruche.

200 :
```json
{
  "items": [
    {
      "id": "3f1c2a9e-8b7d-4c6e-9f10-2a3b4c5d6e7f",
      "hive_id": "SN-CASA-001",
      "inspected_at": "2026-10-30T09:15:00Z",
      "colony_status": "forte",
      "queen_present": true,
      "observations": "Couvain compact, bonnes réserves."
    }
  ]
}
```

404 : aucune ruche ne porte cet identifiant.

---

### POST /api/hives/:id/inspections

Enregistre une inspection saisie dans l'application mobile. L'identifiant est un UUID choisi par l'application, pas par le serveur.

Paramètres de chemin
- `id` : chaîne, identifiant de la ruche.

Corps (JSON)
- Obligatoires :
  - `id` : UUID (ex. `3f1c2a9e-8b7d-4c6e-9f10-2a3b4c5d6e7f`) ;
  - `inspected_at` : date ISO 8601 ;
  - `colony_status` : `forte`, `normale`, `faible` ou `morte`.
- Facultatifs :
  - `queen_present` : booléen ;
  - `observations` : texte.

201 : l'inspection créée, avec son `hive_id`.
```json
{
  "id": "3f1c2a9e-8b7d-4c6e-9f10-2a3b4c5d6e7f",
  "hive_id": "SN-CASA-001",
  "inspected_at": "2026-10-30T09:15:00Z",
  "colony_status": "forte",
  "queen_present": true,
  "observations": "Couvain compact, bonnes réserves."
}
```

400 : champ obligatoire manquant ou invalide (`id` qui n'est pas un UUID, date invalide, `colony_status` hors liste, `queen_present` non booléen, `observations` non texte).
```json
{
  "type": "about:blank",
  "title": "Requête invalide",
  "status": 400,
  "detail": "Le champ colony_status doit valoir forte, normale, faible ou morte."
}
```

404 : aucune ruche ne porte cet identifiant.

409 : une inspection porte déjà cet `id`.
