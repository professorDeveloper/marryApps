# Slate Dawn — Mary Ai admin design system

> The palette and structural rules for the Mary Ai admin panel. Warm slate
> for dark mode, paper cream for light. Built around a strict depth ladder
> so the eye always knows where it is.

- **Version:** 1.0
- **Last updated:** 22 May 2026
- **Fonts:** [Manrope](https://fonts.google.com/specimen/Manrope) (UI/display) · [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) (data, labels, numbers)
- **No italics.** No serif display faces. One sans for everything.

---

## Table of contents

1. [Foundations](#1-foundations)
2. [The depth ladder](#2-the-depth-ladder)
3. [Surface tokens](#3-surface-tokens) — dark + light
4. [Text colors](#4-text-colors)
5. [Borders](#5-borders)
6. [Accent](#6-accent)
7. [Status colors](#7-status-colors)
8. [Spacing scale](#8-spacing-scale)
9. [Radius scale](#9-radius-scale)
10. [Type ladder](#10-type-ladder)
11. [Component anatomy](#11-component-anatomy)
12. [Do / Don't rules](#12-do--dont-rules)
13. [Drop-in CSS](#13-drop-in-css)

---

## 1. Foundations

### Type stack

| Role | Family | Weights used |
|---|---|---|
| UI / display | **Manrope** | 400, 500, 600, 700, 800 |
| Numbers, labels, code | **JetBrains Mono** | 400, 500 |

```css
font-family: "Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
```

### Global rules

- Default body weight is **500** (not 400) — Manrope at 400 looks faint on dark surfaces.
- Default tracking: `letter-spacing: -0.005em`.
- Numbers always use **JetBrains Mono** with `font-feature-settings: "tnum"` so columns align.
- **Never italicize.** Use weight to emphasize, not slant.

---

## 2. The depth ladder

The admin uses **five surface levels**. Recede things you've already looked at;
raise things you want the eye to find.

> **Rule:** A surface can sit on the one immediately below it. Floating things
> (popovers, modals) may skip one level. **Never jump from Z −1 to Z 3.**

| Z | Role | Token | Hex (dark) | Hex (light) | Used for |
|:-:|---|---|---|---|---|
| **−1** | recessed | `--sidebar-bg` | `#15181F` | `#EDE9DF` | Sidebar, totals strip, footer rails |
| **0** | page | `--bg` | `#1A1D24` | `#F6F4EE` | Body, topbar, table area — ~95% of pixels |
| **1** | raised | `--surface` | `#1F222B` | `#FBFAF6` | Cards, inputs, selects, table headers, panels |
| **2** | elevated | `--surface-2` | `#262A33` | `#EDE9DF` | Chips, segmented controls, hover row, secondary buttons |
| **3** | signal | `--accent` | `#FF8956` | `#C9521B` | The **one** bright thing per region — CTAs, active nav, active tab, focus |

### How to read the ladder

```
┌─────────────────────────────────────────────────────┐
│ TOPBAR · Z 0 (page bg)                              │
├──────────┬──────────────────────────────────────────┤
│ Z −1     │ Z 0  page canvas                         │
│ sidebar  │  ┌──────────────────────────────┐        │
│ recedes  │  │ Z 1  surface — card / panel  │        │
│          │  │   ┌────────┐  ┌───────────┐  │        │
│          │  │   │ Z 2    │  │ Z 3 accent│  │        │
│          │  │   │ chip   │  │ button    │  │        │
│          │  │   └────────┘  └───────────┘  │        │
│          │  └──────────────────────────────┘        │
└──────────┴──────────────────────────────────────────┘
```

---

## 3. Surface tokens

### Dark mode

| Token | Hex | Role |
|---|---|---|
| `--bg` | `#1A1D24` | Page canvas — the default background |
| `--sidebar-bg` | `#15181F` | Sidebar, action-bar footer (recedes) |
| `--surface` | `#1F222B` | Cards, inputs, selects, table headers |
| `--surface-2` | `#262A33` | Chips, segmented controls, hover backgrounds, secondary buttons |
| `--hover` | `#232631` | Table row hover, ghost-button hover (≈ surface-2) |
| `--border` | `#262A33` | All 1px dividers and input borders |
| `--border-strong` | `#323540` | Hovered inputs, focused outlines |

### Light mode

| Token | Hex | Role |
|---|---|---|
| `--bg` | `#F6F4EE` | Page canvas — paper cream |
| `--sidebar-bg` | `#EDE9DF` | Sidebar, footer strip |
| `--surface` | `#FBFAF6` | Cards, inputs, table headers (almost white) |
| `--surface-2` | `#EDE9DF` | Chips, hovers, secondary buttons |
| `--hover` | `#EFECE4` | Row hovers |
| `--border` | `#E4E0D4` | All dividers |
| `--border-strong` | `#D2CDB9` | Hovered inputs, focused outlines |

### Notes on the surfaces

- **Dark mode is never pure black.** `#1A1D24` has a slight cool-warm balance — the cool blue undertone gives a "screen at night" feel without the punch of `#000`.
- **Light mode is never pure white.** `#F6F4EE` is paper, not card stock. Long sessions stop feeling like staring at a flashlight.
- The **light sidebar is darker than its page** — same logic as dark mode, just inverted. Sidebar always recedes.
- **Don't tint sections** with custom backgrounds. Use spacing + 1px borders to separate, not color.

---

## 4. Text colors

Four text levels. Never go below `--text-3` for anything a user has to read —
it's the floor.

### Dark mode

| Token | Hex | Use for |
|---|---|---|
| `--text` | `#ECE9E2` | Headings, table values, input text. The default. **88% contrast** — present, never glaring white. |
| `--text-2` | `#A6A399` | Body copy, labels, descriptions. Most paragraph text. |
| `--text-3` | `#6E6B62` | Placeholders, captions, column headers, sidebar labels. |
| `--text-4` | `#45433C` | Disabled controls, row numbers (`#1`, `#2`...), dividing text. Decorative only. |

### Light mode

| Token | Hex | Use for |
|---|---|---|
| `--text` | `#20232B` | Headings, table values, input text. |
| `--text-2` | `#5E5F68` | Body copy, labels, descriptions. |
| `--text-3` | `#8A8A93` | Placeholders, captions, column headers. |
| `--text-4` | `#BCBCC3` | Disabled, row numbers, dividers. |

### Worked example

```html
<h1 style="color: var(--text)">Meals</h1>                    <!-- text -->
<p  style="color: var(--text-2)">Manage your active menu.</p><!-- text-2 -->
<th style="color: var(--text-3)">CATEGORY</th>               <!-- text-3 -->
<td class="num" style="color: var(--text-4)">01</td>         <!-- text-4 -->
```

---

## 5. Borders

| Token | Hex (dark) | Hex (light) | Use |
|---|---|---|---|
| `--border` | `#262A33` | `#E4E0D4` | All 1px dividers, default input border, table row lines |
| `--border-strong` | `#323540` | `#D2CDB9` | Hover state on inputs/selects, dropdown outlines |

**Border rules**

- Always **1px**. Never 2px.
- A focused input uses `--accent` for the border + a 3px `--accent-soft` ring.
- On dark, borders are darker than the surface (`#262A33` on `#1F222B`).
  On light, borders are darker than the surface (`#E4E0D4` on `#FBFAF6`).
  Same rule, opposite direction.

---

## 6. Accent

The single bright thing on the page. Earn it.

| Token | Hex (dark) | Hex (light) | Role |
|---|---|---|---|
| `--accent` | `#FF8956` | `#C9521B` | Fill for primary CTAs, color of active nav text, active-tab underline, focus rings |
| `--accent-fg` | `#1A1D24` | `#FBFAF6` | Text/icon color *on top of* the accent fill |
| `--accent-soft` | `rgba(255,137,86,0.13)` | `rgba(201,82,27,0.10)` | Backgrounds for the active nav item, focus rings, soft callouts |

### Where to use it

- ✅ Primary CTA fill — `+ Add meal`
- ✅ The **one** active sidebar item per screen
- ✅ The **one** active tab underline
- ✅ Focus ring on inputs (`box-shadow: 0 0 0 3px var(--accent-soft)`)
- ✅ Required-field asterisks

### Where NOT to use it

- ❌ Status badges → use `--success / --warning / --danger`
- ❌ Section headings — keep them in `--text`
- ❌ Borders on idle elements
- ❌ Multiple buttons in the same toolbar (only the primary action is accent)

---

## 7. Status colors

Three statuses. Always rendered as a **soft chip** (semi-transparent background +
matching foreground), **never as a solid fill**.

| Token | Hex (dark) | Hex (light) | Means |
|---|---|---|---|
| `--success` | `#4ADE80` | `#2F9E44` | "Paid", "Live", "Active", positive delta |
| `--warning` | `#FBBF24` | `#B6781B` | "Pending", "Low stock", caution |
| `--danger` | `#F87171` | `#C83333` | "Cancelled", destructive action, error |

### Chip recipe

```css
.chip.status-ok {
  color: var(--success);
  background: color-mix(in oklch, var(--success) 12%, transparent);
  border: 1px solid color-mix(in oklch, var(--success) 25%, transparent);
}
```

---

## 8. Spacing scale

Everything is a multiple of **4**.

| Token | Px | Common use |
|---|---|---|
| `xs` | **4 px** | Icon-to-label gap, chip vertical padding |
| `sm` | **8 px** | Field-to-button gap, toolbar item spacing |
| `md` | **16 px** | Card/input internal padding, paragraph margin |
| `lg` | **28 px** | Section to section vertical rhythm |
| `xl` | **40 px** | Major section breaks |
| `2xl` | **64 px** | Page-level padding |

### Standard heights

| Element | Height |
|---|---|
| Buttons (primary, secondary) | **36 px** |
| Inputs, selects | **36 px** |
| Small buttons (table actions) | **28 px** |
| Table rows (comfortable) | **52 px** |
| Table rows (compact) | **42 px** |
| Topbar | **64 px** (18px top/bottom padding around content) |

---

## 9. Radius scale

Three radii. **Never** invent a fourth.

| Token | Px | Use for |
|---|---|---|
| `--radius-sm` | **4 px** | Chips, dots, status indicators |
| `--radius` | **6 px** | Buttons, inputs, selects, row chips |
| `--radius-lg` | **8 px** | Cards, modals, image upload zones |

**Pills** (status chips with `border-radius: 999px`) are the exception — they're round by definition, not part of the scale.

---

## 10. Type ladder

| Role | Size | Weight | Tracking | Color | Notes |
|---|---|---|---|---|---|
| H1 (page title) | 20 px | 700 | -0.025em | `--text` | One per page |
| H2 (section) | 16 px | 700 | -0.02em | `--text` | |
| Body | 14 px | 500 | -0.005em | `--text` | Default |
| Small | 12.5 px | 500 | 0 | `--text-2` | Helper text, descriptions |
| Label | 11 px | 600 | **+0.08em** | `--text-3` | UPPERCASE, section eyebrows |
| Mono | 14 px | 500 | -0.01em | `--text` | Numbers, IDs, codes (JetBrains Mono) |
| Mono-label | 10–11 px | 500 | +0.14em | `--text-3` | Eyebrows in JetBrains Mono, UPPERCASE |

**Login & marketing only** — large displays can scale to 34/44/52 px at weight 700/800.
Admin pages stay calm; nothing above 20 px in normal app use.

---

## 11. Component anatomy

### 11.1 Primary button

```
┌───────────────────────────┐
│  + Add meal               │  ← 36 px tall
└───────────────────────────┘
   accent fill              0–14 px H padding
   accent-fg text · 600/13
   border-radius: 6
   hover: filter brightness(1.08)
   active: translateY(0.5px)
```

```css
.btn-primary {
  height: 36px;
  padding: 0 14px;
  background: var(--accent);
  color: var(--accent-fg);
  border-radius: 6px;
  font: 600 13px "Manrope", sans-serif;
}
.btn-primary:hover  { filter: brightness(1.08); }
.btn-primary:active { transform: translateY(0.5px); }
```

### 11.2 Secondary button

```css
.btn-secondary {
  height: 36px;
  padding: 0 14px;
  background: var(--surface-2);   /* Z 2 */
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 6px;
  font: 500 13px "Manrope", sans-serif;
}
.btn-secondary:hover { border-color: var(--border-strong); }
```

### 11.3 Ghost button (cancel, reset)

```css
.btn-ghost {
  height: 36px;
  padding: 0 12px;
  background: transparent;
  color: var(--text-2);
  border: 0;
  border-radius: 6px;
  font: 500 13px "Manrope", sans-serif;
}
.btn-ghost:hover { background: var(--hover); color: var(--text); }
```

### 11.4 Input

```
┌───────────────────────────┐
│  Search cases…            │  ← 36 px
└───────────────────────────┘
   surface fill (Z 1)
   border 1px
   placeholder · text-3 / weight 400
   typed     · text / weight 500

   focus →
   ┌───────────────────────────┐
   │  Том ям                   │
   └───────────────────────────┘  border: accent
                                  box-shadow: 0 0 0 3px accent-soft
```

```css
.input {
  height: 36px;
  padding: 0 12px;
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 6px;
  font: 500 13px "Manrope", sans-serif;
  outline: none;
}
.input::placeholder { color: var(--text-3); font-weight: 400; }
.input:hover { border-color: var(--border-strong); }
.input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
```

### 11.5 Chip / tag

```
┌─────────────┐
│ ● Свежие    │  20 px tall · pill (999px radius)
└─────────────┘
   surface-2 background (Z 2)
   border 1px
   text-2 color · 500/12
```

```css
.chip {
  display: inline-flex;
  padding: 3px 9px;
  background: var(--surface-2);
  color: var(--text-2);
  border: 1px solid var(--border);
  border-radius: 999px;
  font: 500 12px "Manrope", sans-serif;
}
```

### 11.6 Sidebar nav row

```
   idle  ────────────────────
   ┌────────────────────────┐
   │ ▦  Menu Setup          │  ← text-2 color · 500/13
   └────────────────────────┘

   active ───────────────────
   ┌────────────────────────┐
   │ ▦  Menu Setup        ● │  ← accent color · 600/13
   └────────────────────────┘     accent-soft background
                                  small accent dot on the right
```

```css
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 10px;
  border-radius: 6px;
  color: var(--text-2);
  font: 500 13px "Manrope", sans-serif;
}
.nav-item:hover { background: var(--hover); color: var(--text); }
.nav-item.active {
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 600;
}
```

### 11.7 Table row

| Spec | Value |
|---|---|
| Row height | 52 px (comfortable) · 42 px (compact) |
| Cell horizontal padding | 16 px |
| Header text | 11 px · weight 600 · `--text-3` · `letter-spacing: 0.08em` · UPPERCASE |
| Body text | 13.5 px · weight 500 · `--text` |
| Row number | JetBrains Mono · 12 px · `--text-4` |
| Numeric cells | JetBrains Mono · 13.5 px · right-aligned · `font-feature-settings: "tnum"` |
| Row hover | `background: var(--hover)` |
| Row separator | 1px `--border` |

---

## 12. Do / Don't rules

### ✅ Do

1. **Skip levels only one at a time.** Cards on the page is fine. Popovers may jump from Z 0 to Z 2. Never from Z −1 to Z 3.
2. **One accent per region.** Only one active nav row, one active tab, one primary button per view.
3. **Hover lifts by one step.** A row at Z 0 hovers to `--hover` (≈ Z 1). A button at Z 1 hovers via `filter: brightness(1.08)`, never a new color.
4. **Use weight, not color, to emphasize.** Bold a value before you tint it.
5. **Numbers always mono.** Even in body copy — `28.4%` reads better in JetBrains Mono than Manrope.
6. **Borders are always 1px.** Anywhere you'd want 2px, you actually want spacing.

### ❌ Don't

1. **Don't recolor the page.** `--bg` is locked. Never set a "section background" — use spacing and 1px borders to separate.
2. **Don't use the accent for state.** Status is success / warning / danger. The accent is for *action*. "Paid" is green, not orange.
3. **Don't add shadows on dark mode.** We're not faking depth with light — we're stacking surfaces. A subtle inset hairline is fine; a drop shadow on a card is not.
4. **Don't italicize.** No `font-style: italic` anywhere. Use weight to emphasize.
5. **Don't introduce new colors.** Even for charts — fade `--accent` into 5 opacity steps and use `--text-3` / `--text-4` for the axis.
6. **Don't write microcopy below `--text-3`.** `--text-4` is *decorative* — row numbers, separators, never readable copy.

---

## 13. Drop-in CSS

Paste at the root of your stylesheet. Your existing token names should already
match these.

```css
/* ============================================================
   Slate Dawn — DARK (default)
   ============================================================ */
:root[data-theme="dark"] {
  /* Surfaces — depth ladder */
  --bg:           #1A1D24;  /* Z 0  page */
  --sidebar-bg:   #15181F;  /* Z-1  recessed */
  --surface:      #1F222B;  /* Z 1  cards, inputs */
  --surface-2:    #262A33;  /* Z 2  chips, hovers */
  --hover:        #232631;  /* row hover */

  /* Text */
  --text:         #ECE9E2;
  --text-2:       #A6A399;
  --text-3:       #6E6B62;
  --text-4:       #45433C;

  /* Borders */
  --border:       #262A33;
  --border-strong:#323540;

  /* Accent — the one bright thing */
  --accent:       #FF8956;
  --accent-fg:    #1A1D24;
  --accent-soft:  rgba(255,137,86,0.13);

  /* Status — semantic only */
  --success:      #4ADE80;
  --warning:      #FBBF24;
  --danger:       #F87171;
}

/* ============================================================
   Slate Dawn — LIGHT
   ============================================================ */
:root[data-theme="light"] {
  --bg:           #F6F4EE;
  --sidebar-bg:   #EDE9DF;
  --surface:      #FBFAF6;
  --surface-2:    #EDE9DF;
  --hover:        #EFECE4;

  --text:         #20232B;
  --text-2:       #5E5F68;
  --text-3:       #8A8A93;
  --text-4:       #BCBCC3;

  --border:       #E4E0D4;
  --border-strong:#D2CDB9;

  --accent:       #C9521B;
  --accent-fg:    #FBFAF6;
  --accent-soft:  rgba(201,82,27,0.10);

  --success:      #2F9E44;
  --warning:      #B6781B;
  --danger:       #C83333;
}

/* ============================================================
   Geometry — radius + base typography
   ============================================================ */
:root {
  --radius-sm: 4px;
  --radius:    6px;
  --radius-lg: 8px;
  --font:      "Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --mono:      "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font);
  font-weight: 500;
  letter-spacing: -0.005em;
  -webkit-font-smoothing: antialiased;
}
```

---

## Appendix · quick reference card

```
DARK                              LIGHT
─────────────────────────         ─────────────────────────
sidebar  #15181F  (Z−1)           sidebar  #EDE9DF
bg       #1A1D24  (Z 0)           bg       #F6F4EE
surface  #1F222B  (Z 1)           surface  #FBFAF6
surface2 #262A33  (Z 2)           surface2 #EDE9DF
border   #262A33                  border   #E4E0D4
text     #ECE9E2                  text     #20232B
text-2   #A6A399                  text-2   #5E5F68
text-3   #6E6B62                  text-3   #8A8A93
text-4   #45433C                  text-4   #BCBCC3
accent   #FF8956                  accent   #C9521B
```

— *End of doc · Mary Ai · Slate Dawn v 1.0*