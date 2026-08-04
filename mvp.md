# DevDrop — MVP Spec

## Tagline
Share code in seconds. No account. No clutter.

## Core Value
Not another Pastebin clone. DevDrop = beautiful, temporary, secure code sharing.

Flow: **Paste → Create → Share link.** Everything else is secondary.

---

## User Flow

```
Landing Page
     │
     ▼
Create Snippet
     │
     ▼
Snippet Created
     │
     ▼
Copy Link
     │
     ▼
Friend Opens Link
     │
     ▼
Password Screen (if protected)
     │
     ▼
View + Copy + Download
```

---

## 1. Landing Page

```
------------------------------------
DevDrop
Share code instantly.
No login required.

Paste. Share. Done.

[ Create Snippet ]
------------------------------------

⚡ Fast   🔒 Password Protected   ⌛ Temporary Links   📋 One-click Copy
```

---

## 2. Create Snippet

**Fields**
| Field | Required | Notes |
|---|---|---|
| Title | No | Default: "Untitled Snippet". Max 100 chars. |
| Language | No | Default: Auto Detect (Prism autoloader / highlight.js heuristics) |
| Code | Yes | Max **500 KB**. Empty submission rejected client + server side. |
| Expiration | Yes | Default: 24 hours |
| Password | No | Min 4 chars if set. Hashed with `password_hash()` (bcrypt), never stored plain. |

**Language Dropdown**
Auto Detect · JavaScript · TypeScript · Python · PHP · Java · Go · Rust · C++ · HTML · CSS · JSON · Markdown · Text

**Expiration**
10 min · 1 hour · 24 hours · 7 days · Never

**Button:** `Create Snippet`

**Validation (server-side, non-negotiable — client JS is not trusted):**
- `code` non-empty, ≤ 500,000 bytes
- `title` ≤ 100 chars, stripped of HTML
- `language` must match allow-list enum (reject unknown values)
- `expiration` must match allow-list enum
- `password`, if present, ≥ 4 chars, hashed before storage
- Reject request if `code` field missing entirely (malformed request)

---

## 3. Success Screen

```
✓ Snippet Created

https://devdrop.app/s/9AB23X

[Copy Link]   [Open]
```

- Link ID: 8-char base62 (`[A-Za-z0-9]`), generated server-side, collision-checked against `id` column before insert.
- Do **not** use auto-increment integer IDs in the public URL — enumerable, leaks snippet count. UUID stored internally; short public ID is separate indexed column.

---

## 4. View Snippet

```
My API Helper
PHP
Created 3 minutes ago · Expires in 57 minutes
────────────────────
<code block>
────────────────────
Copy    Download
```

- `views` column increments once per unique page load (not per copy/download) — simple `UPDATE snippets SET views = views + 1 WHERE id = ?` on successful GET, after password check passes (if protected).
- Expired snippet → 404 page, not a 500 or blank screen.
- Code block rendered as **escaped text node**, then Prism.js applies highlighting client-side. Never inject raw code via `innerHTML`. This is the #1 XSS vector for a code-sharing tool — a pasted `<script>` must never execute on view.

---

## 5. Password Lock

```
Protected Snippet
Password
[Unlock]
```

- `POST /api/snippets/:uuid/unlock` verifies against `password_hash`, returns short-lived signed token (JWT or HMAC-signed, 15 min TTL) used to fetch the actual code via the GET endpoint.
- Rate limit unlock attempts: 5 per IP per snippet per 10 min → 429 after that (see Security section).

---

## 6. Copy Code
One click → button text flips to `Copied ✓` for 2s, uses `navigator.clipboard.writeText`.

## 7. Download
Downloads as `snippet.{ext}` — extension mapped from `language` field (e.g. `php`, `js`, `py`, `txt` fallback for unknown/Text).

## 8. Expiration

**Cron (runs every 5 min via system cron, not user-triggered):**
```sql
DELETE FROM snippets WHERE expires_at IS NOT NULL AND expires_at < NOW();
```
- `expires_at NULL` = "Never" expiration, excluded from cleanup.
- Cron script lives at `storage/cron/purge_expired.php`, invoked via system crontab, not a public route.

---

## Database

**`snippets`**
| Column | Type | Notes |
|---|---|---|
| id | BIGINT UNSIGNED AUTO_INCREMENT PK | internal only |
| uuid | CHAR(36) UNIQUE | internal reference |
| public_id | CHAR(8) UNIQUE, INDEXED | used in URLs, base62 |
| title | VARCHAR(100) NULL | |
| language | VARCHAR(20) | enum-validated |
| code | MEDIUMTEXT | up to 16MB col capacity, app-enforced 500KB limit |
| password_hash | VARCHAR(255) NULL | bcrypt |
| expires_at | DATETIME NULL | indexed, NULL = never |
| views | INT UNSIGNED DEFAULT 0 | |
| created_at | DATETIME DEFAULT CURRENT_TIMESTAMP | |
| ip_hash | VARCHAR(64) NULL | SHA-256 of creator IP, for abuse rate-limiting only — never store raw IP |

