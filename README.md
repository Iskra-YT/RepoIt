# RepoIt — mobile client

RepoIt is a mobile-first way to **discover GitHub repositories**: swipe through
a vertical feed of software projects, like or save them, follow other users, and
let the feed learn your interests.

This repository contains the **mobile application** (React Native / Expo) and
is **licensed under AGPL-3.0** — see [`LICENSE`](LICENSE).

The backend (API, GitHub OAuth, discovery, recommendations) is a separate,
closed-source repository: `git@github.com:Iskra-YT/repoit-backend.git`.

```
RepoIt (this repo, AGPL-3.0)           repoit-backend (closed source)
+---------------------+   HTTPS/JSON  +----------------------------+
| Expo React Native   | <-----------> | Axum + PostgreSQL + GitHub |
| swipe feed app      |               | API + OAuth + discovery    |
+---------------------+               +----------------------------+
```

The app is intentionally implementation-independent: everything it does goes
through the documented HTTP API (`docs/api.md`).

## Stack

- **React Native via Expo** (TypeScript). Chosen over bare RN / Flutter because
  it is the most practical cross-platform option for an MVP: hot reload with
  Expo Go, no native toolchain required for development, and solid libraries
  for gestures (`react-native-gesture-handler`, `react-native-reanimated`),
  deep-linking and OAuth (`expo-auth-session`, `expo-web-browser`).
- Secure storage for the session token via `expo-secure-store` (Keychain /
  Keystore). **No GitHub client secret or token is ever embedded in the app** —
  authentication is handled by the backend.
- The swipe feed deliberately keeps animation scope small: a vertical paging
  gesture over a prefetched buffer of repository cards.

## Development

Requires Node 20+ and the Expo CLI.

```bash
cd apps/mobile
npm install
npx expo start          # open in Expo Go on your device / emulator
```

Point the app at your backend with the `EXPO_PUBLIC_API_URL` env var
(default `http://localhost:8080`):

```bash
EXPO_PUBLIC_API_URL=https://api.example.com npx expo start
```

The app needs a running `repoit-backend` and the OAuth application configured
per `docs/github-oauth-setup.md`.

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — frontend architecture
- [`docs/api.md`](docs/api.md) — HTTP API contract the app consumes
- [`docs/github-oauth-setup.md`](docs/github-oauth-setup.md) — exact OAuth setup
- [`docs/development.md`](docs/development.md) — local development workflow

## License

AGPL-3.0. See [`LICENSE`](LICENSE).