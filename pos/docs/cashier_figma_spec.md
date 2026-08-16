# CashierScreen — Figma Design Specification

## Canvas Setup
- **Size:** 1440×900px (desktop)
- **Grid:** 8px
- **Guides:** Major sections at 72px + 20px padding

---

## Layout Structure

```
Header (0–56px)
├─ Logo/back btn: 56×56px
├─ Title: Restaurant name (centered)
└─ Right: Cashier + time

Tab Bar (56–112px)
├─ [Блюда 🟠]
├─ [Касса 🔴]  ← default active
├─ [Счета 🟡]
└─ [Настройки 🟡]

Body (112–844px)
└─ Content area (changes per tab)

Bottom Bar (844–900px)
└─ Cashier info + time + date
```

---

## Color Scheme for CashierScreen

### Tab Colors (Top bar)
| Tab | Background | Text | Active indicator |
|-----|------------|------|------------------|
| **Блюда** | `#FFF3EE` | `#FB6633` | `#FB6633` pill |
| **Касса** | `#FFF0F3` | `#EB295B` | `#EB295B` pill |
| **Счета** | `#FFF8E7` | `#F5A524` | `#F5A524` pill |
| **Настройки** | `#FFF8E7` | `#F5A524` | `#F5A524` pill |

Active tab: rounded pill shape, full height, 4–6px padding left/right

---

## Tab 2: Касса (Cash Register) — Default View

**Most important tab. Layout:**

```
┌─ Header ─────────────────────────────────────────┐
│ [← Back]  Restaurant name       Cashier | Time  │
├─ Tab bar ────────────────────────────────────────┤
│ [Блюда]  [Касса ●]  [Счета]  [Настройки]       │
├─────────────────────────────────────────────────┤
│                                                  │
│  LEFT (flex: 3)              RIGHT (flex: 2)    │
│  ┌─────────────────────┐    ┌──────────────┐   │
│  │ Shift Info Card     │    │ Stats Cards  │   │
│  │ 20px padding        │    │              │   │
│  │ border-radius: 16px │    │              │   │
│  │ bg: white           │    │              │   │
│  │ border: 1px #EBEBEB│    │              │  │
│  └─────────────────────┘    └──────────────┘   │
│  16px gap                                      │
│  ┌─────────────────────┐    ┌──────────────┐   │
│  │ Action Buttons      │    │ Payment      │   │
│  │ (4 grid)            │    │ Breakdown    │   │
│  │ Полнота: #00BCD4   │    │              │  │
│  │ Клиенты: #3B82F6   │    │              │  │
│  │ Доставка: #FB6633  │    │              │  │
│  │ Раздача: #13AF1B   │    │              │  │
│  │ Оплата: #FB6633    │    │              │  │
│  └─────────────────────┘    └──────────────┘   │
│  16px gap                                      │
│  ┌──────────────────────────────────────────┐  │
│  │ [Smenani yopish]  — red button #EB295B   ││
│  └──────────────────────────────────────────┘  │
│                                                │
├─ Bottom bar ──────────────────────────────────┤
│ Кассир: Ali    11:02:31    30 Март 2026     │
└──────────────────────────────────────────────┘
```

### Shift Info Card

**Dimensions:**
- Height: 80px
- Padding: 16–24px
- Border-radius: 16px
- Border: 1px solid `#EBEBEB`
- Background: white

**Content (horizontal row with dividers):**
```
[36px]  Kasir      [36px]  Shift open   [36px]  Terminal   [flex]  Duration
        Ali                09:00               🟢 Online          02:15
        (14px 700)         (14px 700)                          (20px 700 #FB6633)
```

Dividers: 1px vertical line `#EBEBEB`, height 36px

### Action Buttons (2×2 grid)

Each button:
- **Size:** (flex 1) × 80px
- **Border-radius:** 12px
- **Border:** 1px solid (color)
- **Background:** (color) with 10% opacity
- **Gap:** 12px between items
- **Font:** 13px 600, centered

Colors:
```
Полнота:  bg #00BCD4, border #00BCD4
Клиенты: bg #3B82F6, border #3B82F6
Доставка: bg #FB6633, border #FB6633
Раздача:  bg #13AF1B, border #13AF1B
Оплата:   bg #FB6633, border #FB6633
```

