# Cognito Chat → Cloudflare: Migration Research

**Date:** 2026-08-15
**Branch:** `feat/cloudflare-workers-migration`
**Constraint:** Cloudflare **Workers Free** plan (not Vercel, not Pages Functions / Edge)

Phase 0/1 has been executed on this branch. Measured results are in §14. The previous attempt (`Migrate-to-Cloudflare`, reverted in `revert-to-vercel`) used the **wrong adapter**. Do not repeat that path.

---

## 1. Verdict

A **safe** migration is possible, but **not as a lift-and-shift** on the Free plan.

| Question                                                   | Answer                                                                                                                         |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Can we host this Next.js 16 app on Cloudflare?             | Yes, via **OpenNext on Workers** (`@opennextjs/cloudflare`).                                                                   |
| Can we use Cloudflare Pages + `@cloudflare/next-on-pages`? | **No.** Deprecated, Edge-only, and the path that already failed.                                                               |
| Will it fit the Free plan as-is?                           | **Unlikely.** Worker size and 10 ms CPU are the hard walls.                                                                    |
| What is the cheapest “it actually works” path?             | Stay on Free, switch adapters, shrink the Worker, keep auth/chat I/O-bound. Measure size + CPU before cutover.                 |
| When should we pay $5/mo Workers Paid?                     | If gzipped Worker > 3 MiB after slimming, or chat/auth regularly exceeds 10 ms CPU, or we go past 100k Worker invocations/day. |

**Do not start with Vinext.** It reimplements Next.js on Vite. Fine for a greenfield app, not a safe migration of this codebase.

---

## 2. What already happened (do not repeat)

The repo already tried Cloudflare once:

- Branch: `Migrate-to-Cloudflare` (merged, then reverted)
- Adapter: `@cloudflare/next-on-pages` + Cloudflare **Pages**
- Forced `export const runtime = "edge"` on routes
- Hit Worker/Edge bundle limits, Server Action `405`s, Sentry size, `nodejs_compat` / `wrangler.jsonc` fights
- Response was to delete Server Actions and call the FastAPI backend from the browser (that part is still the architecture today)
- Revert: `668fb45` (“revert to vercel, remove cloudflare packages…”)

Why it failed is structural, not “we configured it wrong”:

- **next-on-pages only supports the Next.js Edge runtime.**
- This app is a Node-shaped Next app: NextAuth, axios on the server, Sentry, App Router, streaming `/api/chat`.
- Next.js 16 `proxy.ts` **always** runs on Node. You cannot set `runtime = "edge"` on it.
- Pages Functions on Free still have the same 10 ms CPU / small bundle world as Workers Free.

Cloudflare’s current official path is **Workers + OpenNext**, which uses the **Node.js runtime** via `nodejs_compat`, not Edge.

---

## 3. Recommended target architecture

```
Browser
  │  static assets (_next/static, public/)  →  Workers Static Assets (unlimited, free)
  │  HTML / RSC / API / auth / chat stream  →  one Worker (OpenNext)
  │
  ├─ NextAuth  /api/auth/*     →  FastAPI (nifty-archimedes) via Atlas
  ├─ /api/chat  (SSE proxy)    →  FastAPI /agent/chat/stream
  └─ Client TanStack Query     →  FastAPI directly (already true today)
```

What this app actually needs the Worker for:

1. **NextAuth** (`src/auth.ts`, `/api/auth/[...nextauth]`) — JWT session, credentials login, token refresh.
2. **Route guard** (`src/proxy.ts`) — cookie/session redirect.
3. **Chat stream proxy** (`src/app/api/chat/route.ts`) — attaches Atlas + user JWT, pipes SSE.
4. **A handful of server-rendered shells** — login/chat/settings pages are mostly client components.

What it does **not** need on Cloudflare:

- Server Actions (already removed)
- ISR / `revalidateTag` / R2 incremental cache / D1 tag cache / Durable Object queue
- Hyperdrive (no direct Postgres)
- Cloudflare Images (chat images already load as authenticated blobs via `useSecureImage`)

Minimal bindings for v1:

```jsonc
{
  "main": ".open-next/worker.js",
  "compatibility_date": "2026-08-15",
  "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
  "assets": { "directory": ".open-next/assets", "binding": "ASSETS" },
  "observability": { "enabled": true },
}
```

