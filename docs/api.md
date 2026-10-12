# HTTP API contract

The mobile app is driven by the RepoIt HTTP API. This document is the contract
the app is built against. All routes are versioned under `/api/v1` and return
JSON. Errors use this shape:

```jsonc
{
  "error": {
    "code": "rate_limited",   // machine-readable
    "message": "Too many requests. Try again soon."
  }
}
```

Authentication uses a bearer session token: `Authorization: Bearer <token>`.
The token is issued by the API after GitHub sign-in and is short-lived and
revocable.

## Auth

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/v1/auth/start?redirect_uri=<app deep link>` | Returns JSON `{ "authorize_url": "https://github.com/login/oauth/authorize?..." }` for the app to open in a browser/auth-session. |
| `GET` | `/api/v1/auth/callback?code=...&state=...` | Internal redirect endpoint; on success it redirects to `redirect_uri` with `?token=...&github_id=...`. |
| `POST` | `/api/v1/auth/logout` | Revokes the current session. |
| `GET` | `/api/v1/me` | `{ id, username, avatarUrl, onboarded, likedPublic, savedPublic }`. |

## Feed

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/v1/feed?limit=20&cursor=...` | Page of recommendation cards (shape in `architecture.md`). Opaque `cursor`; pass `seen_ids=1,2,3` to avoid duplicates on retry. |
| `GET` | `/api/v1/repositories/{id}` | Repository metadata + cached topics. |

## Interactions

| Method | Path | Description |
| --- | --- | --- |
| `POST` / `DELETE` | `/api/v1/repositories/{id}/like` | Like / unlike (idempotent). |
| `POST` / `DELETE` | `/api/v1/repositories/{id}/save` | Save / unsave (idempotent). |
| `POST` | `/api/v1/repositories/{id}/feedback` | Body `{ "kind": "show_fewer" }` or `"open"`. |
| `POST` | `/api/v1/repositories/{id}/open` | Signals the repository was opened on GitHub. |

## Interests (onboarding + personalization)

| Method | Path | Description |
| --- | --- | --- |
| `PUT` | `/api/v1/me/interests` | Replace interest topics. Body `{ "topics": ["embedded", "political-systems"] }`. Arbitrary strings allowed; unknown topics are handled by the API. |
| `GET` | `/api/v1/me/interests` | Current interest topics + derived scores. |

## Social

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/v1/users/{id}` | Public profile. |
| `GET` | `/api/v1/me/following` | List of followed users. |
| `POST` / `DELETE` | `/api/v1/users/{id}/follow` | Follow / unfollow (self-follow rejected with `400`). |

## System

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/healthz` | Liveness + connectivity check. |

## Rate limiting

Auth, feed and interaction endpoints are rate-limited by the API (per IP for
auth, per user for interactions). A `429` response includes a `Retry-After`
header; the app surfaces it and backs off.