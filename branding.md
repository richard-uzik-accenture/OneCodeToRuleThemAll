# Reflow — Brand identity

*A day-planning app for people whose plans get interrupted. Your day doesn't fall apart — it reflows.*

---

## The core idea

**"Reflow" is already a typographic term.** It's what text does when its container changes shape: it re-wraps, nothing is lost, the paragraph just finds a new arrangement.

That is the entire brand thesis in one word, and it does two useful things:

1. It's calm by nature. Reflowing is not a crisis, it's a routine layout operation.
2. It gives the identity a ready-made visual vocabulary — lines, bars, wrapping, obstacles, order.

Every decision below traces back to this. When in doubt: *interruption is the assumed condition, not a failure.*

---

## 1. Logo

### Concept A — The comparator

Two chevrons (`>` and `<`) facing each other, with a thin coral sliver in the gap between them — the task that just landed in its slot.

- **Strength:** most direct nod to the swipe-to-compare mechanic; best silhouette at 40px.
- **Risk:** chevrons are common in tech logos. Make the gap wider than feels comfortable — that's what makes it read as *a space being made* rather than *fast-forward*.

### Concept B — The reflow (recommended)

A stack of rounded bars that shortens around a solid coral circle. Reads simultaneously as a ranked task list and as a paragraph wrapping around an object.

- **Strength:** the product thesis in one shape. The interruption isn't drawn as a problem — the lines simply accommodate it. Most ownable of the set; nothing in the category looks like this.
- **Risk:** needs generous spacing between bars or it turns into a hamburger menu at small sizes.

### Concept C — The confluence

Two curves entering from the left — the plan (paper) and the unplanned thing (coral) — merging into a single ordered line exiting right.

- **Strength:** warmest and most "personal tool" of the three.
- **Risk:** the curves lose definition below ~32px. Better as a wordmark companion than a standalone app icon.

### Concept D — The chevron-leg monogram (worth prototyping)

A geometric lowercase or capital `R` whose leg is replaced by a chevron. The letterform stays calm and quiet; the one clever move hides in the descender.

- Good for favicons, stamps, and anywhere the full mark is too much.
- Rewards a second look without announcing itself.

### Recommendation

**Concept B as the primary mark**, with **D** as a secondary/favicon mark. B carries the meaning, D carries the personality.

### Lockup rules

- Mark on the left, wordmark on the right.
- Match the mark's height to the wordmark's **x-height**, not its cap-height. Slightly undersizing the mark makes it feel like a companion rather than a badge.
- Gap between mark and wordmark = the width of the wordmark's `o`.
- Minimum clear space on all sides = the height of the mark's smallest element.
- Stacked (mark above wordmark) is permitted for square placements only. Never arch, rotate, or outline the mark.

### App icon

- Background: `ink violet #171335`, full-bleed, system corner radius.
- Mark: `paper #FAF9FB`, with exactly one coral element.
- No wordmark, no gradient, no shadow, no inner border.
- Test at 40px before anything else. If the silhouette doesn't survive, the mark is wrong.

### SVG source

Each is a 118×118 app-icon tile. For a light-background version, delete the first `<rect>` and change `#FAF9FB` to `#171335`.

**A — The comparator**

```svg
<svg viewBox="0 0 118 118" xmlns="http://www.w3.org/2000/svg">
  <rect width="118" height="118" rx="26" fill="#171335"/>
  <path d="M 30,38 L 52,59 L 30,80" fill="none" stroke="#FAF9FB" stroke-width="9"
        stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M 88,38 L 66,59 L 88,80" fill="none" stroke="#FAF9FB" stroke-width="9"
        stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="56" y="47" width="6" height="24" rx="3" fill="#FF6B4A"/>
</svg>
```

**B — The reflow**

```svg
<svg viewBox="0 0 118 118" xmlns="http://www.w3.org/2000/svg">
  <rect width="118" height="118" rx="26" fill="#171335"/>
  <circle cx="80" cy="61" r="14" fill="#FF6B4A"/>
  <rect x="24" y="23" width="70" height="6" rx="3" fill="#FAF9FB"/>
  <rect x="24" y="37" width="70" height="6" rx="3" fill="#FAF9FB"/>
  <rect x="24" y="51" width="36" height="6" rx="3" fill="#FAF9FB"/>
  <rect x="24" y="65" width="36" height="6" rx="3" fill="#FAF9FB"/>
  <rect x="24" y="79" width="70" height="6" rx="3" fill="#FAF9FB"/>
</svg>
```

