# Frontend architecture

This document explains how the mobile application works and how it connects to
the RepoIt API. The app is a thin, stateless client: it stores only its own
session token and local UI state, and every feature it offers is backed by the
HTTP API documented in [`docs/api.md`](api.md).

## How the app works

- One primary repository card at a time, swiped vertically.
- Visible actions: like, save, follow author, open on GitHub, "show me fewer
  like this".
- A small prefetch buffer keeps swiping responsive; cards are never duplicated
  and requests are not repeated needlessly.
- Explicit loading, empty, offline and API-error states.
- Sponsored entries are visually distinct and labeled `Sponsored`.
- Personalization: interests management on first login (onboarding) and later
  in the profile.

## Screens / navigation (Expo Router)

| Screen | Purpose |
| --- | --- |
| `onboarding` | After first login: search + pick interests (topics). |
| `feed` | The vertical swipe feed (home). |
| `repository` | Detail page for one repository. |
| `me` | Profile: interests, following list, liked/saved. |
| `settings` | Logout, privacy toggles for public activity. |

## How the app connects to the API

- **Base URL:** `EXPO_PUBLIC_API_URL` env var (default `http://localhost:8080`).
- **Session token:** issued by the API after GitHub sign-in, stored with
  `expo-secure-store`, sent as `Authorization: Bearer <token>`.
- **Sign-in (web flow):** the app opens the authorization URL the API returns
  from `GET /v0/api/auth/start`; GitHub redirects through the API callback and
  lands on the app's registered deep link with `code` + `github_id` (a
  short-lived, single-use sign-in code — **never** the session token). The app
  then calls `POST /v0/api/auth/session` with that code and receives the
  session token in the JSON body. The app never sees a GitHub client secret or
  a GitHub token, and the session token never travels in a URL.
- **Feed:** `GET /v0/api/feed` returns pages of repository cards (shape below);
  actions are `POST`/`DELETE` calls against the interaction endpoints.

A feed card returned by `GET /v0/api/feed`:

```jsonc
{
  "id": 101,
  "position": 3,          // stable per response, for rendering order
  "sponsored": false,     // true => render as sponsored, labeled
  "repository": {
    "id": 771,            // internal repository id: use this in all /repos paths
    "githubId": 12345678, // informational only
    "fullName": "rust-lang/mdBook",
    "url": "https://github.com/rust-lang/mdBook",
    "description": "Create book from markdown files...",
    "language": "Rust",
    "stars": 18000,
    "forks": 1900,
    "topics": ["documentation", "rust", "book"],
    "owner": {"login": "rust-lang", "avatarUrl": "https://..."},
    "isFork": false, "isArchived": false
  },
  "score": 4.2,           // explainable relevance
  "reason": ["topic:documentation", "author:followed"]
}
```

Repository identity is the internal `repository.id`; it is the key for every
`/repos/{id}` interaction and is stable within an environment. `githubId` is
the numeric GitHub id and is reference-only.

## Data flow inside the app

1. Startup → read session token from secure storage → `GET /me`.
   - `401` → run the sign-in flow via the API.
   - Fresh login but `me.onboarded == false` → open the onboarding screen.
2. Feed screen → `GET /v0/api/feed?limit=20&cursor=...`; keep at most 3 pages
   prefetched; refetch when the buffer drops below a threshold. Echo the opaque
   `cursor` untouched. Deduplication is the server's job (persisted seen
   history + server-side page state), so the app never sends `seen_ids`.
3. Swiping and action buttons map 1:1 to HTTP calls with optimistic UI +
   rollback on error. Interaction endpoints return the current state, so a
   failed retry converges without a follow-up GET.
4. "Open on GitHub" uses `Linking.openURL` / `WebBrowser`, then notifies the
   API via `POST /repos/{id}/open`. This is a tap (click) signal, scored once;
   it is not proof the GitHub page rendered, and the app shows its own loading
   and error states for the browser sheet.

## Offline / error behavior

- One API client with typed errors (`unauthorized`, `rateLimited`, `network`,
  `server`, `notFound`).
- Network failures render an inline retry state instead of a silent dead feed.

## Theming and motion

Minimal custom work: system fonts, a small color palette, a purely
gesture-driven swipe (`react-native-gesture-handler`). No elaborate
animations in the MVP.