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

Two chevrons (`>` and `<`) facing each other, with a thin amber sliver in the gap between them — the task that just landed in its slot.

- **Strength:** most direct nod to the swipe-to-compare mechanic; best silhouette at 40px.
- **Risk:** chevrons are common in tech logos. Make the gap wider than feels comfortable — that's what makes it read as *a space being made* rather than *fast-forward*.

### Concept B — The reflow (recommended)

A stack of rounded bars that shortens around a solid amber circle. Reads simultaneously as a ranked task list and as a paragraph wrapping around an object.

- **Strength:** the product thesis in one shape. The interruption isn't drawn as a problem — the lines simply accommodate it. Most ownable of the set; nothing in the category looks like this.
- **Risk:** needs generous spacing between bars or it turns into a hamburger menu at small sizes.

### Concept C — The confluence

Two curves entering from the left — the plan (paper) and the unplanned thing (amber) — merging into a single ordered line exiting right.

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

- Background: `petrol ink #0F2E2F`, full-bleed, system corner radius.
- Mark: `paper #FAF8F4`, with exactly one amber element.
- No wordmark, no gradient, no shadow, no inner border.
- Test at 40px before anything else. If the silhouette doesn't survive, the mark is wrong.

### SVG source

Each is a 118×118 app-icon tile. For a light-background version, delete the first `<rect>` and change `#FAF8F4` to `#0F2E2F`.

**A — The comparator**

```svg
<svg viewBox="0 0 118 118" xmlns="http://www.w3.org/2000/svg">
  <rect width="118" height="118" rx="26" fill="#0F2E2F"/>
  <path d="M 30,38 L 52,59 L 30,80" fill="none" stroke="#FAF8F4" stroke-width="9"
        stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M 88,38 L 66,59 L 88,80" fill="none" stroke="#FAF8F4" stroke-width="9"
        stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="56" y="47" width="6" height="24" rx="3" fill="#F2A63B"/>
</svg>
```

**B — The reflow**

```svg
<svg viewBox="0 0 118 118" xmlns="http://www.w3.org/2000/svg">
  <rect width="118" height="118" rx="26" fill="#0F2E2F"/>
  <circle cx="80" cy="61" r="14" fill="#F2A63B"/>
  <rect x="24" y="23" width="70" height="6" rx="3" fill="#FAF8F4"/>
  <rect x="24" y="37" width="70" height="6" rx="3" fill="#FAF8F4"/>
  <rect x="24" y="51" width="36" height="6" rx="3" fill="#FAF8F4"/>
  <rect x="24" y="65" width="36" height="6" rx="3" fill="#FAF8F4"/>
  <rect x="24" y="79" width="70" height="6" rx="3" fill="#FAF8F4"/>
</svg>
```

**C — The confluence**

```svg
<svg viewBox="0 0 118 118" xmlns="http://www.w3.org/2000/svg">
  <rect width="118" height="118" rx="26" fill="#0F2E2F"/>
  <path d="M 28,40 C 48,40 50,59 68,59" fill="none" stroke="#FAF8F4"
        stroke-width="9" stroke-linecap="round"/>
  <path d="M 28,78 C 48,78 50,59 68,59" fill="none" stroke="#F2A63B"
        stroke-width="9" stroke-linecap="round"/>
  <path d="M 64,59 L 92,59" fill="none" stroke="#FAF8F4"
        stroke-width="9" stroke-linecap="round"/>
</svg>
```

---

## 2. Color

### Brand

| Token | Name | Hex | Role |
|---|---|---|---|
| `--petrol-ink` | petrol ink | `#0F2E2F` | App icon background, brand black, dark surfaces |
| `--petrol` | petrol | `#1A4D4A` | Primary brand color, mark on light backgrounds |
| `--shallow` | shallow | `#3E7A73` | Secondary/supporting, one side of a comparison |
| `--signal-amber` | signal amber | `#F2A63B` | Accent — decisions only |
| `--amber-wash` | amber wash | `#FBE6C2` | Resting trace of a recent decision |

### Neutrals

| Token | Name | Hex | Role |
|---|---|---|---|
| `--paper` | paper | `#FAF8F4` | Page background, mark on dark |
| `--sand` | sand | `#EDE9E1` | Raised surfaces, dividers |
| `--silt` | silt | `#C9C3B8` | Hairlines, disabled |
| `--stone` | stone | `#7A756C` | Secondary text |
| `--graphite` | graphite | `#2A2825` | Body text |

### Why this palette

**Petrol, not blue.** Deep teal-petrol is water-adjacent enough to carry "flow," but desaturated and dark enough to read as considered rather than spa-like. It also sidesteps the entire category — Todoist is red, Things and most calendars are blue, Linear and Notion are purple/greyscale. Instantly distinguishable on a home screen.

**Warm neutrals, not cool grey.** Paper and sand are off-white with a warm cast. Warmth is what makes it feel like a personal notebook instead of enterprise software, and warm neutrals against cool petrol is a naturally restful pairing.

### The amber rule (the one that makes it "calm but sharp")

**Amber is scarce.** It appears only at the moment of decision:

- the compare/duel
- the task currently being slotted
- the single next action

Everywhere else: petrol, paper, stone. Restraint 95% of the time is what gives the accent its edge. If amber shows up on buttons, headers, and badges, the sharpness is gone and you're left with a warm-toned to-do app.

`amber wash` is for the resting trace of a decision — the row that just moved — never for a large fill.

### Do not add a red/green semantic pair

Red/green in a comparison implies one task was the *wrong* answer. Your premise is that neither is wrong — one is just later. Use **petrol vs amber** for the two sides of a compare, or **amber vs neutral**.

---

## 3. Typography

### Primary direction

A low-contrast humanist sans, wordmark set **lowercase** — `reflow`, never `Reflow`, never all-caps. Lowercase is the cheapest single signal that this is a personal tool rather than a product with a sales team.

| Use | Typeface | Notes |
|---|---|---|
| Wordmark, headings | **Söhne** (paid) or **Switzer** / **General Sans** (Fontshare, free) | Slight warmth, unfussy lowercase, doesn't look like Inter |
| Body, UI | **Inter** or the platform system font | Nothing gained by being clever here |
| Ranks, times, durations | **Geist Mono** or **JetBrains Mono**, tabular figures | Precision only where precision is the point |

The mono is the typographic equivalent of the amber rule: it appears in exactly two or three places, and that's what makes it feel like an instrument.

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
| The compare | Decisive | 150–200ms, light haptic on commit; amber appears here and nowhere else |
| Dropping a task | Relief, not deletion | Soft fade and collapse. No shake, no destructive red |

The reflow animation matters most: the eye needs to follow where a task went, because understanding the new order is the entire payoff of the mechanic.

---

## Quick reference

**Do**

- Keep amber for decisions only
- Set the wordmark lowercase
- Test every mark at 40px first
- Treat interruption as normal
- Let the list settle slowly and the compare snap fast

**Don't**

- Streaks, guilt copy, or overdue counts
- Red/green for the two sides of a compare
- Gradients, shadows, or glow on the mark
- Cool grey neutrals
- Amber on chrome (buttons, headers, badges)