**C — The confluence**

```svg
<svg viewBox="0 0 118 118" xmlns="http://www.w3.org/2000/svg">
  <rect width="118" height="118" rx="26" fill="#171335"/>
  <path d="M 28,40 C 48,40 50,59 68,59" fill="none" stroke="#FAF9FB"
        stroke-width="9" stroke-linecap="round"/>
  <path d="M 28,78 C 48,78 50,59 68,59" fill="none" stroke="#FF6B4A"
        stroke-width="9" stroke-linecap="round"/>
  <path d="M 64,59 L 92,59" fill="none" stroke="#FAF9FB"
        stroke-width="9" stroke-linecap="round"/>
</svg>
```

---

## 2. Color

> **Revised.** The original petrol-teal palette read as washed out and too close to "eco/finance app" in practice. Replaced with a bolder, higher-contrast direction below — same *rules* (one scarce decision accent, no red/green pair, warm neutrals), different hue and value. Every phase built after this revision uses these tokens; anything built earlier should be migrated, not left on the old values.

### Brand

| Token | Name | Hex | Role |
|---|---|---|---|
| `--ink-violet` | ink violet | `#171335` | Brand black, dark surfaces, app icon background |
| `--violet` | violet | `#4B3F8F` | Primary brand color, mark on light backgrounds |
| `--violet-soft` | violet soft | `#7A70B8` | Secondary/supporting, one side of a comparison |
| `--signal-coral` | signal coral | `#FF6B4A` | Accent — decisions only |
| `--coral-wash` | coral wash | `#FFE1D6` | Resting trace of a recent decision |

### Neutrals

| Token | Name | Hex | Role |
|---|---|---|---|
| `--paper` | paper | `#FAF9FB` | Page background, mark on dark |
| `--mist` | mist | `#F0EEF5` | Raised surfaces, dividers |
| `--haze` | haze | `#D9D6E4` | Hairlines, disabled |
| `--dusk` | dusk | `#7D7A8C` | Secondary text |
| `--ink` | ink | `#1A1A2E` | Body text |

### Why this palette

**Ink violet, not blue or teal.** Deep, saturated violet is uncommon as an app primary — distinct from Todoist (red), Things and most calendars (blue), Linear and Notion (purple-leaning grey, but desaturated where this is fully committed), and distinct from this app's own earlier teal direction, which read as too close to wellness/finance apps. Violet is cool enough to feel considered, saturated enough to not read as washed out.

**Cool-white neutrals, not warm paper.** `paper` and `mist` are a near-white with a faint cool-violet cast, not the warm cream of the original palette — the warmth was part of what made the old palette feel muted rather than sharp. The personal-notebook feeling now comes from tone of voice and layout (see §4), not from a warm page tint.

### The coral rule (the one that makes it "calm but sharp")

**Coral is scarce.** It appears only at the moment of decision:

- the compare/duel
- the task currently being slotted
- the single next action

Everywhere else: violet, paper, dusk. Restraint 95% of the time is what gives the accent its edge. If coral shows up on buttons, headers, and badges, the sharpness is gone.

Coral, not amber: still warm and decisive, but with more presence against the cooler violet ground than amber had against warm paper. Confirmed as read as "this is the decision moment," not "warning/error" — if that ever tests otherwise in practice, revisit before it ships more broadly.

`coral wash` is for the resting trace of a decision — the row that just moved — never for a large fill.

### Do not add a red/green semantic pair

Red/green in a comparison implies one task was the *wrong* answer. Your premise is that neither is wrong — one is just later. Use **violet vs coral** for the two sides of a compare, or **coral vs neutral**.

---

## 3. Typography

### Primary direction

A low-contrast humanist sans, wordmark set **lowercase** — `reflow`, never `Reflow`, never all-caps. Lowercase is the cheapest single signal that this is a personal tool rather than a product with a sales team.

