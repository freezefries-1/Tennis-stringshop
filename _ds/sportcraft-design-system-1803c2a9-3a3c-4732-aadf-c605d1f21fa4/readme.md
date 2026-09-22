# SportCraft Design System

A design system for **SportCraft**, a modern specialist racket-sports workshop: restringing, grips, racket matching and club accounts across tennis, badminton, squash and padel.

The personality is **clean, precise, energetic, contemporary, technical and understated** — performance workshop meets modern sports brand meets a beautifully organised equipment room. The interface should read as expert and well-organised while staying friendly. It is explicitly **not** flashy sports graphics, not gaming UI, not generic corporate SaaS.

## Sources

**None were supplied.** There was no codebase, Figma file, .fig upload, deck, logo or photography attached to this project — only the written brand brief quoted above. Everything here was authored from that brief, so treat it as a proposal to react to rather than a record of an existing product. If you have real sources (repo URL, Figma link, brand assets), attach them and this system should be rebuilt against them.

Consequences of having no sources, all flagged again at the end of this file:
- **No logo.** The brand name is set in type wherever a mark would go (see `guidelines/logotype.html`). No mark was drawn or approximated.
- **No brand fonts.** Nearest Google Fonts matches are used (see Typography).
- **No photography or illustration.** Every image position in the website kit is a labelled placeholder block.
- **No icon set.** Lucide is linked from CDN as the closest match to the brief's "simple iconography".
- **Component inventory is a standard from-scratch set**, sized to what the two surfaces below actually need.

## Products

| Surface | Audience | Kit |
| --- | --- | --- |
| **SportCraft Workshop** — internal bench app: job queue, job detail, customers, string stock | Stringers and shop staff | `ui_kits/workshop-app/` |
| **SportCraft marketing site** — services, pricing, booking, workshop story | Players and clubs | `ui_kits/website/` |

---

## Content fundamentals

**Voice: the person at the bench, not the marketing department.** Plain, specific, slightly dry. Confidence comes from numbers and process, never from adjectives.

- **Person.** "We" for the workshop, "you/your" for the customer. Never "I". Internal UI is impersonal — "Bench load today", not "Your bench".
- **Casing.** Sentence case everywhere for headings, buttons and labels. The only uppercase is the mono micro-label (`TENSION`, `DUE`, `WORKSHOP`) at 10.5–12px with wide tracking. Never ALL-CAPS a sentence.
- **Punctuation.** No exclamation marks. Periods in body copy; none on headings, labels, buttons or table cells. Mid-dot separators for compact metadata: `SC-1042 · Blade 98 v9 · 24 / 23 kg`.
- **Numbers carry the message.** Prefer a figure to a claim: "82% same-day", "11,400 rackets strung", "in before 14:00, out by 18:00". Units are always explicit (kg, mm, hrs) and set in mono.
- **Headlines** are short, declarative, often two beats: *"Strung right, every time."* / *"Four sports, one bench, no guesswork"* / *"We keep the numbers so you don't have to"*.
- **Body copy** explains the mechanism, not the feeling: *"We log the string, tension, pattern and stringer for every job, so your next restring matches the last one to the kilo."*
- **Buttons** are verb + object, two or three words: *Book a restring*, *New job*, *Print ticket*, *Mark ready*, *Repeat this job*. Never *Submit*, *Learn more*, *Get started*.
- **Empty and error states** state the fact and the next move: *"No jobs match those filters."* / *"Workshop is full on this date"*.
- **Status words** are workshop words: *In queue*, *At the bench*, *Ready*, *Collected*, *Express*, *Low*, *Out*.
- **No emoji.** Anywhere. No exclamatory microcopy, no "oops", no jokes in error text.
- **Avoid**: "elevate", "unleash", "game-changing", "passion", "journey", "seamless", "world-class", sports-cliché verbs ("smash", "ace", "serve up") except where literal.

## Visual foundations

**Motifs.** Hairline rules; uppercase mono labels paired with tabular figures; the label/value spec table (`SpecList`) as the system's signature pattern; small radii; generous white space; a dark court-green band used once per page as the only heavy surface.

