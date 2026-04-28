# Migration vers ton backend Laravel

## Ce que j'ai trouvé dans ton ZIP

**Stack backend** : Laravel 8 + Sanctum (token Bearer, pas cookies SPA), CORS ouvert (`*`), pas de CSRF requis sur `/api/*`.

**Endpoints disponibles** (tous sous `/api`, tous protégés sauf `/auth/login`) :

| Endpoint | Usage |
|---|---|
| `POST /auth/login` | Retourne `{ user, token }` |
| `POST /auth/logout` | Invalide le token courant |
| `GET /auth/me` | Renvoie l'user connecté |
| `GET/POST/PUT/DELETE /patients` | CRUD patients |
| `GET /patients/search?q=` | Recherche |
| `GET /triage/en-attente` | File d'attente triage |
| `POST /triages` | Effectue un triage (couleur rouge/orange/jaune/vert) |
| `POST /constantes` | Enregistre les constantes |
| `POST /consultations` | Crée une consultation |
| `POST /consultations/{id}/cloture` | Clôture |
| `GET /dashboard/stats` | Stats temps réel |
| `GET /users` | Liste utilisateurs (admin) |
| `GET/POST/PUT/DELETE /services` | CRUD services |

**Modèle de données Laravel** (différent de Supabase) :
- `users` : `nom`, `prenom`, `email`, `role` (`infirmier` / `medecin` / `administrateur` / `direction`), `service_id`, `actif`
- `patients` : `numero_dossier`, `nom`, `prenom`, `date_naissance`, `telephone`, `contact_urgence`, `antecedents`
- `passages` : `patient_id`, `date_arrivee`, `statut` (`en_attente_triage` / `en_attente_medecin` / `en_consultation` / `sorti`), `triage_couleur`
- `triages` : `passage_id`, `couleur`, `symptomes`
- `constantes`, `consultations`, `services`

## Approche technique

1. **Client API typé** (`src/lib/api.ts`) :
   - Base URL via `VITE_API_URL` (défaut `http://localhost:8000/api`)
   - Token stocké dans `localStorage` (`caretrack_token`)
   - Ajout auto du header `Authorization: Bearer ...` + `Accept: application/json`
   - Helpers `apiGet`, `apiPost`, `apiPut`, `apiDelete` avec gestion d'erreurs
   - Types TypeScript pour User, Patient, Passage, Triage, Constante, Consultation

2. **Nouveau `AuthProvider`** (`src/lib/auth.tsx`) :
   - Supprime tout Supabase
   - `signIn(email, password)` → `POST /auth/login`, stocke token
   - Au mount : si token présent → `GET /auth/me`
   - `signOut` → `POST /auth/logout`
   - Rôles directement depuis `user.role` (un seul rôle Laravel-style)
   - Flags `isAdmin`, `isMedecin`, `isInfirmier`, `isDirection`

3. **Pages réécrites** pour utiliser l'API :
   - `login.tsx` : email + password → `signIn`
   - `dashboard.tsx` : `GET /dashboard/stats` (polling 5 s, vrai temps réel non possible via Laravel API REST)
   - `patients.index.tsx` : `GET /patients` + recherche
   - `patients.new.tsx` : `POST /patients`
   - `patients.$patientId.tsx` : `GET /patients/{id}` (avec passages, triage, constantes, consultations imbriqués)
   - `visits.new.tsx` : devient redirection vers création patient (un patient = un passage auto)
   - `visits.$visitId.triage.tsx` : `POST /triages` + `POST /constantes`
   - `visits.$visitId.index.tsx` : détail passage + `POST /consultations`
   - `admin.tsx` : `GET /users`, attribution rôle via `PUT /users/{id}`, toggle `actif`

4. **Suppression Supabase côté code** :
   - Plus aucun import de `@/integrations/supabase/client` dans les pages
   - Les fichiers `supabase/*` restent (générés auto) mais inutilisés
   - `_app.tsx` : guard basé sur token + user.actif

5. **Configuration locale** :
   - Ajout `VITE_API_URL=http://localhost:8000/api` dans un fichier `.env.local` documenté dans README
   - Fallback : si pas défini → `http://localhost:8000/api`

## Limitations à connaître

- **Pas de temps réel** (Laravel REST seul) → polling 5 s sur le dashboard et la file de triage
- **API en localhost** → l'app Lovable hébergée ne pourra appeler l'API que depuis ta machine (CORS OK mais le navigateur d'un autre user n'atteint pas ton 127.0.0.1). Pour partager : `ngrok http 8000` puis `VITE_API_URL=https://xxx.ngrok.app/api`
- **Modèle simplifié** : un user = un seul rôle (Laravel `enum`), donc je remplace l'ancien système multi-rôles Supabase par un select unique

## Étapes d'exécution

1. Créer `src/lib/api.ts` (client + types)
2. Réécrire `src/lib/auth.tsx`
3. Adapter `src/routes/login.tsx`
4. Adapter `src/routes/_app.tsx` + `Navbar`
5. Réécrire les 8 pages métier
6. Petit guide de lancement (commentaire dans `.env.example`)

Garde le design actuel (animations, glass, EKG, gradients) — je ne touche qu'à la couche données.
