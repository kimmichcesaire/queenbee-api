# Queen Bee — API

API de suivi des ruches (module Node.js). État : **jour 2 en cours** (données dans PostgreSQL).

## Démarrage

```powershell
docker compose up -d                 # base PostgreSQL
copy .env.example .env               # puis remplir les valeurs (DB_PASSWORD…)
npm install
npm run dev                          # http://localhost:3000
npm test                             # tests (node:test)
```

- Contrat de l'API : [docs/api.md](docs/api.md)
- Collection Postman : `postman/collections/Queen Bee API/` (variable `baseUrl` = `http://localhost:3000`)
- Stockage : `STORAGE=postgres` (par défaut) ou `STORAGE=memory` (ruches du jour 1) dans `.env`

## Organisation du code

```
src/
  app.js, server.js, config.js, errors.js, db.js
  routes/hives/            routeur : URL et verbe
  controllers/             lit la requête, écrit la réponse
  services/                règles métier (validation, plages physiques)
  repositories/memory/     données en mémoire (jour 1)
  repositories/postgres/   requêtes SQL paramétrées (jour 2)
  middlewares/             journal des requêtes, erreurs RFC 9457
  utils/problem.js         format d'erreur RFC 9457
test/                      tests unitaires des services
scripts/import-measures.js import en masse (TP 5)
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

Le fichier est 30 fois plus petit. L'import bloquant ne dure qu'environ 26 ms, donc /ping attend juste que quelques millisecondes de plus que d'habitude. Le blocage existe toujours, mais il est trop court pour etre remarqué, il grandit avec la taille du fichier.