### Stats Cards (Right side)

**3 cards stacked, each:**
- Height: 60px
- Padding: 12px 16px
- Border-radius: 16px
- Border: 1px solid `#EBEBEB`
- Background: white

**Content:**
```
Label (12px 500 #888888)
Value (22px 700 [color])
```

Colors for values:
- Cash: `#13AF1B` (green)
- Card: `#3B82F6` (blue)
- Total: `#FB6633` (orange)

### Payment Breakdown

**Card:**
- Height: 180px (flex, min 3 items)
- Same styling as stats cards
- Title: "To'lov usullari" (14px 700)
- Gap: 16px between items

**Each payment type row:**
```
[10px circle] Naqd              73%  450,000 so'm
             ████████ progress bar

[10px circle] Karta            27%  175,000 so'm
             ████ progress bar
```

---

## Tab 1: Блюда (Dishes)

**Layout:** Left sidebar (200px) + Content

### Left Sidebar Menu

Width: 200px
Border-right: 1px solid `#EBEBEB`
Padding: 12px 8px
Gap: 4px

**Menu items (6 total):**
```
┌─ Отдел ──────────────────┐
├─ Категория ──────────────┤
├─ Блюда ──────────────────┤
├─ Модификаторы ───────────┤
├─ Позиции блюд ───────────┤
└─ Стол-lust ──────────────┘
```

Each item:
- Height: 40px
- Padding: 8px 12px
- Border-radius: 10px
- Font: 13px 500
- **Inactive:** text `#888888`
- **Active:** bg `#FFF3EE`, text `#FB6633`, 2px left border `#FB6633`

### Content Area (right of sidebar)

**Kategor selected (category grid):**
```
┌─ Category card ─┐  ┌─ Category card ─┐  ┌─ Category card ─┐
│ Image (100px)   │  │ Image (100px)   │  │ Image (100px)   │
│ Plov            │  │ Manti           │  │ Qozon            │
│ 5 items         │  │ 3 items         │  │ 7 items         │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

Card:
- Width: 120px
- Height: 140px
- Border-radius: 12px
- Border: 1px `#EBEBEB`
- Padding: 8px
- Gap: 4px
- Image: 100px square, border-radius: 8px
- Text: 12px 600 centered

---

## Tab 3: Счета (Bills)

**Layout:** Full width

### Sub-filter tabs (at top)
```
[Барча счета]  [Счет]  [Доставка]  [Раздача]
```

Container: bg `#F5F4F2`, border-radius 10px, padding 4px, gap 4px

**Tab styling:**
- **Active:** bg white, border 1px `#EBEBEB`, border-radius 8px, text `#19160B` 600
- **Inactive:** text `#888888`, no background

### Bills List

Each bill row (table style):
```
┌────────────────────────────────────────────────────────────────┐
│ #001234 | Стол-5  | Naqd | 450,000 so'm | ✓ | 11:30 | 2 kishi │
└────────────────────────────────────────────────────────────────┘
```

**Row specs:**
- Height: 50px
- Border-bottom: 1px `#F5F4F2`
- Padding: 12px 16px
- Hover: bg `#FAFAFA`
- Font: 13px 400

**Status badge (in row):**
- To'langan: bg `#E8F9E9`, text `#13AF1B`, ✓ icon
- Kutilmoqda: bg `#FFF8E7`, text `#F5A524`, ⏳ icon
- Qisman: bg `#EEF2FF`, text `#3B82F6`, ◐ icon

**Columns:**
```
Bill # (12px) | Table/Type (13px) | Payment (11px caption) | Amount (13px 700) | Status | Time (11px) | Guests (11px)
```

---

## Tab 4: Настройки (Settings)

**Layout:** Full width, list

```
┌─ Персонал ресторана ────────────────────────────────────────┐
│ Icons.people  +  Description: "Staff list"     → icon      │
├─────────────────────────────────────────────────────────────┤
├─ Залы ──────────────────────────────────────────────────────┤
│ Icons.store  +  Description: "Hall management"   → icon    │
├─────────────────────────────────────────────────────────────┤
├─ Настройки принтеров ──────────────────────────────────────┤
│ Icons.print  +  Description: "Printer settings"   → icon   │
└─────────────────────────────────────────────────────────────┘
```