- **Colour.** Deep court green (`--court-700/800/900`) is structural: primary buttons, active states, the dark band, the footer. Optic yellow-green (`--optic-400/500`) is an accent used at most once per view — a single CTA, a mono label on dark, an "Express" badge — never as a background wash and never behind body text. Clay is the warm secondary for editorial contrast. Neutrals are cool greys (`--ink-*`); grounds are warm off-whites (`--paper-*`), with `--paper-050` as the default page and `--paper-000` for cards. Maximum two background colours per screen: paper plus one court-green panel. Four string-family dot colours (`--string-poly`, `--string-gut`, `--string-multi`, `--string-hybrid`) are a fixed semantic set — do not repurpose them.
- **Typography.** Display/heading: **Space Grotesk** semibold, tracking −0.008 to −0.022em, 16→56px. Body: **Archivo** regular/medium, 13.5/15/17px at 1.55. Labels, IDs, specs, prices and all numerals: **IBM Plex Mono**, with `font-variant-numeric: tabular-nums` so columns of figures align. Headings never exceed 56px; body never drops below 13.5px.
- **Spacing.** 8px base with 2 and 4 reserved for control interiors. Card padding 24px (20px in rails), stacks 16px, section rhythm 96px on marketing pages, 24px page gutters. Generous by default — when in doubt, add a step, don't subtract.
- **Backgrounds.** Flat colour only. **No gradients** anywhere except one utilitarian case: the 3px tone bar on `Toast`, drawn as a hard-stop linear-gradient. No textures, no patterns, no noise, no hand-drawn illustration. Photography sits in rounded 12px blocks; the dark band is solid `--court-900`.
- **Imagery.** Real photographs of the bench, frames, string reels and hands at work. Cool-neutral daylight, shallow depth of field, ordered compositions (the equipment room, not the action shot). No filters, no grain, no colour grading toward warm orange. No stock hero of someone mid-serve.
- **Borders and hairlines.** 1px `--ink-100` is the workhorse divider and card border; `--ink-200` for controls; 1.5px `--ink-700` only to close a group (a table's total row). Borders do the work shadows would do elsewhere.
- **Shadows.** Four steps, all neutral and short-throw: `--shadow-1` cards and rows, `--shadow-2` hover and popovers, `--shadow-3` toasts and menus, `--shadow-overlay` dialogs. Never coloured, never a large soft bloom, never on a flat panel that already has a border and no interaction.
- **Corner radii.** 3px (checkbox, badge), 5px (all controls and buttons), 8px (cards), 12px (media, dialogs), 18px (large feature panels), pill for `Tag` only. Nothing else is fully rounded except avatars.
- **Cards.** White, 1px `--ink-100`, 8px radius, `--shadow-1`, 24px padding. Hover on interactive cards goes to `--shadow-2` plus a slightly darker border — **no lift, no scale**. Tones: default, sunken (`--paper-100`), brand (`--court-050` on `--court-100`), inverse (`--ink-900`).
- **Hover states.** Solid buttons darken one step (700→800); outline and ghost controls gain a `--paper-100` tint and a darker border; rows tint to `--paper-050`; row actions fade in from 0 opacity; links move from `--court-600` to `--court-800`. Nothing brightens, nothing grows.
- **Press states.** One further colour step down (`--court-900`, `--paper-200`). **No scale transform, no inset shadow.**
- **Focus.** `--ring-focus`: a 2px paper offset plus a 4px optic-yellow ring. Inputs instead take a `--court-500` border and a 3px 12%-green halo. Never the browser default blue.
- **Animation.** 80–320ms with `--ease-standard` `cubic-bezier(0.2,0.6,0.2,1)` — precise, no bounce, no overshoot, no spring. Only colour, opacity, width and small position changes animate. Tooltips fade only. Dialogs appear without a scale-in. Nothing loops or pulses.
- **Transparency and blur.** Two places only: the sticky site header (88% paper + 10px blur) and the dialog scrim (38% court-green + 2px blur). Text is never set on a translucent surface.
- **Layout rules.** Marketing: 1200px max width, 32px gutters, sticky header, footer full-bleed dark. App: fixed 248px sidebar, fixed 60px top bar, scrolling content region, detail rails 316–340px, toasts pinned bottom-right 24px. No fixed floating action buttons.
- **Protection.** No scrims or protection gradients over imagery — captions and labels sit beside or beneath photographs, never on top of them.
- **Density.** Marketing is airy; the app is deliberately tighter (36px nav rows, 38px controls, 13–15px text) because it is used standing up at a bench. Both keep the same type and colour language.

## Iconography

- **Set:** [Lucide](https://lucide.dev), loaded from CDN: `https://unpkg.com/lucide@0.544.0/dist/umd/lucide.min.js`. **This is a substitution** — no icon assets were supplied. Lucide was chosen for its even 1.5–2px stroke, square-ish geometry and neutral tone, which matches the brief's "simple iconography".
- **Wrapper:** always render icons through the `Icon` component so size and stroke stay consistent. Stroke weight is **1.75** everywhere. Sizes: 14 (beside mono labels), 16 (inside inputs), 17–18 (buttons, nav), 20–22 (feature cards).
- **Colour:** monochrome, inheriting `currentColor`; `--ink-400` for decorative, `--court-600` for feature marks, tone colour inside `Toast`. Icons are never multi-colour, never filled shapes, never in a coloured circle badge.
- **Usage:** functional only — navigation, actions, status, metadata. No decorative icon rows, no icon per bullet. Text labels are preferred; icon-only controls must use `IconButton` with a `label` and usually a `Tooltip`.
- **Emoji:** never used. **Unicode as iconography:** only the mid-dot `·` as a metadata separator, `×` in string patterns (`16 × 19`) and `✓` in the booking stepper.
- **Local assets:** `assets/` is intentionally empty of logos and illustrations — nothing was supplied, so nothing was invented.

---

## Index

### Root
- `styles.css` — the one file consumers link; `@import`s everything below.
- `readme.md` — this guide.
- `SKILL.md` — Agent-Skills wrapper so this folder can be used from Claude Code.
- `thumbnail.html` — homepage tile.

### `tokens/`
`fonts.css` (webfont loading + family tokens) · `colors.css` (base palette + semantic aliases) · `typography.css` (sizes, line-heights, tracking, weights) · `spacing.css` (spacing scale, layout, radii, border widths) · `elevation.css` (shadows, rings) · `motion.css` (durations, easings) · `base.css` (element defaults, `.sc-label`, `.sc-num`).

### Components
`components/core/` — **Icon**, **Button**, **IconButton**, **Card**, **Badge**, **Tag**, **StatBlock**, **SpecList**
`components/forms/` — **Field**, **Input**, **Select**, **Checkbox**, **RadioGroup**, **Switch**
`components/navigation/` — **Tabs**, **SideNav**, **Breadcrumbs**
`components/feedback/` — **Dialog**, **Toast**, **Tooltip**, **ProgressBar**

Each component directory holds `<Name>.jsx`, `<Name>.d.ts`, `<Name>.prompt.md` and one `@dsCard` HTML showing its states.

**Intentional additions** beyond a generic primitive set, each because the two surfaces need it:
- **Icon** — wrapper so every Lucide glyph shares one size and stroke.
- **SpecList** — the label/value specification table; the brand's signature pattern (racket specs, order summaries).
- **StatBlock** — mono-captioned figure, used in both the bench dashboard and marketing proof points.
- **ProgressBar** — bench capacity and string-reel levels.
- **Field** — the mono uppercase label/hint/error wrapper shared by every form control.

### UI kits
- `ui_kits/workshop-app/` — internal bench app (job queue, job detail, customers, string stock, new-job dialog). See its README.
- `ui_kits/website/` — marketing site (home, services & pricing, three-step booking, the workshop). See its README.

### `templates/`
Starting folders a consuming project can copy. Each is a Design Component with a sibling `ds-base.js` (one line to repoint at the bound design system).
- `templates/workshop-screen/WorkshopScreen.dc.html` — bench app screen: sidebar, top bar, stat row, job table.
- `templates/marketing-page/MarketingPage.dc.html` — site page: sticky header, hero with stats, service grid, dark process band, footer.

### `guidelines/`
21 specimen cards feeding the Design System tab, grouped **Colors** (court, optic, clay, ink, paper, semantic signals, string families), **Type** (display, headings, body, mono, pairing in use), **Spacing** (scale, layout in use, radii, elevation) and **Brand** (motion, interaction states, logotype, brand surfaces, hairlines & rules).

### `assets/`
Empty by design — see the Sources note above.

## Open questions for the brand owner
1. **Fonts** — Space Grotesk / Archivo / IBM Plex Mono are stand-ins. Send the real licensed families (or confirm these) and the `@font-face` block in `tokens/fonts.css` gets rewritten against local binaries.
2. **Logo** — no mark exists here. Send logo files and the wordmark placeholders in both kits become the real thing.
3. **Photography** — every image slot is a labelled placeholder awaiting real workshop photography.
4. **Palette** — court green / optic yellow / clay is an interpretation of "performance workshop + modern sports brand". If SportCraft already has brand colours, they replace `tokens/colors.css`.