**Indexes:** `public_id` (unique), `expires_at` (for cron sweep), composite `(ip_hash, created_at)` for rate limiting.

---

## Pages
```
/                       Landing
/create                 Create Snippet
/snippet/{public_id}    View (or Password Screen if protected)
/404                    Not found / expired
/about                  About
```

## API

| Method | Route | Notes |
|---|---|---|
| POST | `/api/snippets` | Create. Returns `public_id`. Rate limited: 10/min/IP. |
| GET | `/api/snippets/:public_id` | Returns snippet unless protected → returns `{protected: true}` with no code. |
| POST | `/api/snippets/:public_id/unlock` | Body: `{password}`. Returns signed token + code on success. Rate limited: 5/10min/IP/snippet. |
| GET | `/api/snippets/:public_id/download` | Streams file. Same access rules as view. |

**Standard error shape:**
```json
{ "error": { "code": "SNIPPET_EXPIRED", "message": "This snippet has expired." } }
```
Codes: `SNIPPET_NOT_FOUND`, `SNIPPET_EXPIRED`, `INVALID_PASSWORD`, `RATE_LIMITED`, `VALIDATION_ERROR`, `PAYLOAD_TOO_LARGE`.

---

## Security (added — was missing from original spec)

- **XSS:** code always rendered as text content, never `innerHTML`. CSP header: `default-src 'self'; script-src 'self' 'unsafe-inline' cdn.jsdelivr.net` (tighten once Prism is self-hosted).
- **Rate limiting:** IP-hash + sliding window in `rate_limits` table or Redis if available. Applies to create, unlock, and download routes.
- **CSRF:** not applicable — no session cookies / stateless API. If admin/about forms added later, add token then.
- **Headers:** `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`.
- **Password unlock brute-force:** lockout after 5 failed attempts per snippet per IP per 10 min (429).
- **No IP stored raw** — hash only, purged with snippet.
- **Payload limits:** enforce 500KB at both Nginx/Apache (`client_max_body_size`) and PHP (`post_max_size`, `upload_max_filesize`) layers, not just app code.
- **SQL:** PDO prepared statements only, no string concatenation — enforced project-wide.

---

## Folder Structure
```
devdrop/
  app/
    Controllers/
    Models/
    Services/
  config/
  database/
    migrations/
  public/
  resources/
    views/
  routes/
  storage/
    cron/
  assets/
```

---

## Modern UI

**Landing**
```
+------------------------------------+
Share code instantly
No login required
[ Create ]
+------------------------------------+
```

**Code viewer**
```
+------------------------------------+
PHP          Copy   Download
──────────────────────
<?php
echo "Hello";
──────────────────────
+------------------------------------+
```

## Color Palette
| Role | Hex |
|---|---|
| Background | `#0F172A` |
| Card | `#1E293B` |
| Primary | `#3B82F6` |
| Success | `#22C55E` |
| Text | `#F8FAFC` |

## Tech Stack

**Backend:** PHP 8.3 · MySQL · PDO
**Frontend:** Tailwind CSS · Alpine.js · Prism.js
**Deployment:** Apache/Nginx · shared-hosting compatible

## Micro Interactions
- Copy button → `Copied ✓` (2s reset)
- Countdown updates every second (client-side `setInterval`, computed from `expires_at` sent once from server — no polling)
- Smooth page transitions
- Skeleton loader while snippet loads
- Syntax highlighting on load

---

## Future Roadmap (Post-MVP)
User accounts · Collections/Folders · Team workspaces · Markdown preview · Burn after first view · QR code sharing · Share as image · AI code explanation · AI bug detection · AI optimization suggestions · Version history · GitHub Gist import · Drag-and-drop file upload · Public snippet explorer · REST API (public) · Embed snippets

---

## Changelog vs original spec
- Added server-side validation rules (size caps, enum checks)
- Fixed XSS risk in code viewer (escape before highlight, no innerHTML)
- Added rate limiting on create/unlock/download
- Replaced enumerable public ID with base62 short ID separate from internal PK/UUID
- Added `ip_hash` for abuse prevention without storing raw IPs
- Defined view-count increment trigger precisely
- Added standard API error shape + codes
- Added security headers + CSP
- Enforced payload limits at server + app layer
- Cron clarified as system-level, not public route
