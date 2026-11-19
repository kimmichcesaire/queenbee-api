# Queen Bee — API

API de suivi des ruches (module Node.js). État : **API v0, jour 1** (données en mémoire).

## Démarrage

```powershell
docker compose up -d                 # base PostgreSQL (utilisée à partir du jour 2)
copy .env.example .env               # puis remplir les valeurs
npm install
npm run dev                          # http://localhost:3000
npm test                             # tests (node:test)
```

- Contrat de l'API : [docs/api.md](docs/api.md)
- Collection Postman : `postman/collections/Queen Bee API/` (variable `baseUrl` = `http://localhost:3000`)

## Organisation du code (TP 4)

```
src/
  app.js, server.js, config.js, errors.js
  routes/hives/          routeur : URL et verbe
  controllers/           lit la requête, écrit la réponse
  services/              règles métier (validation, plages physiques)
  repositories/memory/   données en mémoire (remplacées par PostgreSQL au jour 2)
  middlewares/           journal des requêtes, erreurs RFC 9457
  utils/problem.js       format d'erreur RFC 9457
test/                    tests unitaires des services
```

## État du jour 1

Toutes les étapes des TP 1 à 4 sont faites. Rien ne manque.

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
