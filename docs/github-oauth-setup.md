# GitHub OAuth setup

RepoIt authenticates users **exclusively through GitHub OAuth**. The backend
keeps the GitHub client secret; the mobile app never sees a secret or a GitHub
token — it only receives a RepoIt session token.

## 1. Create the OAuth App

GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**.

- **Application name:** `RepoIt` (production) — you can create a second app
  `RepoIt Dev` for development.
- **Homepage URL:** the frontend landing page, e.g. `https://repoit.example.com`.
- **Authorization callback URL:** see step 2 — the value depends on which flow
  variant you run (single default callback; enable **wildcard matching** if you
  need both variants below).
- **Enable device flow:** not needed (we use the web application flow).

GitHub supports PKCE in the web application flow (`code_challenge`/`code_verifier`).
RepoIt uses **both `state` and PKCE**. Scopes: **none** — profile data is
public; we only need the numeric user ID, login and avatar.

## 2. Callback URL variants

### A. Server-completed flow (default, self-host friendly)

Callback URL registered in GitHub:

```
https://api.example.com/api/v1/auth/callback
```

Flow:

1. App calls `GET /api/v1/auth/start?redirect_uri=repoit://auth`.
2. Backend generates `state` + PKCE `code_challenge`, stores them, and redirects
   the device browser to GitHub.
3. GitHub redirects back to the backend callback URL with `code`+`state`.
4. Backend validates `state` (against the stored value, one-time, 10-minute
   expiry), exchanges the code with the `code_verifier` + client secret, fetches
   the GitHub profile, creates/updates the RepoIt user (keyed by **numeric
   GitHub user ID**), creates a session, and finally redirects to
   `repoit://auth?token=...&github_id=...`.
5. The app's deep-link handler picks up the token and stores it securely.

### B. Native-app redirect flow (Expo proxy / dev builds)

Callback URL registered in GitHub: the app's redirect URI, e.g.
`https://auth.expo.io/@yourname/repoit` (Expo proxy) or `repoit://oauth` (dev
build with registered custom scheme).

Flow: the app opens GitHub directly via `expo-auth-session`, receives `code`+
`state` on its own redirect URI, validates the state, then posts `code`+
`code_verifier` to the backend `POST /api/v1/auth/token`. The backend exchanges
with GitHub (secret stays server-side) and returns a RepoIt session token.

## 3. Server environment variables

Backend (see `docs/configuration.md` in `repoit-backend`):

```
GITHUB_CLIENT_ID=...            # from the OAuth App page
GITHUB_CLIENT_SECRET=...        # secret page — never commit it
GITHUB_TOKEN=...                # optional server token for unauthenticated
                                # discovery traffic (raises the API limit)
REPOIT_SESSION_TTL_DAYS=30
```

Names deliberately avoid a `.env` fallback with insecure defaults in production.

## 4. Security properties

- `state` is stored server-side, single-use, with an expiry; mismatches abort
  the flow.
- PKCE `code_challenge`/`code_verifier` protects the authorization code even if
  it is intercepted between the browser and the backend.
- The client secret lives only in backend environment variables.
- Sessions are opaque random tokens; the database stores only their SHA-256
  hash. Expiry, revocation (logout) and per-user limiting are enforced by the
  backend.
- Users are identified by the stable GitHub **numeric ID**; username changes are
  handled by updating `users.username` on each login.
- Logs never include access tokens, client secrets or session tokens.