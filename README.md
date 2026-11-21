# Queen Bee — API

API de suivi des ruches (module Node.js). État : **jour 2 terminé** (PostgreSQL, validation Joi, authentification JWT, synchronisation idempotente).

## Démarrage

```powershell
docker compose up -d                 # base PostgreSQL
copy .env.example .env               # puis remplir : DB_PASSWORD, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
npm install
npm run dev                          # http://localhost:3000
npm test                             # tests (node:test)
```

Générer un secret JWT : `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` (deux secrets différents).

- Contrat de l'API : [docs/api.md](docs/api.md)
- Collection Postman : `postman/collections/Queen Bee API/` (variable `baseUrl` = `http://localhost:3000` ; la requête « Connexion » range le jeton dans la variable `token`)
- Comptes de démonstration (base locale uniquement) : `admin@queenbee.test`, `gestion@queenbee.test`, `coord.sn-casa@queenbee.test`, `api1.sn-casa@queenbee.test`

## Organisation du code

```
src/
  app.js, server.js, config.js, errors.js, db.js
  routes/                  routeurs : URL, verbe, intergiciels (auth, validation)
  controllers/             lit la requête, écrit la réponse
  services/                règles métier, contrôle d'accès (canAccessHive), authentification, synchronisation
  repositories/postgres/   requêtes SQL paramétrées
  middlewares/             journal, authentification, validation Joi, erreurs RFC 9457
  validators/              schémas Joi et messages en français
test/                      tests unitaires (services, schémas, contrôle d'accès, idempotence)
scripts/                   import en masse (TP 5), vérifications (TP 6)
```

## TP 8 — Synchronisation idempotente

Une requête rejouée (réseau coupé, nouvel essai) ne crée jamais de doublon :

| Requête                                   | 1er envoi | Envoi rejoué                     |
|-------------------------------------------|-----------|----------------------------------|
| `POST /api/hives/:id/measures`            | 201       | 200 (même ruche + même instant)  |
| `POST /api/hives/:id/inspections`         | 201       | 200 (même id) ; 409 si l'id appartient à une autre ruche |
| `POST /api/inspections/sync` (lot)        | `created` | `unchanged`                      |

Le lot est traité élément par élément : une inspection refusée (`rejected`) n'empêche pas les autres d'être enregistrées.

### Règle de conflit : le serveur l'emporte

Chaque inspection porte une `version`, augmentée de 1 à chaque modification enregistrée.
Une modification n'est appliquée que si la `version` envoyée par l'appareil est celle du serveur ; sinon, l'élément revient en `conflict` et rien n'est écrasé.
La réponse contient alors la version du serveur (`current`) : l'appareil la reprend, et l'apiculteur refait sa modification dessus s'il le souhaite.

## TP 7 — Authentification et autorisation

| Rôle         | Ruches visibles      | Peut envoyer                 |
|--------------|----------------------|------------------------------|
| admin        | toutes               | des mesures, des comptes     |
| gestionnaire | toutes               | rien                         |
| coordinateur | celles de son site   | des inspections              |
| apiculteur   | les siennes          | des inspections              |

Une ruche inexistante renvoie 404 ; une ruche existante mais hors des droits renvoie 403. Un compte est bloqué 15 minutes après 5 mots de passe faux.

### Journal des requêtes interdites

| Requête interdite      | Connecté en                  | Requête                                                   | Code attendu | Code obtenu |
|------------------------|------------------------------|-----------------------------------------------------------|--------------|-------------|
| Ressource d'un autre site | coord.sn-casa@queenbee.test | `GET /api/hives?site_id=CI-AGBO`                          | 403          | 403 « Vous n'avez pas accès au site CI-AGBO. » |
| Rôle insuffisant       | api1.sn-casa@queenbee.test   | `POST /api/hives/SN-CASA-001/measures`                    | 403          | 403 « Action réservée aux rôles suivants : admin. » |
| Jeton expiré           | n'importe quel compte        | `GET /api/hives` avec `JWT_ACCESS_TTL=10s`, après 10 s    | 401          | 401 « Jeton d'accès invalide ou expiré. » |
| Jeton falsifié         | n'importe quel compte        | `GET /api/hives` avec une lettre changée dans le jeton    | 401          | 401 « Jeton d'accès invalide ou expiré. » |

