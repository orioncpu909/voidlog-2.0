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

## Applied in the app (tailwind.config.ts)

A dark theme built on ARTHA's warm near-black: **cream** text, **gold** buttons and selected items, and **warm tan** links and accents.

| App role | Token | Color | Notes |
|---|---|---|---|
| Page background, header, tab bar | `sand` | `#000000` | Black, ARTHA's main site color |
| Cards and sheets | `card` | `#261F1B` | ARTHA's warm near-black |
| Borders and dividers | `line` | `#463B32` | Warm brown |
| Main text and headings | `shell` | `#F6F1E7` | Cream, 14.4:1 on cards (the token name is historical) |
| Text on gold and other light fills | `ink` | `#15110E` | 9:1 on gold |
| Buttons, selected day, tab underline, account badge, specials | `sage` | `#D9AE4F` | Gold |
| Special prices, gold text | `sage-deep` | `#E6C477` | Light gold, 9.7:1 on cards |
| Streak flame | `sage-light` | `#C99A3B` | |
| Secondary text | `muted` | `#BDB0A0` | Warm gray, 7.6:1 on cards |
| Links, icons, chart bars, credits, "Booked" | `moss` | `#D9AE85` | Warm tan, 8:1 on cards. Soft tint `#3A2C20` |
| Warnings, late cancels, Cancel buttons | `clay` | `#F0859F` | ARTHA burgundy, lifted for dark, 6.6:1 on cards. Soft tint `#43202B` |
| Cancel button outlines | `clay-deep` | `#9F2747` | ARTHA burgundy border only; the button text stays `clay` so it reads on dark |
| Studio City dot | `copper` | `#D68D51` | Never behind text |

The earlier light theme used cream `#F6F1E7` pages, white cards, black text, brown `#7A4E2D` and burgundy `#9F2747`. It's in git history before this change.

History: specials went copper, then gold at Miguel's request, and are never red, so the warning role took the burgundy family. On Oct 26 the browns were warmed to sienna; then the Book tab was rebuilt like the Open app in dark colors, and at Miguel's request the rest of the app (Home, Calendar, Account) moved to the same dark palette. He then asked for more contrast: pure black pages, white text, brighter accents and borders, and no faded (semi-transparent) text. Then he asked to keep black, gold and earthy brown as the main colors (brown cards, gold buttons). That read as too dark, so the app moved to a light cream theme that keeps the same three colors: black text, gold buttons and selections, brown accents.

## Fonts in the app
- Headings: Cormorant Garamond (serif).
- Everything else, including all numbers: the phone's own app font (SF Pro on iPhone and Mac, Roboto on Android). Stat numbers use the `stat-num` class in `app/globals.css`: semibold with even-width digits.
