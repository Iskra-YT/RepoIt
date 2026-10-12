# Development workflow

The app talks to the RepoIt API over HTTP. To develop locally you need a
reachable API instance (your own or one provided to you), then point the app
at it.

## 1. Run the app

```bash
cd apps/mobile
npm install
EXPO_PUBLIC_API_URL=http://localhost:8080 npx expo start
```

- On a physical device with **Expo Go**, open the QR code. The device must reach
  the API over the network — use your machine's LAN IP, e.g.
  `EXPO_PUBLIC_API_URL=http://192.168.1.20:8080`.
- Android emulator: `http://10.0.2.2:8080`.
- iOS simulator: `http://localhost:8080`.

## 2. Connect to the API

- The only thing the app needs to know is the API base URL
  (`EXPO_PUBLIC_API_URL`).
- Deep link note: the sign-in flow finishes with a redirect to the app. In
  Expo Go the redirect URI is an `exp://...` URL; in dev/production builds it
  is `repoit://auth`. The `GET /api/v1/auth/start` endpoint accepts
  `redirect_uri` accordingly.

## 3. Tests

```bash
cd apps/mobile
npm run lint
npm run test        # jest unit tests (pure logic: API client, state machines)
```

The app contains no credentials and makes no network calls in tests.

## 4. Committing

This repository (`Iskra-YT/RepoIt`) is AGPL-3.0. Never commit secrets or
credentials of any kind here.