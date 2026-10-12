# Development workflow

The frontend depends on the closed-source `repoit-backend`. To develop locally
you need a running backend (either your own instance or one provided by the
team) plus the OAuth application configured for your development environment.

## 1. Backend

See `docs/deployment.md` in the `repoit-backend` repository. Quick version:

```bash
docker compose up -d                          # postgres + API
curl http://localhost:8080/healthz            # -> ok
```

Your GitHub OAuth app must list a callback URL that the backend can use; for
local development with the Expo proxy use variant B from
`docs/github-oauth-setup.md`.

## 2. Mobile app

```bash
cd apps/mobile
npm install
EXPO_PUBLIC_API_URL=http://localhost:8080 npx expo start
```

- On a physical device with **Expo Go**, open the QR code. The device must reach
  the backend over the network — use your machine's LAN IP instead of
  `localhost`, e.g. `EXPO_PUBLIC_API_URL=http://192.168.1.20:8080`.
- Android emulator: `http://10.0.2.2:8080`.
- iOS simulator: `http://localhost:8080`.

## 3. Deep links

The OAuth flow finishes with a redirect to the app. In Expo Go the redirect URI
is an `exp://...` URL; in a dev/production build it is `repoit://auth`. See
`docs/github-oauth-setup.md` flow A/B.

## 4. Tests

```bash
cd apps/mobile
npm run lint
npm run test        # jest unit tests (pure logic: API client, state machines)
```

The app contains no credentials and makes no network calls in tests.

## 5. Committing

This repository (`Iskra-YT/RepoIt`) is AGPL-3.0 and open; the backend is
closed source. Never copy backend code or commit backend secrets here.