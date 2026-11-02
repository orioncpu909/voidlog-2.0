# ARTHA brand palette (from artha.la)

Collected Oct 26, 2026. I read the colors from the live site's computed styles and its Wix theme variables on these pages: the homepage, /memberships, /thearthaexperience and /nonmemberapp.

## The look in one line
**Mostly black and warm near-black, with white condensed uppercase headlines over moody photography.** Warm earth tones (sand, olive-taupe, brown-black) carry the membership pages.

## Colors in use on the pages

| Swatch | Hex | Where it appears |
|---|---|---|
| Black | `#000000` | Hero and photo sections; most of the homepage |
| Warm near-black | `#261F1B` | Header and footer bars on every page |
| Brown-black | `#322F27` | Membership sections (Wix theme accent 2) |
| Olive-taupe | `#635E4E` | Membership card backgrounds, e.g. Restore (theme accent 3) |
| Sand | `#C6BC9B` | Page background, mostly hidden behind full-bleed photos (theme accent 4) |
| Copper | `#D68D51` | A block on the Non-Member App page, mostly behind imagery |
| Charcoal | `#2F2E2E` | Dark text and nav on light areas |
| White | `#FFFFFF` | Nearly all headlines and body text (on dark), and outlined buttons |
| Off-white | `#FAFAFA` | Button fills on the homepage |

## In the Wix theme, but not seen on the pages checked

| Role | Hex |
|---|---|
| Accent 1 and primary button / action color | `#9F2747` (burgundy) |
| Secondary background | `#E8E6E6` |
| Secondary text and lines | `#757575` |

## Left out (not ARTHA's brand)
- `#61698B`, `#09154A` and `#CCD2E0`: the third-party cookie and accessibility widget (Clym).
- `#FF4040`: a small red text accent on /memberships, probably form validation.

## Type
Headlines are a bold, condensed, all-caps sans serif (a custom font uploaded to Wix). Body text is a clean sans; Wix also loads Proxima Nova.

## Applied in the app (tailwind.config.ts, app/globals.css)

Sampled from the five brand mood photos: deep umber, sand and the amber glow of a shoji screen. Text is one tone per surface, near white on the page and near black on sand, so it holds up on a dimmed phone. Hierarchy comes from size and weight, not shades of brown. Tokens are CSS variables that flip inside a card (the `.bg-card` rule in `app/globals.css`).

| App role | Token | On the page | Inside a card |
|---|---|---|---|
| Background | `sand` | `#120702` deep umber | `#C4A77F` deeper sand panel |
| Cards and sheets | `card` | `#D5BD9B` sand | same |
| All normal text | `shell`, `muted`, `moss` | `#FFF8EE`, 18.8:1 | `#0A0401`, 11.2:1 |
| Amber text | `sage-deep` | `#FFC67D` | `#0A0401` |
| Warnings | `clay` | `#FFC4AE` | `#4A0E03` |
| Borders | `line` | `#53371F` | `#967856` |
| Buttons, Cancel, selected items | `sage` | `#ECAD62` shoji amber with `ink` text | `#D08C35` deeper amber |
| Studio City dot | `copper` | `#D68D51` | same |

The earlier light theme used cream `#F6F1E7` pages, white cards, black text, brown `#7A4E2D` and burgundy `#9F2747`. It's in git history before this change.

History: specials went copper, then gold at Miguel's request, and are never red, so the warning role took the burgundy family. On Oct 26 the browns were warmed to sienna; then the Book tab was rebuilt like the Open app in dark colors, and at Miguel's request the rest of the app (Home, Calendar, Account) moved to the same dark palette. He then asked for more contrast: pure black pages, white text, brighter accents and borders, and no faded (semi-transparent) text. Then he asked to keep black, gold and earthy brown as the main colors (brown cards, gold buttons). That read as too dark, so the app moved to a light cream theme that keeps the same three colors: black text, gold buttons and selections, brown accents.

## Fonts in the app
- Headings: Futura PT Cond Bold (`app/fonts`, class `font-heading`). Body text: Futura PT Book (`font-sans`). The ARTHA name in the header stays Cormorant Garamond (`font-wordmark`).
- Stat numbers use the body font through the `stat-num` class in `app/globals.css`: semibold with even-width digits. If a font can't load, text falls back to the phone's own app font.