Skip R2 / D1 / Durable Objects until we actually use ISR. They are available on Free (SQLite DOs only), but they add moving parts we do not need.

---

## 4. Free-plan limits that actually matter

Source: [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [OpenNext size note](https://opennext.js.org/cloudflare), [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/).

| Limit                             | Workers Free                                                   | Why it matters here                                                                                                                                                                                                                                            |
| --------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Worker size (gzip)                | **3 MiB**                                                      | Hard deploy blocker. Vanilla CNA is ~1.6–2.3 MiB gzip. This app + NextAuth + axios + Sentry server will push or exceed 3 MiB. Paid is 10 MiB.                                                                                                                  |
| CPU time / request                | **10 ms**                                                      | Waiting on FastAPI `fetch` does **not** count. JWT sign/verify, RSC render, axios interceptors, Sentry, and stream parse **do**. Auth-heavy pages and `/api/chat` startup are the risk. Isolates forgive rare overages; consistent overages become Error 1102. |
| Requests / day                    | **100,000**                                                    | Only **Worker** invocations. Static assets are free/unlimited. Each HTML navigation, `/api/auth/*`, and `/api/chat` counts. Client calls to FastAPI do **not**.                                                                                                |
| Subrequests / request             | **50**                                                         | Fine. Auth does 1–2 backend calls; chat does 1.                                                                                                                                                                                                                |
| Memory                            | 128 MB                                                         | Same on Paid. Do not buffer entire chat streams.                                                                                                                                                                                                               |
| Simultaneous outbound connections | 6                                                              | Fine for this app.                                                                                                                                                                                                                                             |
| Startup time                      | 1 s                                                            | Large Next bundles can approach this. OpenNext v1.2+ lazy-loads routes.                                                                                                                                                                                        |
| Static asset files                | 20,000                                                         | We will not hit this.                                                                                                                                                                                                                                          |
| Individual static file            | 25 MiB                                                         | Fine.                                                                                                                                                                                                                                                          |
| Workers Builds                    | 3,000 min/mo, 1 concurrent, 20 min timeout, 20 GB disk, 2 vCPU | One Next + OpenNext build should fit. Keep Sentry source-map upload optional.                                                                                                                                                                                  |
| Env vars                          | 64 × 5 KB                                                      | Fine. Set both **build** and **runtime** vars (OpenNext inlines `NEXT_PUBLIC_*` at build).                                                                                                                                                                     |

**10 ms CPU is not “Edge is slow.”** It is “your JS must stay tiny.” Network wait to Atlas/FastAPI is free. Crypto + React render + Sentry is not.

Paid ($5/mo) changes the game: 10 MiB worker, 30 s default CPU (up to 5 min), 10 M requests/mo. Recommend treating Paid as the fallback, not the first move.

---

## 5. App inventory vs Cloudflare

### Safe / already compatible

- App Router pages that are thin client shells (`/chat`, `/login`, `/register`, `/settings`, `/library`).
- TanStack Query + axios **from the browser** to FastAPI (no Worker involved).
- `/api/chat` streaming: I/O-bound `fetch` + pipe. Use the Web Streams API (already does). Do not `await response.text()` on the SSE body.
- `crypto.randomUUID()` in `chat-stream.ts` — Workers native.
- `trustHost: true` in `src/auth.ts` — already written for Cloudflare.
- `AUTH_TRUST_HOST` / `AUTH_SECRET` in `.env.example`.
- No `fs`, no native addons, no `export const runtime = "edge"` today.

### Must change

| Item                                    | Why                                                                                                                                                                                                                                                                                             | What to do                                                                                                                                                                                                                             |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@cloudflare/next-on-pages`             | Wrong product. Edge-only.                                                                                                                                                                                                                                                                       | Never reinstall. Use `@opennextjs/cloudflare` + `wrangler`.                                                                                                                                                                            |
| `src/proxy.ts`                          | Next.js 16 Proxy is **Node-only**. OpenNext **does not support Node middleware / proxy.ts** yet ([docs](https://opennext.js.org/cloudflare), [issue #1277](https://github.com/opennextjs/opennextjs-cloudflare/issues/1277)). Build fails with `Node.js middleware is not currently supported`. | Temporary: rename back to `middleware.ts` (Edge convention, deprecation warning). **And** stop importing `@/auth` / axios into it. Guard on session-cookie presence only, or move `auth()` checks into a small server layout.          |
| `@sentry/nextjs` on the server          | Largest Worker-size offender. Last attempt already dynamically imported it.                                                                                                                                                                                                                     | Client Sentry only for v1. Drop `sentry.server.config.ts` / `sentry.edge.config.ts` from the Worker, or load behind `process.env.NEXT_RUNTIME` and a feature flag. Disable `tunnelRoute: "/monitoring"` (extra Worker traffic + size). |
| `next/image`                            | OpenNext optimization needs Cloudflare Images (paid transformations). Chat images are already blob URLs (`unoptimized`).                                                                                                                                                                        | Set `images.unoptimized: true` for v1. Do not add an `IMAGES` binding until we need it.                                                                                                                                                |
| `next/font/google` (Geist)              | Previous Pages builds died on `.woff2` loaders. OpenNext generally handles this, but verify in `opennextjs-cloudflare preview`.                                                                                                                                                                 | Fallback: self-host Geist in `public/` or use system fonts if the build breaks.                                                                                                                                                        |
| Axios on the **server** (`src/auth.ts`) | Fine on OpenNext Node compat. Fatal on Edge middleware.                                                                                                                                                                                                                                         | Keep axios in Auth.js + `/api/chat`. Keep it **out** of middleware.                                                                                                                                                                    |
| Sentry `withSentryConfig` webpack       | Pulls server instrumentation into the Worker.                                                                                                                                                                                                                                                   | Keep client upload; strip server SDK from the OpenNext bundle.                                                                                                                                                                         |
| Env handling                            | Workers Builds need vars in **Build variables and secrets** _and_ runtime vars/secrets. `wrangler deploy` can wipe dashboard vars unless `--keep-vars`.                                                                                                                                         | Use `.dev.vars` with `NEXTJS_ENV=development` locally. Production: dashboard + `opennextjs-cloudflare deploy -- --keep-vars`. Secrets: `AUTH_SECRET`, `ATLAS_API_KEY`.                                                                 |

### Nice later, not v1

- R2 incremental cache + regional cache (only if we add ISR).
- Smart Placement (Worker runs near FastAPI, not the user). Useful once Atlas is a stable origin.
- Cloudflare WAF managed rules for Next.js CVEs (Pro+ for some rules). Patch Next.js instead (`16.2.12` is already past `16.2.5`).
- Custom domain + `AUTH_URL` / `AUTH_TRUST_HOST`.

---

## 6. The `proxy.ts` trap (highest-risk code change)

Current file: `src/proxy.ts`. It wraps NextAuth `auth()` and redirects unauthenticated users.

```
Next.js 16 proxy.ts  →  always Node.js
OpenNext Cloudflare  →  Node middleware not supported
export const runtime = "edge" on proxy.ts  →  Next.js rejects it
```

**Safe workaround for v1:**

1. Move `src/proxy.ts` → `src/middleware.ts`.
2. Do **not** call `auth()` (that pulls axios + Auth.js Node code into the Edge middleware bundle).
3. Cookie-only gate, e.g. look for the Auth.js session cookie (`authjs.session-token` / `__Secure-authjs.session-token`) and redirect.
4. Do the real `await auth()` check in a server layout around `/chat`, `/settings`, `/library` so a missing/forged cookie still cannot render those trees.
5. Track OpenNext Node-middleware support; switch back to `proxy.ts` when it lands.

This also keeps the **middleware bundle small**, which is how the last Edge attempt died.

---

## 7. Bundle-size strategy (the Free-plan gate)

Only the **gzipped Worker** counts. Client JS goes to Static Assets and is free.

Expected size drivers, largest first:

1. Next.js server runtime (unavoidable, ~1.5–2 MiB gzip alone on a small app)
2. `@sentry/nextjs` server + edge
3. `next-auth` + `axios` pulled into every server request
4. `ai` SDK server helpers used by `/api/chat`
5. Accidental client libraries leaking into the server graph (`framer-motion`, `shiki`, `streamdown`)

v1 rules:

- No Server Actions (already true).
- No server Sentry.
- `optimizePackageImports` stays.
- Verify with `pnpm preview` / `wrangler deploy --dry-run` and read `Total Upload: … / gzip: …`.
- If gzip > 3 MiB after slimming → **Workers Paid**, do not hack the app into a worse architecture.

---

## 8. Runtime / CPU strategy

Keep Worker CPU to: parse request → maybe JWT → one `fetch` → stream or redirect.

| Request                           | Expected CPU                            | Risk                                                     |
| --------------------------------- | --------------------------------------- | -------------------------------------------------------- |
| Static `/_next/static/*`          | 0 (assets, no Worker)                   | None                                                     |
| `/login` HTML                     | Low                                     | Fine if page stays a client shell                        |
| `proxy` / middleware              | Low **if cookie-only**                  | High if it runs NextAuth + axios                         |
| `POST /api/auth/callback` (login) | Medium (JWT + 2 backend calls)          | Backend wait is free; JWT + JSON transform is not        |
| `POST /api/chat`                  | Low after connect if we only pipe bytes | High if we parse/transform every SSE event on the Worker |
| RSC/SSR of a heavy tree           | Medium–high                             | Avoid. Keep pages as client shells.                      |

`/api/chat` already pipes the backend stream through `createUIMessageStream`. That parse loop **is** CPU. On Free, prefer passing the upstream SSE through with minimal transformation, or accept Paid if we keep the current UI-message rewrite.

---

## 9. Auth, secrets, and Atlas

Required runtime secrets:

- `AUTH_SECRET`
- `ATLAS_API_KEY` (server-only; stop relying on `NEXT_PUBLIC_ATLAS_API_KEY` in production)
- `AUTH_TRUST_HOST=true`
- `AUTH_URL=https://<production-host>` once on a custom domain

Required build vars (Workers Builds):

- `NEXT_PUBLIC_API_URL` (Atlas `/cognito` base)
- any `SENTRY_*` if client Sentry stays
- `NEXTJS_ENV=production` if we use OpenNext’s env loader

NextAuth Credentials + JWT is supported on OpenNext Node. Do not switch to a different auth product for this migration.

CORS: browser → FastAPI must already allow the Cloudflare origin (`*.workers.dev` / custom domain). That is a **backend** change, not a Worker change. Confirm before cutover.

---

## 10. What we will not do

- Reinstall `@cloudflare/next-on-pages`.
- Force `runtime = "edge"` on routes.
- Put the app on Pages Functions.
- Enable Cloudflare Images, R2 cache, D1, or Durable Objects in v1.
- Rewrite the FastAPI backend.
- Move chat streaming off `/api/chat` in v1 (the Atlas key must stay server-side).
- Adopt Vinext.

---

## 11. Implementation plan (when we execute)

Phased so each step has a go/no-go on Free-plan limits.

### Phase 0 — Prove the adapter (no product change)

1. `pnpm add -D wrangler@latest` and `pnpm add @opennextjs/cloudflare@latest`.
2. Add `open-next.config.ts` with `defineCloudflareConfig()` (no R2/DO).
3. Add `wrangler.jsonc` as in §3.
4. Add scripts: `preview`, `deploy`, `cf-typegen`.
5. `initOpenNextCloudflareForDev()` in `next.config.ts`.
6. Add `.open-next` to `.gitignore`, `public/_headers` for `/_next/static/*` immutable cache.
7. `pnpm preview` and record gzip size + whether `proxy.ts` fails the build.

**Gate:** build must complete. If `proxy.ts` fails, do Phase 1 before anything else.

### Phase 1 — Unblock Next.js 16 + shrink the Worker

1. Replace `proxy.ts` with cookie-only `middleware.ts`; real `auth()` in a server layout.
2. Remove server/edge Sentry from the Worker; keep client Sentry.
3. `images.unoptimized = true`.
4. Rebuild. **Gate: gzip ≤ 3 MiB.** If not, either cut more server deps or stop and recommend Workers Paid.

### Phase 2 — Runtime correctness on `workerd`

Manual matrix on `pnpm preview` (Wrangler, not `next dev`):

- Login / logout / refresh-token path
- Unauthenticated `/chat` redirect
- Authenticated `/login` redirect
- Send a chat message (stream tokens, tools, abort)
- Attachments + library gallery (blob images)
- Settings profile load
- 401 from FastAPI still signs the user out

**Gate:** no Error 1102 (CPU), no 413, no empty streams, no 503 from missing `nodejs_compat`.

### Phase 3 — Deploy without cutting over

1. `pnpm deploy` to `*.workers.dev`.
2. Set dashboard runtime secrets + build vars.
3. Point FastAPI CORS at the preview origin.
4. Repeat the Phase 2 matrix against the live Worker.
5. Watch Workers Metrics: CPU time p99, invocation count, size.

**Gate:** p99 CPU comfortably under 10 ms, daily invocations projected under 100k.

### Phase 4 — Cut over

1. Attach custom domain.
2. Set `AUTH_URL` / `AUTH_TRUST_HOST`.
3. Keep Vercel up until the Worker has been stable for a soak period.
4. Switch DNS. Leave a one-command rollback to Vercel.

---

## 12. Go / no-go

**Go on Free** if Phase 1 gzip ≤ 3 MiB **and** Phase 2/3 p99 CPU < 10 ms **and** Atlas CORS is updated.

**Go on Paid ($5/mo)** if size or CPU fails after slimming. That is still a successful Cloudflare migration; it is just not a Free-plan one.

**No-go / stay on Vercel** if OpenNext cannot build Next 16.2 + this auth/chat graph even after the middleware workaround, or if `/api/chat` cannot stream reliably on `workerd`.

---

## 13. Phase 0/1 results (2026-08-15)

Adapter: `@opennextjs/cloudflare@1.20.2` + `wrangler@4.123.0` on Node **22.23.2** (Wrangler 4 refuses Node 20).

| Check                                                         | Result                                                                    |
| ------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `proxy.ts` OpenNext build                                     | **Fail** — `Node.js middleware is not currently supported`                |
| `middleware.ts` (Edge, cookie-only) + `requireAuth()` layouts | **Build succeeds** (Next deprecation warning only)                        |
| Worker size, with server Sentry                               | 19662 KiB / **gzip 4301 KiB (4.20 MiB)** — over 3 MiB                     |
| Worker size, Sentry stripped from Worker (`CLOUDFLARE=1`)     | 12959 KiB / **gzip 2791 KiB (2.73 MiB)** — **under Free cap by ~280 KiB** |
| `wrangler dev`                                                | Ready on `:8787`                                                          |
| `GET /login`, `/register`, `/forgot-password`                 | 200 HTML                                                                  |
| `GET /`, `/chat`, `/settings` (no cookie)                     | 307 → `/login` (middleware, 5–7 ms)                                       |
| `GET /chat` + junk `authjs.session-token`                     | 307 → `/login` via `requireAuth()` (invalid JWE, expected)                |
| `GET /api/auth/providers`                                     | 200 JSON, Credentials provider live                                       |
| Static `/_next/static/*.css` and Geist `.woff2`               | 200 from Assets                                                           |
| One-time `WebAssembly.compile()` error on isolate start       | Did not fail subsequent requests. Investigate before production.          |

**Free-plan size gate: pass** after dropping server/edge Sentry from the Worker. Client Sentry (`instrumentation-client.ts`) is unchanged.

**Still open before cutover:** login against real FastAPI, chat SSE, CPU p99 under 10 ms, the WASM startup error, CORS on Atlas for `*.workers.dev`.

---

## 14. Sources

- [Cloudflare: Next.js on Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
- [OpenNext Cloudflare](https://opennext.js.org/cloudflare)
- [OpenNext get started](https://opennext.js.org/cloudflare/get-started) — explicitly: remove `runtime = "edge"`, remove next-on-pages
- [OpenNext caching](https://opennext.js.org/cloudflare/caching) — skip for this app
- [OpenNext images](https://opennext.js.org/cloudflare/howtos/image)
- [OpenNext env vars](https://opennext.js.org/cloudflare/howtos/env-vars)
- [Workers platform limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Workers Builds limits](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/)
- [Durable Objects on Free](https://developers.cloudflare.com/durable-objects/platform/pricing/) — available, SQLite only; unused in v1
- Prior repo history: `Migrate-to-Cloudflare`, `0440c6b`, `668fb45`
