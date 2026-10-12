# Frontend architecture

The mobile application is a thin, stateless client for the closed-source
`repoit-backend` HTTP API. It stores only its own session token and local UI
state; GitHub remains the source of truth for repository content.

## Goals relevant to the app

- One primary repository card at a time, vertical swipe navigation.
- Visible actions: like, save, follow author, open on GitHub.
- A small prefetch buffer keeps swiping responsive; cards are not duplicated
  and requests are not repeated needlessly.
- Explicit loading, empty, offline and API-error states.
- Sponsored entries look and behave distinctly and are labeled `Sponsored`.
- Personalization controls: interests management, "show me fewer like this".

## Screens / navigation (Expo Router)

| Screen | Purpose |
| --- | --- |
| `onboarding` | After first login: search + pick interests (topics). |
| `feed` | The vertical swipe feed (home). |
| `repository` | Detail page for one repository. |
| `me` | Profile: interests, following list, liked/saved. |
| `settings` | Logout, privacy toggles for public activity. |

State shape of a feed card (JSON returned by `GET /api/v1/feed`):

```jsonc
{
  "id": 101,
  "position": 3,          // stable per response, for dedupe
  "sponsored": false,     // true => render as sponsored, labeled
  "repository": {
    "id": 771,            // internal repository id
    "githubId": 12345678,
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
  "score": 4.2,           // explainable server-side relevance (debug/UI)
  "reason": ["topic:documentation", "author:followed"]
}
```

## Data flow

1. App starts → reads session token from `expo-secure-store` → `GET /me`.
   - `401` → run OAuth (`expo-auth-session`), backend redirects to GitHub,
     then hands the app a session token via the registered redirect URI.
2. Feed screen → loads first page of `GET /api/v1/feed?limit=20&cursor=...`.
   - The client keeps at most 3 pages prefetched; page tokens (`cursor`) are
     opaque.
   - Swiping reveals existing cards; the next page is fetched when the buffer
     drops below a threshold.
3. Actions are real HTTP calls (`POST/DELETE like|save`, `POST feedback`,
   `POST follow`) with optimistic UI + rollback on error.
4. "Open on GitHub" uses `Linking.openURL` / `WebBrowser`; the backend observes
   it via `POST /repositories/{id}/open` when possible.

## Offline / error behavior

- All requests go through one API client with typed errors (`ApiErrorKind`:
  `unauthorized`, `rateLimited`, `network`, `server`, `notFound`).
- Network failures render an inline retry state instead of a silent dead feed.
- The feed page request is idempotent: the client passes the last seen card ID
  (`seen_ids`) so retries never duplicate cards.

## Theming and motion

Minimal custom work: system fonts, a small color palette, a purely
gesture-driven swipe (`react-native-gesture-handler` `Pan` + translation
threshold). No elaborate animations in the MVP.