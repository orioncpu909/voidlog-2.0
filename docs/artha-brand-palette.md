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

| App role | Token | Color | Brand source |
|---|---|---|---|
| Page background | `sand` | `#EEEAE0` | Light tint of sand `#C6BC9B` (easier to read than full sand) |
| Cards | `shell` | `#FAF8F3` | Warm off-white |
| Text | `ink` | `#2F2E2E` | Charcoal |
| Primary: buttons, active tab, streak card, Classes tile | `moss` | `#5C4733` | Mid-brown, lighter than ARTHA's near-black `#261F1B` so it stands out from dark photos and tiles (white text 8.7:1) |
| Therapies tile | `ocean` | `#322F27` | Brown-black |
| Treatments tile | `walnut` | `#635E4E` | Olive-taupe |
| Specials background | `sage` | `#C9A44C` | Gold, with charcoal text on it (5.7:1). White text on gold fails, so never use it there |
| Special prices and badges on light backgrounds | `sage-deep` | `#7A5C12` | Deep gold (5.9:1 on cards) |
| Accents on dark (streak flame, Studio City dot) | `copper` | `#D68D51` | Copper, used as-is (2.7:1 with white text, so never behind text) |
| Warnings and credits | `clay` | `#9F2747` | Burgundy |

Specials are gold: first copper, then gold at Miguel's request. They're never burgundy, because Miguel asked that specials not be red, so burgundy took the warning role. The primary brown was lightened at his request for better contrast.
