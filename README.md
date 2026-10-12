# RepoIt

RepoIt is a mobile-first way to **discover GitHub repositories**: swipe through
a vertical feed of software projects, like or save them, follow other users, and
let the feed learn your interests.

This repository contains the **mobile application** (React Native / Expo) and
is **licensed under AGPL-3.0** — see [`LICENSE`](LICENSE).

The app is a thin client: everything user-facing goes through the documented
HTTP API (`docs/api.md`), which provides GitHub sign-in, the personalized feed,
interactions and the social graph. GitHub remains the source of truth for
repository content and metadata.

```
+-------------------------+   HTTPS/JSON   +----------------------+
| RepoIt mobile app       | <------------> | RepoIt API           |
| (this repository)       |                | OAuth · feed · likes |
+-------------------------+                +----------------------+
```

## Stack

- **React Native via Expo** (TypeScript): the most practical cross-platform
  option for an MVP — Expo Go for development without a native toolchain, plus
  `react-native-gesture-handler` and `react-native-reanimated` for the swipe
  feed.
- The session token is stored with `expo-secure-store` (Keychain / Keystore).
  **The app never holds a GitHub client secret or token** — sign-in happens
  through the API's OAuth flow.
- The swipe feed deliberately keeps animation scope small: a vertical paging
  gesture over a prefetched buffer of repository cards.

## Development

Requires Node 20+ and the Expo CLI.

```bash
cd apps/mobile
npm install
npx expo start          # open in Expo Go on your device / emulator
```

Point the app at the RepoIt API with the `EXPO_PUBLIC_API_URL` env var
(default `http://localhost:8080`):

```bash
EXPO_PUBLIC_API_URL=https://api.example.com npx expo start
```

See `docs/development.md` for details (device/emulator URLs, deep links).

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — how the app works and how it
  talks to the API
- [`docs/api.md`](docs/api.md) — HTTP API contract the app consumes
- [`docs/development.md`](docs/development.md) — local development workflow

## License

AGPL-3.0. See [`LICENSE`](LICENSE).