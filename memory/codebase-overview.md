---
name: codebase-overview
description: Full project map — what Snipt is, how it's organized, every source file's role
metadata:
  type: project
---

# Snipt Codebase Overview

## What It Is

Snipt (formerly DevDrop) — ephemeral code snippet sharing app. Paste code, get link, snippet expires on schedule. No accounts, no tracking, no persistence by design. React 19 + Vite 7 + Express, pnpm monorepo, currently a frontend-first prototype.

## Project Structure

```
Snipt/
├── package.json          # pnpm ESM project, deps below
├── tsconfig.json         # client/src, shared/, server/ compiled by Vite
├── tsconfig.node.json    # vite.config.ts only
├── vite.config.ts        # React + Tailwind CSS v4 + Manus plugins, port 3000
├── components.json       # shadcn/ui config (new-york style, neutral base)
├── template.json         # project template metadata (web-static type)
├── server/
│   └── index.ts          # Static file server, client-side routing fallback
├── shared/
│   └── const.ts          # COOKIE_NAME, ONE_YEAR_MS (future backend use)
├── client/
│   ├── index.html        # Root HTML, loads /src/main.tsx, has analytics placeholder
│   └── src/
│       ├── main.tsx        # Root mount, renders <App />
│       ├── App.tsx         # Router with wouter <Switch>, all pages wrapped in Layout+ErrorBoundary+ThemeProvider
│       ├── index.css       # Tailwind CSS v4 + custom theme tokens, paper-grid bg, container utilities
│       ├── prism-theme.css # Prism.js syntax highlighting theme
│       ├── const.ts        # Re-exports shared/const.ts, has getLoginUrl() (legacy OAuth stub)
│       ├── components/
│       │   ├── Layout.tsx      # Fixed navbar (scroll-aware), mobile menu, footer, Lenis smooth scroll
│       │   ├── ErrorBoundary.tsx # Class-based error boundary with stack display + reload
│       │   ├── ManusDialog.tsx  # Login dialog stub (Manus-authored, not used in app)
│       │   ├── Map.tsx          # Google Maps wrapper via Forge proxy API
│       │   └── ui/              # ~50 shadcn/ui primitives (button, card, dialog, form, input, sonner, etc.)
│       ├── pages/
│       │   ├── Home.tsx        # Landing: hero with code preview, features grid, 3-step how-it-works
│       │   ├── CreateSnippet.tsx # Form: title, language, expiration, password-protect, submit
│       │   ├── ViewSnippet.tsx # Code viewer: Prism.js highlight, copy, download, mock data
│       │   ├── SuccessScreen.tsx # Post-create: link display, copy, open actions
│       │   ├── PasswordLock.tsx # Password entry for protected snippets (mock: "secret")
│       │   ├── About.tsx       # Project info, features, security, tech stack
│       │   └── NotFound.tsx    # 404 page with go-home / create buttons
│       ├── contexts/
│       │   └── ThemeContext.tsx # Light/dark theme provider (not switchable — default="light")
│       ├── hooks/
│       │   ├── useComposition.ts # IME input composition tracking (CJK keyboard support)
│       │   ├── usePersistFn.ts   # useRef-based stable function reference (avoids useCallback re-creation)
│       │   └── useMobile.tsx     # MediaQuery breakpoint at 768px
│       └── lib/
│           └── utils.ts          # cn() — clsx + twMerge for Tailwind class merging
├── patches/
│   └── wouter@3.7.1.patch   # Applied to wouter via pnpm overrides
├── client/public/
│   ├── __manus__/            # Manus runtime artifacts (version.json, debug-collector.js)
│   └── .gitkeep
├── .manus-logs/
│   └── browserConsole.log    # Dev-mode browser log collection
├── FUTURE.md                 # Planned features
├── ideas.md                  # Concept notes
├── screenshot-notes.md       # Screenshot tracking
└── .gitignore, .prettierrc, .prettierignore

## Key Dependencies

- **UI**: React 19, wouter (routing), Framer Motion, Lenis (scroll), shadcn/ui + Radix primitives, Lucide icons
- **Styling**: Tailwind CSS v4, clsx, tailwind-merge, class-variance-authority
- **Code display**: Prism.js (language detection + highlight), react-syntax-highlighter available
- **State**: React hooks only — no global state, no data fetching library
- **Toasts**: sonner
- **Backend**: Express (static hosting only currently)
- **Unique**: streamdown (markdown renderer), nanoid (ID gen), next-themes (not used currently), valva (drawer), embla (carousel), recharts (available but unused)
- **Dev**: Vite 7, esbuild, pnpm, vitest, playwright-ready

## Data Flow

Data flow uses real API endpoints `/api/snippets` connected to the PHP backend (`api/`) backed by PostgreSQL/MySQL. Express (`server/index.ts`) and Vite dev server reverse-proxy `/api/*` calls.

1. **CreateSnippet.tsx** → validates with `react-hook-form` + `zod` → sends JSON (code paste mode) or `multipart/form-data` (zip upload mode with `JSZip` client-side preview) to `POST /api/snippets` → redirects to `/s/{ID}/success?link=...`
2. **SuccessScreen.tsx** → parses ID + link from URL → shows copy actions
3. **ViewSnippet.tsx** → reads `:id` from route → fetches `/api/snippets/:id` → if code type: Prism highlights; if zip type: JSZip unzips archive & renders file tree view with code viewer → copy/download actions (streams ZIP or text file from `/api/snippets/:id/download`)
4. **PasswordLock.tsx** → validates password against `/api/snippets/:id/unlock` → acquires JWT token for viewing protected snippets
5. **App.tsx** → wouter <Switch> handles all routes including fallback 404

## Design System

- **Palette**: Blue primary (brand-600), ochre accents, neutral base from shadcn
- **Theme**: Light-only currently (ThemeProvider default="light", switchable=false)
- **Typography**: Sans default, mono for code. font-mono for code/input fields.
- **Surface pattern**: `surface` class = bg-card + border-border + rounded-lg. `paper-grid` = engineering-paper fixed background.
- **Motion**: Framer Motion throughout — fadeInUp, staggered children, spring animations on icon containers
- **Custom CSS utilities**: `.container` (custom max-width/padding), `.paper-grid` (background pattern), `.surface` / `.surface-hover` etc.

## Key Patterns

1. **Page animation**: Every page uses standard motion pattern — `<div className="fixed inset-0 paper-grid">` bg, `<div className="container relative z-10">` content wrapper, motion.div sequences per field
2. **Form validation**: `react-hook-form` + `@hookform/resolvers/zod` + `zod` in `CreateSnippet.tsx`
3. **Route params**: wouter `useLocation()` + regex match or `useParams` for `:id`
4. **Prism setup**: Manually imports each language component; PRISM_LANG_MAP maps human names → prism keys
5. **ZIP Snippets**: JSZip for client-side archive preview/unzipping in frontend, PHP `ZipArchive` validation (max 10MB, executable restriction) and file storage on disk (`storage/snippets/`) in backend

## What's Missing / Future

- Cleanup cron/background job for expired snippets from disk storage and DB.
- OAuth user authentication integration if persistent user dashboards are desired.

## Route Map

| Path | Component |
|------|-----------|
| `/` | Home |
| `/create` | CreateSnippet |
| `/s/:id` | ViewSnippet |
| `/s/:id/success` | SuccessScreen |
| `/s/:id/lock` | PasswordLock |
| `/about` | About |
| `/404` | NotFound |
| `*` fallback | NotFound |
