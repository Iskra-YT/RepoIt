# HTTP API contract

The mobile app is driven by the RepoIt HTTP API. This document is the contract
the app is built against. All routes are versioned under `/v0/api` and return
JSON. Errors use this shape:

```jsonc
{
  "error": {
    "code": "rate_limited",   // machine-readable
    "message": "Too many requests. Try again soon."
  }
}
```

Every endpoint below is served under two prefixes that behave **identically**:

| Prefix | When it is available |
| --- | --- |
| `/v0/api` | the regular API (persistent storage) |
| `/v0/dev` | a development mirror with the same endpoints, an ephemeral in-memory store, and `POST /auth/token` with `{ "code": "dev" }` for sign-in (no GitHub needed) |

The app targets `/v0/api` in production; pointing `EXPO_PUBLIC_API_URL` at the
dev mirror is a drop-in way to develop without a database.

Authentication uses a bearer session token: `Authorization: Bearer <token>`.
The token is issued by the API after GitHub sign-in and is short-lived and
revocable. **A session token never appears in a URL or a redirect** — sign-in
codes are exchanged for tokens through the API (see Auth).

## Auth

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/v0/api/auth/start?redirect_uri=<app deep link>` | Returns `{ "authorizeUrl": "https://github.com/login/oauth/authorize?..." }`. State + PKCE are generated server-side; `redirect_uri` must exactly match one of the registered deep links. |
| `GET` | `/v0/api/auth/callback?code=...&state=...` | Internal redirect endpoint. On success it redirects to the registered `redirect_uri` with `?code=<single-use sign-in code>&github_id=<numeric id>` — **never with the session token**. |
| `POST` | `/v0/api/auth/session` | Body `{ "code": "<sign-in code from the deep link>" }`. Returns `{ "token": "..." }`. The code is single-use and expires after 2 minutes. |
| `POST` | `/v0/api/auth/token` | Mobile flow: body `{ "code": "<GitHub auth code>", "state": "<returned state>" }`. Returns `{ "token": "..." }`. The API validates state + PKCE server-side before minting a session. |
| `POST` | `/v0/api/auth/logout` | Revokes the current session. |

The app picks one flow:

- **Web flow (default):** open `authorizeUrl`, let GitHub redirect through the
  API callback back to the app deep link, read `code` + `github_id` from the
  link, then call `POST /auth/session`. Recommended on every platform.
- **Mobile flow:** open `authorizeUrl`; GitHub redirects directly to the app's
  registered redirect URI with `code` + `state`; call `POST /auth/token`.

Both require `state` and PKCE; the redirect target is always validated against
the registered allowlist (exact match).

## Feed

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/v0/api/feed?limit=20&cursor=<opaque>` | Page of recommendation cards (shape in `architecture.md`). Returns `{ cards, hasMore, cursor, degraded?, message? }`. |

Pagination is **server-side**: echo the opaque `cursor` from the previous
response as-is to fetch the next page. The server keeps the page state
(candidate pool, offsets) and its own record of what you have been shown, so a
repository is never served twice. The legacy `seen_ids=1,2,3` hint is
deprecated, capped at 200 ids, and not needed.

`degraded: true` (with `message`) means GitHub discovery is limited right now;
the response was built from a fallback pool.

## Repositories & interactions

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/v0/api/repos/{id}` | Repository metadata + cached topics + the caller's interaction state. |
| `POST` / `DELETE` | `/v0/api/repos/{id}/like` | Like / remove like. **Idempotent.** Both return the current state: `{ "liked": bool, "saved": bool, "disliked": bool, "stateChanged": bool }` — this lets the app retry safely and sync the UI without a follow-up GET. |
| `POST` / `DELETE` | `/v0/api/repos/{id}/save` | Save / remove save. **Idempotent.** Same response shape as like. |
| `POST` | `/v0/api/repos/{id}/open` | Signals the user *tapped the card to open the repository on GitHub* (a click signal, not proof the page loaded). Scored once per repository; `openCount` is informational. Same response shape as like. |
| `POST` | `/v0/api/repos/{id}/feedback` | Body `{ "kind": "show_fewer" }` (explicit negative feedback). Any other kind is rejected with `400`. Same response shape as like. |

Repository identity: every interaction targets the **internal repository `id`**
returned by the feed and detail endpoints. It is stable within an environment;
`githubId` is returned for reference only and must not be used in paths.

## Interests (onboarding + personalization)

| Method | Path | Description |
| --- | --- | --- |
| `PUT` | `/v0/api/interests` | Replace interest topics. Body `{ "topics": ["embedded", "political-systems"] }`. |
| `GET` | `/v0/api/interests` | Current interest topics + derived scores. |

## Profile & social

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/v0/api/me` | `{ id, username, avatarUrl, onboarded, likedPublic, savedPublic }`. |
| `PATCH` | `/v0/api/me` | Update profile flags (`onboarded`, `likedPublic`, `savedPublic`). |
| `GET` | `/v0/api/me/following` | List of followed users. |
| `GET` | `/v0/api/users/{id}` | Public profile: user, follow state, public likes/saves (honoring the user's privacy flags). |
| `POST` / `DELETE` | `/v0/api/users/{id}/follow` | Follow / unfollow. Returns `{ user, isFollowing }`; idempotent. Self-follow is rejected with `400`. |

## Topics

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/v0/api/topics/search?q=...&limit=...` | Prefix search over known topics (used by onboarding). |

## System

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/v0/api/healthz` | **Liveness only:** `{ "status": "ok" }`. Public; intentionally leaks nothing about the environment. |
| `GET` | `/v0/api/readyz` | **Readiness:** `{ "status": "ready"\|"unavailable", "checks": { "database": "ok"\|"unreachable" } }`. Minimal and safe to expose; use it to decide when to serve traffic. |

## Rate limiting

Auth, feed and interaction endpoints are rate-limited by the API (per IP for
auth, per user for interactions). A `429` response includes a `Retry-After`
header; the app surfaces it and backs off.

## Admin

Campaign management endpoints are for operators and require the
`X-Admin-Token` header (see the deployment guide).