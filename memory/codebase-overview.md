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

## Data Flow (Current)

All data is MOCK. No real backend calls yet.

1. **CreateSnippet.tsx** → validates → simulates 800ms delay → redirects to `/s/{ID}/success?link=...`
2. **SuccessScreen.tsx** → parses ID + link from URL → shows copy actions
3. **ViewSnippet.tsx** → reads `:id` from route → looks up MOCK_SNIPPETS map → Prism highlights → copy/download buttons
4. **PasswordLock.tsx** → validates mock password ("secret") → would navigate to /s/:id with auth token in prod
5. **App.tsx** → wouter <Switch> handles all routes including fallback 404

## Design System

- **Palette**: Blue primary (brand-600), ochre accents, neutral base from shadcn
- **Theme**: Light-only currently (ThemeProvider default="light", switchable=false)
- **Typography**: Sans default, mono for code. font-mono for code/input fields.
- **Surface pattern**: `surface` class = bg-card + border-border + rounded-lg. `paper-grid` = engineering-paper fixed background.
- **Motion**: Framer Motion throughout — fadeInUp, staggered children, spring animations on icon containers
- **Custom CSS utilities**: `.container` (custom max-width/padding), `.paper-grid` (background pattern), `.surface` / `.surface-hover` etc.

## Key Patterns

1. **Page animation**: Every page uses same pattern — `<div className="fixed inset-0 paper-grid">` bg, `<div className="container relative z-10">` content wrapper, motion.div sequences per field
2. **Form validation**: Hand-rolled in CreateSnippet (no react-hook-form despite having it as dep)
3. **Route params**: wouter `useLocation()` + regex match or `useParams` for `:id`
4. **Cookie constants**: COOKIE_NAME, ONE_YEAR_MS exported from shared but unused in client yet
5. **getLoginUrl()**: Legacy OAuth stub in const.ts — references VITE_OAUTH_PORTAL_URL env vars, points to `/api/oauth/callback` endpoint that doesn't exist yet
6. **I18N ready**: Hidden English-variant locales in index.html comment block
7. **Prism setup**: Manually imports each language component; PRISM_LANG_MAP maps human names → prism keys

## What's Missing / Future

- No real backend: Express serves only static files. MOCK_SNIPPETS in ViewSnippet instead of API calls.
- No persistence layer: No DB, no file storage. Snippets can't actually be saved or retrieved.
- No auth: getLoginUrl() stub, no real OAuth flow.
- No rate limiting despite being mentioned in copy.
- Cleanup cron/background job for expired snippets not implemented.
- CreateSnippet form uses manual state instead of react-hook-form (dep already installed).
- TypeScript strict with noUnusedLocals/Parameters — const.ts and shared/const.ts will have unused export warnings.

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