Each item:
- Height: 60px
- Padding: 16px 20px
- Border-bottom: 1px `#EBEBEB`
- Hover: bg `#FAFAFA`

**Icon:** 22×22px, color `#888888`
**Title:** 14px 600, color `#19160B`
**Description:** 12px 400, color `#888888`
**Chevron:** 18×18px, color `#EBEBEB`

---

## Header (Fixed top)

**Height:** 56px
**Padding:** 0 24px
**Border-bottom:** 1px solid `#EBEBEB`
**Background:** white

### Layout
```
[← Back]   [Restaurant logo]  Restaurant name       Cashier: Ali  11:02  [Bell icon]
56×56px    (logo/text)         (centered)            (right aligned)
```

**Back button:**
- 56×56px, rounded
- Hover: bg `#F5F4F2`
- Icon: `Icons.arrow_back`, 22×22px

**Cashier info (right):**
- Text: "Cashier: Ali" (12px 500)
- Time: "11:02" (12px 600)
- Notification bell: 22×22px, color `#FB6633`

---

## Bottom Info Bar (Fixed)

**Height:** 56px
**Padding:** 0 24px
**Background:** white
**Border-top:** 1px solid `#EBEBEB`

**Layout:**
```
Кассир: Ali        11:02:31        30 Март 2026, Понедельник
(12px 500)         (14px 600)      (12px 400)
```

**Clock updates every second** via `Timer.periodic(Duration(seconds: 1))`

---

## Open Shift Dialog

**When:** No active shift on app start
**Modal:** 320×380px, border-radius 16px, centered

```
┌─ Title ──────────────────────────────────────────┐
│ Smenani ochish                                   │
├──────────────────────────────────────────────────┤
│ Naqd summani kiriting                            │
│ ┌────────────────────────────────────────────┐   │
│ │ 0  [input field, right-aligned]            │   │
│ └────────────────────────────────────────────┘   │
│                                                   │
│ Terminal summani kiriting                        │
│ ┌────────────────────────────────────────────┐   │
│ │ 0  [input field, right-aligned]            │   │
│ └────────────────────────────────────────────┘   │
│                                                   │
│ ┌────┐ ┌────┐ ┌────┐                            │
│ │ 1  │ │ 2  │ │ 3  │  ...                       │
│ └────┘ └────┘ └────┘                            │
│ [numpad 3×4]                                     │
│                                                   │
│ ┌──────────────────────────────────────────────┐ │
│ │  Ochish  [primary button]                    │ │
│ └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

**Input field styling:**
- Height: 44px
- Padding: 8px 12px
- Border-radius: 10px
- Border: 1px `#EBEBEB`
- Font: 18px 600 (right-aligned)
- Placeholder: `#AAAAAA`

**Numpad buttons:**
- Grid: 3 columns, 4 rows
- Gap: 8px
- Size: (flex) × 44px
- Border-radius: 10px
- Border: 1px `#EBEBEB`
- Background: `#F5F4F2` (number keys) / `#FFF0F3` (delete)
- Font: 16px 600
- Hover: bg `#EBEBEB`

Delete button (last row, middle):
- Icon: backspace, color `#EB295B`
- Background: `#FFF0F3`

---

## Component Reuse Checklist

- ✅ Primary Button (orange, 10px radius, 13px 600)
- ✅ Secondary Button (gray bg, border 1px)
- ✅ Danger Button (red text/border, white bg)
- ✅ Status Badge (color-coded bg + text)
- ✅ Stat Card (white bg, border, 16px radius)
- ✅ Filter Tab (active pill style)

All should match the existing design_system.md colors.

---

## Notes for Figma Design

1. **Responsive grid:** 8px baseline for all measurements
2. **Shadows:** Use card shadow `0 1px 4px rgba(0,0,0,0.06)` for all cards
3. **Hover states:** +5% darker background or +10% opacity overlay
4. **Font:** Inter family, all weights available (400, 500, 600, 700)
5. **Icons:** 22×22px for large, 18×18px for medium, 14×14px for small
6. **Kerning:** Default (0) for all text
7. **Line-height:** 1.4 for body text, 1.2 for headers
8. **Tab active indicator:** Pill-shaped rounded container, not underline