Chaque refus est aussi tracé dans le terminal du serveur, par exemple :

```
[accès refusé] 403 POST /api/hives/SN-CASA-001/measures ip=::1 utilisateur=07aa8935-e6be-433f-8e5f-061113d4c7d3
```

## TP 5 — Brancher PostgreSQL

Import de la journée du 31 octobre (4 800 mesures), sur mon poste (Windows, base dans Docker Desktop) :

| Mode          | Durée       |
|---------------|-------------|
| ligne à ligne | 176 791 ms  |
| par lot       | 496 ms      |

### 1. Quel temps obtenez-vous dans chaque mode ? D'où vient l'écart ?

Environ 3 minutes ligne à ligne, contre une demi-seconde par lot (environ 350 fois plus rapide). Ligne à ligne, il y a 4 800 allers-retours avec la base et 4 800 validations, chacune écrite sur disque ; par lot, il n'y a que 5 requêtes et une seule validation (COMMIT) à la fin.

### 2. Si la 2 001e mesure provoquait une erreur, que resterait-il en base dans chaque mode ?

Ligne à ligne, les 2 000 premières mesures resteraient en base, car chacune a été validée séparément : la journée serait à moitié importée. Par lot, il ne resterait rien : l'erreur déclenche un ROLLBACK qui annule toute la transaction, y compris les lots déjà insérés.

### 3. Pourquoi la transaction emprunte-t-elle une connexion avec `pool.connect()` au lieu d'appeler `pool.query()` ?

Une transaction appartient à une seule connexion : BEGIN, les INSERT et COMMIT doivent passer par la même. `pool.query()` prend à chaque appel n'importe quelle connexion libre, donc les INSERT pourraient partir sur une autre connexion que le BEGIN, hors de la transaction.

### 4. Que se passerait-il si `client.release()` n'était pas dans le `finally`, et qu'une erreur survenait dix fois de suite ?

À chaque erreur, la connexion empruntée ne serait jamais rendue au pool (fuite de connexions). Après dix erreurs, les dix connexions du pool (`DB_POOL_MAX=10`) seraient toutes perdues : la requête suivante attendrait une connexion libre, puis échouerait au bout de 5 secondes (`connectionTimeoutMillis`), et toute l'API serait bloquée.

## TP 1 — Lire les mesures sans bloquer

Mesures relevées sur mon poste (Node.js v24.16.0) :

| Fichier  | Lecture   | Durée de l'import (ms) | Pire temps de /ping (ms) |
|----------|-----------|------------------------|--------------------------|
| 1 jour   | bloquante | 26                     | 16                       |
| 1 jour   | en flux   | 22                     | 6                        |
| 30 jours | bloquante | 312                    | 299                      |
| 30 jours | en flux   | 327                    | 5                        |

Contrôle : 4 800 mesures / 37,87 kg (1 jour) et 144 000 mesures / 38,74 kg (30 jours), identiques pour les deux routes.

### 1. Pourquoi /ping attend-il pendant l'import bloquant ?

Node.js exécute le JavaScript sur un seul fil, la boucle d'événements. `readFileSync` puis la boucle de `JSON.parse` l'occupent du début à la fin de l'import : la requête /ping reste dans la file d'attente jusqu'à ce que l'import soit terminé (299 ms d'attente pour 312 ms d'import).

### 2. La lecture en flux est-elle plus rapide ? Sinon, qu'apporte-t-elle ?

Non, elle est même légèrement plus lente (327 ms contre 312 ms), à cause du découpage en morceaux. Par contre, la boucle d'événements reprend la main entre deux morceaux, donc les autres requêtes sont servies pendant l'import (/ping à 5 ms au lieu de 299 ms). En plus, le fichier n'est jamais chargé entièrement en mémoire.

### 3. Pourquoi l'effet est-il presque invisible avec le fichier d'une journée ?

Le fichier est 30 fois plus petit. L'import bloquant ne dure qu'environ 26 ms, donc /ping attend juste quelques millisecondes de plus que d'habitude. Le blocage existe toujours, mais il est trop court pour être remarqué : il grandit avec la taille du fichier.
