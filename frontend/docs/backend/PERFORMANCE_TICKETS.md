# Backend Performance Tickets — HAR-Backed Evidence

> Generated: 2026-06-12
> Source: HAR capture of a cold authenticated load of `/reports/bills` (production API `api.maryai.uz`), plus Lighthouse timespan audits.
> All numbers below are backend/network costs — independent of frontend build mode.

---

## 1. Cache CORS preflights (`Access-Control-Max-Age`) — highest impact / lowest effort

Every API endpoint pays an uncached `OPTIONS` preflight on each request because the
`Authorization` header makes requests non-simple and the API sends no
`Access-Control-Max-Age`.

Measured preflight costs (one cold page load):

| Endpoint | OPTIONS duration |
|---|---|
| `/api/v1/user/me` | 400ms, 399ms (two preflights) |
| `/api/v1/branches` | 448ms |
| `/api/v1/metadata` | 287ms |
| `/api/v1/bills` | 290ms |
| `/api/v1/bills/{id}` | 336ms |

**Fix:** add `Access-Control-Max-Age: 7200` to preflight responses, and list
`Authorization` explicitly in `Access-Control-Allow-Headers` (Chrome no longer
honors `*` for Authorization — this also clears the deprecation warning the
frontend logs). Expected saving: ~300–450ms per endpoint per session.

## 2. `/api/v1/branches` latency

**1,359ms server wait (TTFB) for a ~1KB response.** This endpoint sits on the
critical path of every page load (branch selector in the header). Target: <200ms.

## 3. `/api/v1/bills` latency + compression

602ms server wait, then **~1.2s transferring 43KB** (total 1,918ms for a
100-row page). Two asks:
1. Profile the query (6-month range, limit=100, offset=0).
2. Verify gzip/brotli is enabled on API responses — 43KB should transfer in
   tens of ms, not 1.2s.

## 4. Serial startup waterfall context (frontend ticket reference)

Cold load today: `/user/me` (1,133ms) → `/branches` (1,810ms) → `/bills`
(1,918ms) + `/metadata` (587ms) ≈ 3.5s mostly-serial before the first list
renders. The frontend now preloads `/branches` + `/metadata` in parallel with
auth (June 2026), but items 1–3 above still dominate the remaining time.

## 5. Carried over from the June 2026 frontend performance round

1. **Server-side `ingredient_name` join on `/api/v1/invoice-details`** — the
   frontend currently fetches the ingredient list separately and joins
   client-side.
2. **Server-side totals/aggregations for list footers** — so list pages can
   show totals without fetching every row.
3. **Multi-select filters accepting plural `_ids` params** (e.g.
   `ingredient_ids=a,b,c`) so filtering stays server-side.
4. **Sane pagination defaults** — several endpoints truncate at a low default
   page size, which forced the frontend to use `limit=1000/2000` workarounds
   (see `forcedListEndpoints` interceptor in `src/lib/axios.ts`). Once fixed,
   those workarounds get deleted and payload-parsing cost drops.
