# DevDrop — UI/UX Guide & Future Reference

This document is the source of truth for adding any new page or component.
Read it before writing markup. If a rule below conflicts with a design idea,
the rule wins.

---

## 1. Why the redesign happened (critique of the old UI)

| Problem | Why it read as "AI-generated" | Fix applied |
|---|---|---|
| Dark slate + teal/cyan glow | The default LLM aesthetic (dark glass + neon accent) | Light "bone paper" background, single ochre accent |
| `backdrop-blur` glass cards everywhere | Blur has no informational purpose; it reduced text contrast | Flat `.surface` paper cards with hairline borders |
| Mesh/radial gradient blobs | Decorative noise, no hierarchy | Faint engineering `paper-grid` texture, masked at edges |
| Gradient text on every heading | Gradients on type hurt legibility and look templated | Solid ink headings; ochre used only on one keyword |
| Floating macOS window mockup with glow + tilt | Fake-product screenshot cliché | Static, flush code panel with real line numbers |
| Pulsing dots, bouncing chevrons, staggered fade-ins on everything | Motion with no meaning | Motion only on entry (one pass) and on hover of interactive elements |
| Everything `font-bold` | Flattens hierarchy | Weight scale 400/500/600; size + color carry hierarchy |

---

## 2. Design system: **Ink & Ochre**

Editorial, printed-matter feel. Warm paper, dark ink, one earned accent.
All colors are OKLCH and live in `client/src/index.css`. **Never hardcode a hex
or a Tailwind palette color (`text-slate-400`, `bg-teal-500`) in a component.**

### Tokens

| Token | Role |
|---|---|
| `--background` | Bone paper — page canvas |
| `--card` / `--popover` | Slightly lighter paper — raised surfaces |
| `--foreground` | Ink 900 — primary text |
| `--muted` / `--muted-foreground` | Warm grey fill / secondary text |
| `--border` / `--input` | Hairline ink 200 |
| `--primary` / `--brand-600` | Burnt ochre — primary action |
| `--brand-700` | Deeper ochre — accent text on light |
| `--brand-100` | Ochre wash — icon tiles, active nav pill |
| `--destructive` | Clay red — errors only |

Ramp variables `--brand-50 … --brand-900` and `--ink-50 … --ink-900` exist for
edge cases. Use semantic tokens first.

### Type

- UI: **Geist** (`font-sans`)
- Code, metadata, IDs, byte counts: **JetBrains Mono** (`font-mono`)
- Headings: `font-semibold`, tight tracking. Never `font-black`.
- Body: `text-sm`/`text-base`, `text-muted-foreground`.
- Accent one word per heading with `text-brand-700`. Never a gradient.

### Surfaces & depth

- `.surface` = `bg-card` + `border border-border` + flat micro-shadow. Use it for
  every card, panel, and modal.
- Radius: `rounded-lg` (8px) default, `rounded-md` for inputs/buttons,
  `rounded-full` only for badges and avatars.
- Shadows: `shadow-paper` only. No colored glows, no `shadow-2xl`.
- Never `backdrop-blur`, never `bg-white/5`, never `bg-gradient-to-*` on a surface.

### Motion

- Entry: `opacity 0→1`, `y 8px→0`, `duration 0.35–0.4s`, max `0.1s` stagger.
- Hover: color/border change only, `duration-200`.
- No infinite loops (pulse, bounce, ping) except a genuine loading spinner.

### Accessibility

- Body text ≥ 4.5:1, large text ≥ 3:1 against its own surface.
- Every icon-only button needs `aria-label`.
- Focus: `focus-visible:ring-2 ring-brand-600 ring-offset-2 ring-offset-background`.

---

## 3. Adding a new page

```tsx
// client/src/pages/MyPage.tsx
import { motion } from "framer-motion";

export default function MyPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-semibold tracking-tight">
            Page <span className="text-brand-700">Title</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            One sentence of purpose. No marketing filler.
          </p>
        </motion.header>

        <section className="surface rounded-lg p-6 mt-8">…</section>
      </div>
    </div>
  );
}
```

Then register it in `client/src/App.tsx`:

```tsx
<Route path="/my-page" component={MyPage} />
```

`Layout` (nav + footer + page background texture) wraps all routes already —
do **not** re-add the header, footer, or `paper-grid` div inside a page.

### Container widths
| Content | Width |
|---|---|
| Forms, single-column reading | `max-w-3xl` |
| Code viewers, wide tables | `max-w-5xl` |
| Marketing sections | `max-w-6xl` |

Vertical rhythm: `py-16` page padding, `mt-8`/`mt-12` between sections, `p-6` inside cards.

---

## 4. Adding a new component

1. Check `client/src/components/ui/` first — shadcn primitives are already themed.
2. Style with semantic tokens only.
3. Keep it presentational; fetch data in the page, pass props down.
4. Component checklist before commit:
   - [ ] No hex codes, no `slate-*`/`teal-*`/`white`/`black` utilities
   - [ ] No `backdrop-blur`, glow, or gradient background
   - [ ] Uses `.surface` for any raised container
   - [ ] Focus-visible ring present on interactive elements
   - [ ] Motion is single-pass, ≤ 0.4s
   - [ ] Renders correctly at 375px width

### Button conventions
| Intent | Classes |
|---|---|
| Primary | `bg-brand-600 text-primary-foreground hover:bg-brand-700` |
| Secondary | `bg-card text-foreground border border-border hover:bg-muted hover:border-brand-300` |
| Ghost | `text-muted-foreground hover:text-foreground hover:bg-muted` |
| Destructive | `bg-destructive text-destructive-foreground` |

Never use two primary buttons in the same view.

---

## 5. Code display

- Syntax colors live in `client/src/prism-theme.css` (light, high-contrast, ochre-keyed).
- Code panels: `bg-card`, mono, `whitespace-pre`, line-number gutter in `text-muted-foreground`.
- Do **not** re-add traffic-light dots or fake window chrome; label the panel with
  the real filename instead.

---

## 6. Project map

```
client/src/
  index.css          ← design tokens, .surface, .paper-grid  (edit tokens HERE only)
  prism-theme.css    ← syntax highlighting
  App.tsx            ← routes + theme + toaster
  components/
    Layout.tsx       ← nav, footer, page texture
    ui/              ← shadcn primitives (themed)
  pages/             ← Home, CreateSnippet, ViewSnippet, Success, Lock, About, NotFound
  contexts/ThemeContext.tsx
server/              ← Express API (snippets, rate limiting, bcrypt)
shared/              ← types shared by client + server
```

---

## 7. Things deliberately removed — do not reintroduce

- Dark theme as the default (light is the product's identity now)
- Teal / cyan / indigo / purple accents
- Glassmorphism, mesh gradients, glow shadows
- Gradient headline text
- Bouncing scroll indicators, pulsing status dots
- Fake browser/macOS window frames
- Hosted `/manus-storage/` logo images — the brand mark is typographic (`</>` tile + "Dev**Drop**")
