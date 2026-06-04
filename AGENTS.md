# AGENTS.md

## Cursor Cloud specific instructions

### Project

**SETPulse** — personal SaaS web app under `web/` for SET / mai stock quotes (real-time or 10-second delay).

### Services

| Service | Command | Port |
|---------|---------|------|
| Next.js dev | `cd web && npm run dev -- --hostname 0.0.0.0 --port 3000` | 3000 |

### Update script (repo root)

```
cd web && npm ci
```

### Environment

Copy `web/.env.example` → `web/.env.local`. Optional `SET_API_KEY` from SET SMART Marketplace; without it the app uses mock quotes.

No login required — open `/` directly.

### Lint / test / build

```bash
cd web && npm run lint && npm run build
```

No automated test suite yet.

### Gotchas

- API routes are open (no auth) for personal trial use.
- `pollIntervalMs`: realtime 2s, delay10 10s.
- Production SET data requires licensing per SET terms.
