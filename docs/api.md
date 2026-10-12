# HTTP API contract

The mobile app consumes the `repoit-backend` API. All routes are versioned
under `/api/v1` and return JSON. Errors use this shape:

```jsonc
{
  "error": {
    "code": "rate_limited",   // machine-readable
    "message": "Too many requests. Try again soon."
  }
}
```

Authentication uses a bearer session token: `Authorization: Bearer <token>`.
The token is issued by the backend after GitHub OAuth and is short-lived and
revocable (logout deletes it).

## Auth

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/v1/auth/start?redirect_uri=<app deep link>` | Returns JSON `{ "authorize_url": "https://github.com/login/oauth/authorize?..." }` for the app to open. Server-generated `state` + PKCE `code_challenge` stored server-side. |
| `GET` | `/api/v1/auth/callback?code=...&state=...` | Backend callback; exchanges code, then redirects to `redirect_uri` with `?token=...&github_id=...`. |
| `POST` | `/api/v1/auth/logout` | Revokes the current session. |
| `GET` | `/api/v1/me` | `{ id, username, avatarUrl, onboarded, likedPublic, savedPublic }`. |

OAuth details: `docs/github-oauth-setup.md`.

## Feed

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/v1/feed?limit=20&cursor=...` | Page of recommendation cards (shape in `architecture.md`). Opaque `cursor`; include `seen_ids=1,2,3` to avoid duplicates on retry. |
| `GET` | `/api/v1/repositories/{id}` | Repository metadata + cached topics. |

## Interactions

| Method | Path | Description |
| --- | --- | --- |
| `POST` / `DELETE` | `/api/v1/repositories/{id}/like` | Like / unlike (idempotent). |
| `POST` / `DELETE` | `/api/v1/repositories/{id}/save` | Save / unsave (idempotent). |
| `POST` | `/api/v1/repositories/{id}/feedback` | Body `{ "kind": "show_fewer" }` or `"open"`. Negative feedback lowers related-topic scores and removes the repo from the feed. |
| `POST` | `/api/v1/repositories/{id}/open` | Signals the repository was opened on GitHub (for scoring). |

## Interests (onboarding + personalization)

| Method | Path | Description |
| --- | --- | --- |
| `PUT` | `/api/v1/me/interests` | Replace interest topics. Body `{ "topics": ["embedded", "political-systems"] }`. Arbitrary strings allowed; unknown topics are created locally. |
| `GET` | `/api/v1/me/interests` | Current interest topics + derived scores. |

## Social

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/v1/users/{id}` | Public profile. |
| `GET` | `/api/v1/me/following` | List of followed RepoIt users. |
| `POST` / `DELETE` | `/api/v1/users/{id}/follow` | Follow / unfollow (self-follow rejected with `400`). |

## System

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/healthz` | Liveness + DB connectivity check. |

## Rate limiting

Authentication, feed and interaction endpoints are rate-limited by the backend
(per IP for auth, per user for interactions). A `429` response includes a
`Retry-After` header; the app should surface it and back off.