| Use | Typeface | Notes |
|---|---|---|
| Wordmark, headings | **Söhne** (paid) or **Switzer** / **General Sans** (Fontshare, free) | Slight warmth, unfussy lowercase, doesn't look like Inter |
| Body, UI | **Inter** or the platform system font | Nothing gained by being clever here |
| Ranks, times, durations | **Geist Mono** or **JetBrains Mono**, tabular figures | Precision only where precision is the point |

The mono is the typographic equivalent of the coral rule: it appears in exactly two or three places, and that's what makes it feel like an instrument.

### The `fl` ligature

Set the wordmark's **`fl` as a true ligature**. Two letters flowing into one form, inside a word that means re-wrapping text. Almost nobody will consciously notice — which is the correct amount of clever.

### Alternate direction

An editorial serif wordmark (**Instrument Serif**, or **Fraunces** dialed to low wonk) with the sans doing all the work elsewhere. Warmer and more distinctive; slightly harder to keep legible in a tight app icon lockup.

---

## 4. Tone of voice

**Governing principle: the app never implies you failed.**

Getting interrupted is the assumed condition. That rules out streaks, "you missed 4 tasks," red overdue counts, and any language of catching up.

- **Calm friend, not coach.** "three left for today," not "crush your remaining tasks."
- **Verbs from the metaphor:** reflow, settle, slot, keep, drop, let go, later.
- **Short lines, contractions, lowercase-friendly.** No exclamation marks.
- **Dry wit only at the compare.** "which first?" — that's the one high-energy moment in the product.
- **Leftovers get neutral framing:** "still open," not "unfinished."

| Say | Not |
|---|---|
| three left for today | you still have 3 incomplete tasks! |
| which first? | choose the higher priority task |
| still open | overdue |
| let it go | delete task |
| settled | done ✅ |

---

## 5. Iconography

Stroke icons, not filled — lighter and more personal.

- 24px grid, **1.75px stroke**, round caps and joins to match the logo geometry.
- **Two atoms, borrowed from the mark:** the rounded horizontal bar is *a task*; the chevron is *the verb*.
- Every icon should be constructible from those two elements plus a circle.

That constraint keeps the set coherent for free, and makes the app icon feel like the source of the system rather than a decoration on top of it.

---

## 6. Motion

**Slow to settle, fast to decide.** Same tension as the color rule, expressed in time.

| Moment | Feel | Spec |
|---|---|---|
| Resting | Nothing moves unless you move it | No idle animation, no pulsing |
| Reflow | Water finding level | ~380ms, gentle spring, near-zero overshoot, ~25ms stagger |
| The compare | Decisive | 150–200ms, light haptic on commit; coral appears here and nowhere else |
| Dropping a task | Relief, not deletion | Soft fade and collapse. No shake, no destructive red |

The reflow animation matters most: the eye needs to follow where a task went, because understanding the new order is the entire payoff of the mechanic.

---

## Quick reference

**Do**

- Keep coral for decisions only
- Set the wordmark lowercase
- Test every mark at 40px first
- Treat interruption as normal
- Let the list settle slowly and the compare snap fast

**Don't**

- Streaks, guilt copy, or overdue counts
- Red/green for the two sides of a compare
- Gradients, shadows, or glow on the mark
- Warm cream/beige neutrals (superseded — see §2's revision note)
- Coral in a glow/gradient effect, or a multi-hue rainbow gradient, anywhere in the product

**Exception — pointer-reactive edge glow on pre-login surfaces only**

The landing page and sign-in card (`BorderGlow`, `src/components/BorderGlow.tsx`) use a quiet single-hue ink-violet edge light that brightens near the pointer. This is scoped narrowly and should not be treated as license to add glow elsewhere:

- Single hue only — a desaturated violet (`hsl(252deg 38% 55%)`), never the coral accent, never a multi-color mesh.
- Pointer-reactive only, not idle — it stays off at rest and never plays on mount; this keeps it inside the "nothing animates at rest" motion rule (§6).
- Pre-login only (`Landing.tsx`, `Auth.tsx`) — it's a first-impression cue, not a UI pattern. Do not add it to task rows, the compare/duel, modals, or any in-app chrome. Coral stays the only accent inside the product; this glow never appears alongside a decision moment.
- Coral on chrome (buttons, headers, badges)