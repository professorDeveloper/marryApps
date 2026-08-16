# Mary AI POS — Technical Specification (TZ)

**Version:** 1.0
**Date:** March 30, 2026
**Platform:** Flutter (Desktop/Tablet: 1440×900px)
**Target Audience:** UI/UX Designers (Figma implementation)

---

## Table of Contents

1. [Brand Identity & Design System](#brand-identity--design-system)
2. [Typography & Spacing](#typography--spacing)
3. [Auth Flow](#auth-flow)
4. [CashierScreen (Kassir)](#cashierscreen-kassir)
5. [WaiterScreen (Ofitsant)](#waiterscreen-ofitsant)
6. [PaymentScreen (To'lov)](#paymentscreen-tolov)
7. [ArchiveScreen (Arxiv)](#archivescreen-arxiv)
8. [CloseShiftScreen (Smena Yopish)](#closeshiftscreen-smena-yopish)
9. [NotificationScreen (Bildirishnomalar)](#notificationscreen-bildirishnomalar)
10. [AdminScreen](#adminscreen)
11. [Components Library](#components-library)

---

# Brand Identity & Design System

## Project Overview

**Mary AI POS** is a restaurant point-of-sale system for managing orders, payments, and shifts. The app serves three main roles:
- **Ofitsant (Waiter)**: Table management, order entry
- **Kassir (Cashier)**: Payment processing, shift management
- **Admin/Manager**: Full system access

**Canvas:** 1440×900px (desktop/tablet)
**Font Family:** Inter (all weights: 400, 500, 600, 700)
**Grid:** 8px baseline

---

## Color Tokens

### Brand Colors
| Token | Hex | RGB | Usage |
|---|---|---|---|
| `brand` | `#FB6633` | 251, 102, 51 | Primary actions, active states |
| `brand-light` | `#FF8C5A` | 255, 140, 90 | Gradients, hover states |
| `brand-bg` | `#FFF3EE` | 255, 243, 238 | Orange tinted backgrounds |

**Logo Gradient:** Linear 135deg from `#FB6633` → `#FF8C5A`

### Semantic Colors
| Token | Hex | Usage |
|---|---|---|
| `success` | `#13AF1B` | Confirmed, online, closed |
| `error` | `#EB295B` | Delete, cancelled, urgent |
| `warning` | `#F5A524` | Warnings, gold loyalty |
| `info` | `#3B82F6` | Card payment, reserved |
| `cyan` | `#00BCD4` | Completeness indicators |

### Background & Text
| Token | Hex | Usage |
|---|---|---|
| `bg-app` | `#F5F4F2` | App background (warm gray) |
| `bg-card` | `#FFFFFF` | Card/panel backgrounds |
| `text-primary` | `#19160B` | Main text |
| `text-secondary` | `#888888` | Labels, metadata |
| `text-tertiary` | `#AAAAAA` | Placeholders, disabled |
| `border` | `#EBEBEB` | Default borders |

### Sidebar Theme
| Token | Hex | Usage |
|---|---|---|
| `sidebar-bg` | `#18171C` | Sidebar background |
| `sidebar-active` | `#2D2B32` | Active nav item |
| `sidebar-icon` | `#6B6875` | Inactive icons |

---

## Typography Scale

**Font:** Inter

| Style | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| **Title** | 18px | 700 | 1.2 | Page headers |
| **Heading** | 15–16px | 700 | 1.2 | Card titles, section headers |
| **Body** | 13px | 400/500 | 1.4 | Table cells, body text |
| **Caption** | 11–12px | 400/500 | 1.4 | Labels, metadata, badges |
| **Micro** | 9–10px | 500 | 1.2 | Nav labels, small text |

---

## Spacing & Layout Rules

### Sidebar
- **Width:** 72px
- **Nav item:** 56×56px, border-radius 12px
- **Gap between items:** 2px
- **Padding:** 0 8px

### Header
- **Height:** 56px
- **Padding:** 0 24px
- **Border-bottom:** 1px solid `#EBEBEB`

### Content Area
- **Padding:** 20px 24px
- **Gap between sections:** 16px

### Cards
- **Border-radius:** 16px
- **Border:** 1px solid `#EBEBEB`
- **Padding:** 16–20px
- **Shadow:** `0 1px 4px rgba(0,0,0,0.06)` (subtle)
- **Hover shadow:** `0 4px 12px rgba(251,102,51,0.15)`

### Buttons
- **Border-radius:** 10px
- **Padding:** 7px 14–16px
- **Font:** 13px, weight 600
- **Height:** 40px (standard)

---

# Auth Flow

## Screen 1: SplashScreen

Shows app logo with loading animation on startup.

```
┌──────────────────────────────┐
│                              │
│         Mary AI POS          │
│        [spinning logo]       │
│     Loading restaurant...    │
│                              │
└──────────────────────────────┘
```

**Layout:**
- Full screen, centered
- Logo: 120×120px, animated rotation
- Text below: 14px, color `#888888`
- Background: `#F5F4F2`

**Duration:** 2 seconds, then route to LoginScreen or MainScreen (if already logged in)

---

## Screen 2: LoginScreen

User enters Brand ID and password.

```
┌──────────────────────────────┐
│                              │
│      Mary AI POS             │
│      ━━━━━━━━━━━━━━━━━       │
│                              │
│  Brand ID                    │
│  ┌──────────────────────┐    │
│  │ [input field]        │    │
│  └──────────────────────┘    │
│                              │
│  Parol                       │
│  ┌──────────────────────┐    │
│  │ [password field]     │    │
│  └──────────────────────┘    │
│                              │
│  ┌──────────────────────┐    │
│  │  Kirish              │    │
│  └──────────────────────┘    │
│                              │
└──────────────────────────────┘
```

**Layout:**
- Centered card, 320px width
- Logo at top (80×80px)
- Title: "Mary AI POS" (18px, 700)
- Two input fields:
  - Brand ID placeholder: "Brend ID kiriting"
  - Password placeholder: "Parol kiriting"
  - Height: 44px each, border-radius 10px
  - Border: 1px `#EBEBEB`, background `#FFFFFF`
  - Padding: 8px 12px
  - Font: 13px
- Button: Primary style, width 100%
- Error message: Below password field, color `#EB295B`, font 12px (if auth fails)

**Actions:**
- Click "Kirish" → Call backend API
- Dispatch UserBloc event with credentials
- On success → Navigate to LoginPinScreen
- On failure → Show error message, shake animation

---

## Screen 3: LoginPinScreen

User enters 6-digit PIN using numeric keypad.

```
┌──────────────────────────────┐
│   PIN Kiriting               │
│   ━━━━━━━━━━━━━━━━━          │
│                              │
│   ● ● ● ● ● ●               │
│   [6 dots, filled as typed]  │
│                              │
│   ┌────┐ ┌────┐ ┌────┐      │
│   │ 1  │ │ 2  │ │ 3  │      │
│   └────┘ └────┘ └────┘      │
│   ┌────┐ ┌────┐ ┌────┐      │
│   │ 4  │ │ 5  │ │ 6  │      │
│   └────┘ └────┘ └────┘      │
│   ┌────┐ ┌────┐ ┌────┐      │
│   │ 7  │ │ 8  │ │ 9  │      │
│   └────┘ └────┘ └────┘      │
│   ┌────┐ ┌────┐ ┌────┐      │
│   │ *  │ │ 0  │ │ ⌫  │      │
│   └────┘ └────┘ └────┘      │
│                              │
│   ┌──────────────────────┐   │
│   │  Kirish              │   │
│   └──────────────────────┘   │
│                              │
└──────────────────────────────┘
```

**Layout:**
- Modal: 320×480px, centered
- Title: "PIN Kiriting" (18px, 700)
- Dot indicator: 6 circles (14px diameter)
  - Empty: `#EBEBEB` outline
  - Filled: `#FB6633` solid
- Numpad: 3×4 grid
  - Gap: 8px between buttons
  - Each button: flex width × 44px height
  - Border-radius: 10px
  - Font: 16px, weight 600
  - Number buttons: background `#F5F4F2`, border `#EBEBEB`
  - Delete button (*): background `#FFF0F3`, border `#EB295B`, icon color `#EB295B`
  - Hover: background `#EBEBEB`
- Primary button below keypad, width 100%

**Actions:**
- Click number → Add to PIN, update dot indicator
- Click delete (⌫) → Remove last digit
- When 6 digits entered → Validate PIN
- On success → Dispatch UserBloc, navigate to MainScreen
- On failure → Show error, clear dots, shake animation

---

# CashierScreen (Kassir)

**Default landing page for cashier role.** 4-tab dashboard for shift management, payment processing, and staff settings.

## Layout Structure

```
┌──────────────────────────────────────────────────────┐
│ [← Back]  Restaurant Name       Cashier: Ali | 11:02 │ ← Header (56px)
├─ Tab Bar ────────────────────────────────────────────┤ ← 56px
│ [Блюда 🟠] [Касса 🔴] [Счета 🟡] [Настройки 🟡]   │
├──────────────────────────────────────────────────────┤
│                                                       │
│  [Tab Content Area - scrollable]                    │
│                                                       │
├──────────────────────────────────────────────────────┤ ← Footer (56px)
│ Кассир: Ali    11:02:31    30 Март 2026, Душанба   │
└──────────────────────────────────────────────────────┘
```

**Dimensions:**
- Canvas: 1440×900px
- Header: 0–56px
- Tab bar: 56–112px
- Content: 112–844px (scrollable)
- Footer: 844–900px

---

## Tab Bar Styling

Container:
- Background: transparent
- Padding: 12px 24px
- Gap: 8px
- Border-bottom: 1px `#EBEBEB`

Each tab button:
- Padding: 8px 14px
- Border-radius: 12px
- Font: 13px, weight 600
- Transition: 200ms

| State | Background | Text Color |
|---|---|---|
| **Inactive** | transparent | `#888888` |
| **Active** | Tab color (see below) | white |
| **Hover** | Tab color (lighter) | white |

### Tab Colors

| Tab | Name | Inactive BG | Active Color |
|---|---|---|---|
| 1 | Блюда (Dishes) | `#FFF3EE` | `#FB6633` |
| 2 | Касса (Cash) | `#FFF0F3` | `#EB295B` |
| 3 | Счета (Bills) | `#FFF8E7` | `#F5A524` |
| 4 | Настройки (Settings) | `#FFF8E7` | `#F5A524` |

---

## Tab 1: Блюда (Dishes)

**Purpose:** Browse menu categories and items.

```
┌─ Sidebar (200px) ─┬─────────── Content Area ──────────┐
│ ┌────────────┐    │                                   │
│ │ Отдел ← A │    │  ┌─ Category: "Plov" ──┐        │
│ ├────────────┤    │  │ ┌─────────┐         │        │
│ │ Kategoriya │    │  │ │ Image   │ Plov   │        │
│ ├────────────┤    │  │ │ (100px) │ 5 items│        │
│ │ Блюда      │    │  │ └─────────┘        │        │
│ ├────────────┤    │  └────────────────────┘        │
│ │ Modifikato │    │  ┌─ Category: "Manti" ─┐       │
│ ├────────────┤    │  │ ┌─────────┐         │        │
│ │ Pozitsiya  │    │  │ │ Image   │ Manti  │        │
│ ├────────────┤    │  │ │ (100px) │ 3 items│        │
│ │ Stol-list  │    │  │ └─────────┘        │        │
│ └────────────┘    │  └────────────────────┘        │
│                   │                                   │
└───────────────────┴───────────────────────────────────┘
```

### Left Sidebar Menu (200px)

- Width: 200px
- Border-right: 1px `#EBEBEB`
- Padding: 12px 8px
- Gap: 4px

Each menu item:
- Height: 40px
- Padding: 8px 12px
- Border-radius: 10px
- Font: 13px, weight 500

| State | Background | Text | Border |
|---|---|---|---|
| **Inactive** | transparent | `#888888` | none |
| **Active** | `#FFF3EE` | `#FB6633` | 2px left `#FB6633` |
| **Hover** | `#F5F4F2` | `#888888` | none |

Menu items:
1. Отдел
2. Kategoriya
3. Блюда
4. Modifikatori
5. Pozitsiya Blyudlar
6. Stol-list

### Content Area (right side)

Grid of category cards:
- Column gap: 12px
- Row gap: 12px
- Cards per row: Flexible (auto-fit)

Each card:
- Width: 120px
- Height: 140px
- Border-radius: 12px
- Border: 1px `#EBEBEB`
- Padding: 8px
- Background: white
- Image: 100px square, border-radius 8px, object-fit cover
- Title: 12px weight 600, centered below image
- Hover: shadow `0 4px 12px rgba(251,102,51,0.15)`

---

## Tab 2: Касса (Cash Register) — Default Active

**Most important tab.** Shift management and payment breakdown dashboard.

```
┌─────────────────────────────────────────────────────┐
│ LEFT (flex: 3)              RIGHT (flex: 2)        │
│                                                     │
│ ┌──────────────────────┐  ┌──────────────────┐    │
│ │ Shift Info Card      │  │ Naqd:     450K   │    │
│ │ Kasir: Ali           │  │ Karta:    175K   │    │
│ │ 09:00 → 11:30       │  │ Total:    625K   │    │
│ │ ✓ Online    02:30    │  └──────────────────┘    │
│ └──────────────────────┘  16px gap                │
│ 16px gap                  ┌──────────────────┐    │
│ ┌──────────────────────┐  │ To'lov Usullari  │    │
│ │ Action Buttons       │  │ ████ 73% 450K    │    │
│ │ ┌────┐ ┌────┐        │  │ ██   27% 175K    │    │
│ │ │Poln│ │Klie│        │  └──────────────────┘    │
│ │ └────┘ └────┘        │                          │
│ │ ┌────┐ ┌────┐        │                          │
│ │ │Doer│ │Oply│        │                          │
│ │ └────┘ └────┘        │                          │
│ └──────────────────────┘                          │
│ 16px gap                                           │
│ ┌───────────────────────────────────────────────┐ │
│ │  [Smenani Yopish] — red button              │ │
│ └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Main Layout

Two-column flex layout:
- Left column: flex 3
- Right column: flex 2
- Gap: 20px
- Padding: 20px 24px
- Height: 732px (scrollable if needed)

### Shift Info Card

**Dimensions:**
- Height: 80px
- Padding: 20px
- Border-radius: 16px
- Border: 1px `#EBEBEB`
- Background: white

**Content (horizontal row with dividers):**
```
[Col1]     [Divider]     [Col2]     [Divider]     [Col3]     [Divider]     [Col4]
Kasir      1px #EBEBEB   Shift open 1px #EBEBEB   Terminal   1px #EBEBEB   Duration
Ali        vertical      09:00      vertical      🟢 Online  vertical      02:15
14px 700   36px height   14px 700   36px height                            20px 700 #FB6633
```

### Action Buttons Grid (5 buttons)

Grid: 2 columns, gap 12px

Each button:
- Height: 80px
- Border-radius: 12px
- Border: 2px solid (color)
- Background: (color) with 15% opacity
- Font: 13px, weight 600
- Text-align: center
- Hover: border color darker, shadow

Buttons and colors:

| Label | Hex | Background | Border |
|---|---|---|---|
| Polnota (Completeness) | `#00BCD4` | `#00BCD4` 15% | `#00BCD4` |
| Kliyentlar (Clients) | `#3B82F6` | `#3B82F6` 15% | `#3B82F6` |
| Dostava (Delivery) | `#FB6633` | `#FB6633` 15% | `#FB6633` |
| Razdacha (Distribution) | `#13AF1B` | `#13AF1B` 15% | `#13AF1B` |
| To'lov (Payment) | `#FB6633` | `#FB6633` 15% | `#FB6633` |

### Stats Cards (Right side)

3 cards stacked vertically, gap 12px each.

**Each card:**
- Height: 60px
- Padding: 12px 16px
- Border-radius: 16px
- Border: 1px `#EBEBEB`
- Background: white
- Flex: 1

**Content:**
```
Label (12px 500 #888888)
Value (22px 700 [color])
```

Stat cards:

| Label | Value Color | Example |
|---|---|---|
| Naqd (Cash) | `#13AF1B` | 450,000 so'm |
| Karta (Card) | `#3B82F6` | 175,000 so'm |
| Jami (Total) | `#FB6633` | 625,000 so'm |

### Payment Breakdown Card (Right side)

**Dimensions:**
- Min-height: 180px
- Padding: 20px
- Border-radius: 16px
- Border: 1px `#EBEBEB`
- Background: white

**Header:**
- Title: "To'lov Usullari" (14px, weight 700, color `#19160B`)
- Margin-bottom: 16px

**Payment type rows (each):**
- Height: 50px
- Margin-bottom: 12px

```
[10px circle] Naqd              73%        450,000 so'm
              [████████░░░░░░░░] progress   13px 700
              ^^^^^^^^ 8px height
```

Color dots:
- Naqd (Cash): `#13AF1B`
- Karta (Card): `#3B82F6`

Progress bar:
- Height: 8px
- Border-radius: 4px
- Background: color with 20% opacity
- Fill: color (full solid)
- Percentage: 12px `#888888`
- Amount: 13px weight 700

### Close Shift Button

Below action buttons, full width left column.

- Height: 44px
- Border-radius: 10px
- Background: `#FFF0F3` (error light)
- Border: 2px `#EB295B`
- Text: "Smenani Yopish" (13px weight 600, color `#EB295B`)
- Hover: background darker
- Click: Open CloseShiftDialog

---

## Tab 3: Счета (Bills)

**Purpose:** View and filter bill history.

```
┌─ Sub-filter tabs ──────────────────────────┐
│ [Barcha Schyotlar ●] [Schyot] [Dostava]   │
├────────────────────────────────────────────┤
│                                            │
│ #001234 │ Stol-5 │ Naqd │ 450K │ ✓ │ 11:30 │
│ #001235 │ Stol-8 │ Karta│ 175K │ ⏳ │ 11:45 │
│ #001236 │ Del    │ Naqd │ 320K │ ✓ │ 12:00 │
│                                            │
└────────────────────────────────────────────┘
```

### Sub-filter Tabs

Container:
- Height: 40px
- Padding: 4px
- Border-radius: 10px
- Background: `#F5F4F2`
- Gap: 4px
- Margin-bottom: 16px

Each tab:
- Padding: 8px 12px
- Border-radius: 8px
- Font: 13px, weight 500

| State | Background | Text | Border |
|---|---|---|---|
| **Inactive** | transparent | `#888888` | none |
| **Active** | white | `#19160B` | 1px `#EBEBEB` |
| **Hover** | transparent | `#666` | none |

Filter options:
1. Barcha Schyotlar (All Bills)
2. Schyot (Regular)
3. Dostava (Delivery)
4. Razdacha (Distribution)

### Bills Table

**Layout:** Full-width scrollable table

Header row:
- Height: 40px
- Padding: 12px 16px
- Background: white
- Border-bottom: 2px `#EBEBEB`
- Font: 12px, weight 600, color `#888888`

Data rows:
- Height: 50px
- Padding: 12px 16px
- Border-bottom: 1px `#F5F4F2`
- Background: white
- Hover: background `#FAFAFA`
- Font: 13px, weight 400

**Columns:**

| Column | Width | Content | Notes |
|---|---|---|---|
| Bill # | 80px | #001234 | 12px font |
| Table/Type | 100px | "Stol-5" or "Del" | 13px font |
| Payment | 80px | "Naqd", "Karta", "Online" | 11px font, caption |
| Amount | 120px | 450,000 so'm | 13px weight 700 |
| Status | 100px | Status badge (see below) | Badge component |
| Time | 80px | 11:30 | 11px font |
| Guests | 60px | 2 kishi | 11px font |

### Status Badges

Inline in table rows.

```
✓ To'langan          ⏳ Kutilmoqda          ◐ Qisman
bg #E8F9E9          bg #FFF8E7             bg #EEF2FF
text #13AF1B        text #F5A524           text #3B82F6
```

Dimensions:
- Height: 26px
- Padding: 4px 10px
- Border-radius: 6px
- Font: 12px, weight 500
- Icon: 12×12px before text

---

## Tab 4: Настройки (Settings)

**Purpose:** Manage staff, halls, printer settings.

```
┌─ Персонал Restorani ─────────────────────────┐
│ 👥  Staff List             →                 │
├──────────────────────────────────────────────┤
│                                              │
├─ Zallar ─────────────────────────────────────┤
│ 🏢  Hall Management         →                │
├──────────────────────────────────────────────┤
│                                              │
├─ Printer Sozlamalari ─────────────────────────┤
│ 🖨️  Printer Settings        →                │
└──────────────────────────────────────────────┘
```

### Layout

Full-width list of settings items.

Each item:
- Height: 60px
- Padding: 16px 20px
- Border-bottom: 1px `#EBEBEB`
- Background: white
- Hover: background `#FAFAFA`
- Display: flex, align-items center, space-between

### Settings Item Structure

```
[Icon 22×22px]    [Title + Description]           [Chevron →]
   #888888         14px 600 #19160B
                   12px 400 #888888
```

Settings items:

| Icon | Title | Description | Action |
|---|---|---|---|
| 👥 | Персонал Restorani | Staff list | Navigate to StaffScreen |
| 🏢 | Zallar | Hall management | Navigate to HallScreen |
| 🖨️ | Настройки Printerlari | Printer config | Navigate to PrinterScreen |

Chevron:
- 18×18px
- Color: `#EBEBEB`
- Right-aligned

---

## Open Shift Dialog

Shows when app starts and no shift is active.

```
┌─────────────────────────────────────┐
│ Smenani Ochish                      │
├─────────────────────────────────────┤
│                                     │
│ Naqd Summani Kiriting               │
│ ┌─────────────────────────────────┐ │
│ │                           0     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Terminal Summani Kiriting           │
│ ┌─────────────────────────────────┐ │
│ │                           0     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌────┐ ┌────┐ ┌────┐               │
│ │ 1  │ │ 2  │ │ 3  │               │
│ └────┘ └────┘ └────┘               │
│ ┌────┐ ┌────┐ ┌────┐               │
│ │ 4  │ │ 5  │ │ 6  │               │
│ └────┘ └────┘ └────┘               │
│ ┌────┐ ┌────┐ ┌────┐               │
│ │ 7  │ │ 8  │ │ 9  │               │
│ └────┘ └────┘ └────┘               │
│ ┌────┐ ┌────┐ ┌────┐               │
│ │ *  │ │ 0  │ │ ⌫  │               │
│ └────┘ └────┘ └────┘               │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Ochish                         │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### Dialog Dimensions

- Width: 320px
- Modal overlay: background `rgba(0,0,0,0.5)`
- Centered on screen
- Border-radius: 16px
- Padding: 24px
- Background: white

### Structure

Title:
- "Smenani Ochish" (18px, weight 700)
- Margin-bottom: 20px
- Color: `#19160B`

Input fields (2):

**Field 1:** Naqd Summani Kiriting
**Field 2:** Terminal Summani Kiriting

Each field:
- Height: 44px
- Border: 1px `#EBEBEB`
- Border-radius: 10px
- Padding: 8px 12px
- Font: 18px, weight 600
- Text-align: right
- Placeholder: `#AAAAAA`
- Background: white
- Margin-bottom: 12px

Numpad:
- Grid: 3 columns × 4 rows
- Gap: 8px
- Margin: 16px 0

Each button:
- Flex width
- Height: 44px
- Border-radius: 10px
- Border: 1px `#EBEBEB`
- Font: 16px, weight 600
- Hover: background `#EBEBEB`

**Number buttons (1–9, 0, *):**
- Background: `#F5F4F2`
- Text: `#19160B`

**Delete button (⌫):**
- Background: `#FFF0F3`
- Border: 1px `#EB295B`
- Icon: backspace, color `#EB295B`

Confirm button:
- Height: 44px
- Width: 100%
- Primary style, margin-top: 12px

---

# WaiterScreen (Ofitsant)

**Default landing page for waiter role.** Manage tables, take orders, view reservations.

## Layout

```
┌────────────────────────────────────────────────┐
│ [← Back]  Restaurant     Time | Status        │ ← Header
├─ Hall Tabs ───────────────────────────────────┤
│ [Zal 1 ●] [Zal 2] [Zal 3] ...                │
├────────────────────────────────────────────────┤
│                                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │    1     │  │    2     │  │    3     │   │
│  │          │  │ Ali: 2ch │  │  BOOKED  │   │
│  │ Free     │  │ 05:12    │  │ 19:00    │   │
│  │          │  │          │  │          │   │
│  │ [Menu]   │  │ [Menu]   │  │ [Waiting]│   │
│  └──────────┘  └──────────┘  └──────────┘   │
│                                                │
└────────────────────────────────────────────────┘
```

### Hall Tabs

Container:
- Height: 40px
- Padding: 12px 24px
- Background: transparent
- Gap: 8px
- Border-bottom: 1px `#EBEBEB`

Each tab:
- Padding: 8px 12px
- Border-radius: 8px
- Font: 13px, weight 500

| State | Background | Text |
|---|---|---|
| **Inactive** | transparent | `#888888` |
| **Active** | `#F5F4F2` | `#19160B` |

Tab names: Zal 1, Zal 2, Zal 3, etc.

### Table Card Grid

Grid layout:
- Columns: Auto-fit, min 150px
- Gap: 16px
- Padding: 20px 24px

Each card:
- Width: 180px
- Height: 140px
- Border-radius: 14px
- Border: 2px solid
- Padding: 16px
- Display: flex, flex-direction column, justify-content space-between

### Table Card States

**Empty (Free):**
```
┌─────────────┐
│      1      │  ← Table number (18px 700)
│             │
│   Free      │  ← Status (13px 500 #19160B)
│             │
│  [Menu]     │  ← Button
└─────────────┘
```
- Border: 2px `#EBEBEB`
- Background: white
- Hover: border `#FB6633`, shadow

**Occupied (Busy):**
```
┌─────────────┐
│      2      │  ← Table number
│             │
│ Ali: 2 ch   │  ← Waiter + guest count (12px)
│ 05:12       │  ← Wait time (12px #888)
│             │
│  [Menu]     │  ← Button
└─────────────┘
```
- Border: 2px `#FB6633`
- Background: `#FFF3EE`
- Hover: shadow

**Reserved (Booked):**
```
┌─────────────┐
│      3      │
│             │
│  BOOKED     │  ← Red text (13px 700 #EB295B)
│  19:00      │  ← Time (12px)
│             │
│ [Waiting]   │
└─────────────┘
```
- Border: 2px `#3B82F6`
- Background: `#EEF2FF`

Table number:
- Font: 18px, weight 700
- Color: `#19160B`

Status text:
- Font: 12px–13px
- Color: depends on state

Action button:
- Height: 32px
- Border-radius: 8px
- Font: 12px, weight 600
- Flex-grow: 0

Button labels:
- Empty: "Menu"
- Occupied: "Menu"
- Booked: "Waiting"

---

## Order Detail Screen

Opens when table is clicked.

```
┌────────────────────────────────────────────────────┐
│ [← Назад]  Table 5          [Close ×]             │
├────────────────────────────────────────────────────┤
│                                                    │
│ LEFT (flex: 2)        │  RIGHT (flex: 3)         │
│                       │                           │
│ ┌─ Order Sidebar ─┐   │  ┌─ Menu Grid ─────┐    │
│ │ Item 1: Plov    │   │  │ Cat: Bread       │    │
│ │ 25,000          │   │  │ [Image] Chap     │    │
│ │ Qty: 2          │   │  │ 8,000            │    │
│ │ [x]             │   │  │                  │    │
│ │                 │   │  │ [Image] Manti    │    │
│ │ Item 2: Soup    │   │  │ 12,000           │    │
│ │ 8,000           │   │  │                  │    │
│ │ Qty: 1          │   │  └──────────────────┘    │
│ │ [x]             │   │                          │
│ │                 │   │                          │
│ │ ─────────────── │   │                          │
│ │ Subtotal: 58K   │   │                          │
│ │ Tax:      5.8K  │   │                          │
│ │ TOTAL:    64K   │   │                          │
│ │                 │   │                          │
│ │ [To'lov] button │   │                          │
│ └─────────────────┘   │                          │
│                       │                          │
└───────────────────────┴──────────────────────────┘
```

### Left Order Sidebar (flex: 2)

Width: ~40% of screen

**Header:**
- "Buyurtma" title (14px 700)
- Margin-bottom: 16px

**Order items list:**

Each item:
- Padding: 12px
- Border-bottom: 1px `#EBEBEB`
- Display: flex, justify-content space-between

```
[Item name + price]    [qty spinner]  [delete ×]
Plov                   2
25,000 so'm
```

Item name: 13px weight 600
Price: 12px weight 700 color `#FB6633`
Qty: Input spinner, width 50px
Delete: Button, color `#EB295B`, hover shows

**Totals section:**

- Margin-top: 12px
- Padding: 12px 0
- Border-top: 2px `#EBEBEB`
- Border-bottom: 2px `#EBEBEB`

```
Subtotal:    58,000 so'm     ← 12px, #888
Tax:         5,800 so'm      ← 12px, #888
TOTAL:       64,000 so'm     ← 14px 700, #FB6633
```

**Action buttons:**

- Margin-top: 16px
- Gap: 8px

Buttons:
1. Primary: "To'lov" (Payment)
2. Secondary: "Qo'shimcha" (Add more)

---

### Right Menu Area (flex: 3)

**Category filter tabs:**

Container similar to Bills tab filter, 16px top gap

**Product grid:**

Grid: 3 columns, gap 12px

Each product card:
- Width: 120px
- Height: 140px
- Border-radius: 12px
- Border: 1px `#EBEBEB`
- Padding: 8px
- Background: white

Structure:
```
[Image 100×100px]
Name (12px 600)
Price (13px 700 #FB6633)
```

Hover:
- Shadow `0 4px 12px rgba(251,102,51,0.15)`
- Cursor: pointer

Click: Open add-to-order sheet or add directly to order

---

## Item Notes Modal

Shows when user clicks an order item to modify notes.

```
┌──────────────────────────┐
│ Eslatma (Notes)          │
├──────────────────────────┤
│                          │
│ ┌────────────────────┐   │
│ │ [Text input]       │   │
│ │ Max 100 characters │   │
│ └────────────────────┘   │
│                          │
│ Tezkor eslatmalar:       │
│ [Hamir yo'q] [Achchiq]   │
│ [Kam tuz]   [Qo'l qilib] │
│                          │
│ ┌────────────┐ ┌────────┐ │
│ │  Saqlash   │ │ Bekor  │ │
│ └────────────┘ └────────┘ │
└──────────────────────────┘
```

Dimensions:
- Width: 340px
- Modal centered
- Border-radius: 16px
- Padding: 24px

Text input:
- Height: 100px
- Resize: vertical
- Border: 1px `#EBEBEB`
- Border-radius: 10px
- Padding: 12px
- Font: 13px
- Margin-bottom: 16px

Quick chips:
- Gap: 8px
- Margin-bottom: 16px
- Height: 32px
- Border-radius: 6px
- Padding: 6px 12px
- Background: `#F5F4F2`
- Border: 1px `#EBEBEB`
- Font: 12px

Buttons:
- "Saqlash" (Save): Primary
- "Bekor" (Cancel): Secondary
- Gap: 8px

---

## Split Bill Modal

For splitting bill between guests.

```
┌──────────────────────────────┐
│ Schyotni Bo'lish             │
├──────────────────────────────┤
│                              │
│ Jami: 64,000 so'm            │
│                              │
│ Narpay: [2 guests]  [+] [-]  │
│                              │
│ Per person: 32,000 so'm      │
│                              │
│ Tip %:                       │
│ [5%] [10%] [15%] [20%]      │
│                              │
│ Tip: 6,400 so'm              │
│ Jami: 70,400 so'm            │
│                              │
│ ┌──────────┐ ┌──────────┐   │
│ │   Tasdi  │ │  Bekor   │   │
│ └──────────┘ └──────────┘   │
└──────────────────────────────┘
```

Dimensions:
- Width: 340px
- Modal centered
- Border-radius: 16px
- Padding: 24px

Total display:
- Font: 14px 700
- Margin-bottom: 16px

Guest count:
- Display: flex
- Gap: 8px
- Margin-bottom: 16px

Number input: width 60px, height 40px
Buttons (+/-): 40×40px, border-radius 8px

Per person display:
- Font: 13px
- Color: `#888888`
- Margin-bottom: 16px

Tip buttons:
- Grid: 4 columns, gap 8px
- Height: 40px
- Border-radius: 8px
- Font: 13px weight 600

Totals:
- Tip: 13px #888
- Total: 14px 700 #FB6633
- Border-top: 1px `#EBEBEB`, padding-top: 12px
- Margin: 16px 0

---

# PaymentScreen (To'lov)

User selects payment method and enters amount.

```
┌─────────────────────────────────┐
│ To'lov Turi                     │
├─────────────────────────────────┤
│                                 │
│ ◉ Naqd         ○ Karta  ○ Online│
│                                 │
│ Summa: 64,000 so'm              │
│                                 │
│ ┌─────────────────────────────┐ │
│ │              64000          │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌────┐ ┌────┐ ┌────┐           │
│ │ 1  │ │ 2  │ │ 3  │           │
│ └────┘ └────┘ └────┘           │
│ ┌────┐ ┌────┐ ┌────┐           │
│ │ 4  │ │ 5  │ │ 6  │           │
│ └────┘ └────┘ └────┘           │
│ ┌────┐ ┌────┐ ┌────┐           │
│ │ 7  │ │ 8  │ │ 9  │           │
│ └────┘ └────┘ └────┘           │
│ ┌────┐ ┌────┐ ┌────┐           │
│ │ .  │ │ 0  │ │ ⌫  │           │
│ └────┘ └────┘ └────┘           │
│                                 │
│ ┌─────────────────────────────┐ │
│ │  Tasdiqlash                 │ │
│ └─────────────────────────────┘ │
│                                 │
│ Change (for cash): 36,000 so'm  │
│                                 │
└─────────────────────────────────┘
```

### Layout

- Width: 400px (modal) or full screen
- Padding: 24px
- Border-radius: 16px

### Payment Method Selector

Radio buttons or toggle tabs:
- 3 options: Naqd (Cash), Karta (Card), Online
- Gap: 12px
- Margin-bottom: 20px

Selected: filled circle + text color `#FB6633`
Unselected: outline circle + text color `#888888`

### Amount Display

Label: "Summa" (13px #888)
Large display field:
- Height: 50px
- Border: 1px `#EBEBEB`
- Border-radius: 10px
- Font: 24px weight 700, right-aligned
- Padding: 12px 16px
- Margin: 8px 0 16px 0
- Background: white
- Color: `#19160B`

### Numpad

Grid: 3 columns × 4 rows
Gap: 8px
Margin: 16px 0 20px 0

Each button:
- Flex width
- Height: 44px
- Border-radius: 10px
- Border: 1px `#EBEBEB`
- Font: 16px weight 600

**Number buttons:**
- Background: `#F5F4F2`
- Text: `#19160B`

**Decimal button (.):**
- Background: `#F5F4F2`
- Text: `#19160B`

**Delete button (⌫):**
- Background: `#FFF0F3`
- Border: 1px `#EB295B`
- Icon: `#EB295B`

Hover: background `#EBEBEB`

### Confirm Button

Height: 44px, width 100%, primary style

### Change Display (for cash only)

Shows below confirm button:
- Font: 13px color `#888888`
- Margin-top: 12px
- Bold value: 14px weight 700 color `#13AF1B`

Format: "Qachon: 36,000 so'm"

---

# ArchiveScreen (Arxiv)

Browse historical bills with filters and details.

```
┌─ Filter Bar ──────────────────────────────────┐
│ [Date From] [Date To] [Payment] [Status] [Go] │
├───────────────────────────────────────────────┤
│                                               │
│ #001234 │ Stol-5 │ Kassir: Ali │ 450K │ ... │
│ #001235 │ Stol-8 │ Kassir: Bob │ 175K │ ... │
│                                               │
│ ┌─ Detail Panel ─────────────────────────┐   │
│ │ Bill #001234                           │   │
│ │ Table: Stol-5                          │   │
│ │ Items:                                 │   │
│ │   Plov × 2 → 50,000                    │   │
│ │   Soup × 1 → 8,000                     │   │
│ │ Total: 450,000 so'm                    │   │
│ │ Payment: Naqd                          │   │
│ │ Cashier: Ali                           │   │
│ │ Time: 11:30                            │   │
│ └────────────────────────────────────────┘   │
│                                               │
└───────────────────────────────────────────────┘
```

### Layout

Two panels:
- Left: Bills table (flex: 3)
- Right: Bill detail slide-in (flex: 2, hidden initially)

### Filter Bar

- Height: 56px
- Padding: 12px 24px
- Border-bottom: 1px `#EBEBEB`
- Display: flex, gap 12px, align-items center

Inputs:
- Date From: Date picker input
- Date To: Date picker input
- Payment: Dropdown (All, Cash, Card, Online)
- Status: Dropdown (All, Paid, Pending)
- Go: Button (primary)

Each input: width 120px, height 40px

### Bills Table

Header + scrollable rows (same as Bills tab)

Columns:
- Bill #
- Table/Type
- Cashier
- Amount
- Status
- Date
- Time

Click row: Slide in detail panel on right

### Bill Detail Slide-in Panel

- Width: ~35% of screen
- Padding: 20px
- Background: white
- Border-left: 1px `#EBEBEB`
- Scrollable if tall

**Content:**

```
Bill #001234                    ← 14px 700
─────────────────────────────
Table: Stol-5                   ← 13px
Items:                          ← 12px gray
  Plov × 2        50,000 so'm   ← 13px + right aligned
  Soup × 1         8,000 so'm

─────────────────────────────
Subtotal:        450,000 so'm   ← 12px
Tax:              45,000 so'm
TOTAL:           495,000 so'm   ← 14px 700 #FB6633
─────────────────────────────
Payment: Naqd                   ← 13px
Cashier: Ali                    ← 13px
Time: 11:30                     ← 13px
Date: 30 Mart                   ← 13px
─────────────────────────────

[Print Receipt] [Close] buttons  ← 40px height, gap 8px
```

---

# CloseShiftScreen (Smena Yopish)

Cashier closes shift at end of day.

```
┌──────────────────────────────────────────────┐
│ Smena Yopish                                 │
├──────────────────────────────────────────────┤
│                                              │
│ ┌─ Shift Info ─────────────────────────┐    │
│ │ Kassir: Ali         09:00 → 17:30    │    │
│ │ Duration: 08:30     Terminal: Online │    │
│ └──────────────────────────────────────┘    │
│                                              │
│ ┌─ Stats ──────────────────────────────┐    │
│ │ [Naqd: 450K] [Karta: 175K]           │    │
│ │ [Jami: 625K] [Shift #: 125]          │    │
│ └──────────────────────────────────────┘    │
│                                              │
│ ┌─ Payment Breakdown ──────────────────┐    │
│ │ Naqd:  ████████ 72% 450K             │    │
│ │ Karta: ████ 28% 175K                 │    │
│ │ Online: ██ 0%  0K                    │    │
│ └──────────────────────────────────────┘    │
│                                              │
│ ┌─ Cash Reconciliation ────────────────┐    │
│ │ Calculated:  450,000 so'm            │    │
│ │ Actual:      [input field]           │    │
│ │ Difference:  ±0 so'm                 │    │
│ │                                      │    │
│ │ ┌────────────────────────────────┐   │    │
│ │ │ Numpad                         │   │    │
│ │ └────────────────────────────────┘   │    │
│ │                                      │    │
│ │ [Yopish] [Bekor]                    │    │
│ └──────────────────────────────────────┘    │
│                                              │
└──────────────────────────────────────────────┘
```

### Layout

Full-width scrollable content (similar to CashierScreen)

Padding: 20px 24px

### Shift Info Card

Same as CashierScreen Tab 2, showing:
- Cashier name
- Open and close times
- Duration
- Terminal status

### Stats Grid

4 cards in 2×2 grid:
- Gap: 12px
- Margin-bottom: 16px

Each card: 60px height

| Card | Value | Color |
|---|---|---|
| Naqd | 450,000 so'm | `#13AF1B` |
| Karta | 175,000 so'm | `#3B82F6` |
| Jami | 625,000 so'm | `#FB6633` |
| Shift # | 125 | `#888888` |

### Payment Breakdown Card

Same as CashierScreen Tab 2, showing all payment types and percentages.

### Cash Reconciliation Section

**Input field:**
- Height: 44px
- Border: 1px `#EBEBEB`
- Border-radius: 10px
- Padding: 8px 12px
- Font: 18px weight 600
- Right-aligned

**Calculated amount:** 13px gray above input
**Difference display:**
- Red if negative (short)
- Green if zero/positive (over)
- Font: 13px weight 700

**Numpad:** Same as other screens (3×4 grid)

**Buttons:**
- "Yopish" (Close): Danger style
- "Bekor" (Cancel): Secondary
- Gap: 8px

---

# NotificationScreen (Bildirishnomalar)

View notification history.

```
┌────────────────────────────────┐
│ Bildirishnomalar               │
├────────────────────────────────┤
│                                │
│ 🔔 Stol 5 ready   11:30 ●     │
│ 📝 Order updated  11:25        │
│ ✓ Shift closed    11:20        │
│ ⚠️ Low stock      11:15        │
│                                │
│ [Empty state] No notifications │
│                                │
└────────────────────────────────┘
```

### Layout

Full-width list, padding 20px 24px

### Notification Item

Height: 50px
Padding: 12px 16px
Border-bottom: 1px `#F5F4F2`
Display: flex, align-items center, gap 12px
Hover: background `#FAFAFA`

```
[Icon 18×18px]    [Title]         [Time] [●unread dot]
  #FB6633         13px 500        11px gray
                  #19160B
```

Unread dot:
- 8px diameter
- Color: `#FB6633`
- Right-aligned

### Empty State

Centered message:
- Icon: 48px
- Text: "Bildirishnomalar yo'q" (14px gray)

---

# AdminScreen

Full system access dashboard (placeholder for future development).

```
┌──────────────────────────────────┐
│ Admin Dashboard                  │
├──────────────────────────────────┤
│                                  │
│ ┌─ Management Sections ─────┐   │
│ │ 📊 Reports & Analytics    │   │
│ │ 👥 Staff Management       │   │
│ │ 🏢 Hall Settings          │   │
│ │ 📋 Menu Management        │   │
│ │ ⚙️ System Settings         │   │
│ └───────────────────────────┘   │
│                                  │
│ [Coming soon — full design TBD] │
│                                  │
└──────────────────────────────────┘
```

### Layout

Grid of management cards:
- 3 columns
- Gap: 16px
- Padding: 20px 24px

Each card:
- 180×120px
- Border-radius: 16px
- Border: 1px `#EBEBEB`
- Padding: 16px
- Display: flex, flex-direction column, align-items center, justify-content center
- Hover: shadow, cursor pointer

Icon + label below

**Note:** This screen is a placeholder. Full design will be provided in Phase 2.

---

# Components Library

Reusable design components for all screens.

---

## Button Component

### Primary Button

```
┌──────────────────┐
│  Kirish          │
└──────────────────┘
```

- **Background:** `#FB6633`
- **Text:** white, 13px weight 600
- **Height:** 40px
- **Padding:** 0 16px
- **Border-radius:** 10px
- **Border:** none
- **Hover:** background `#e55a2b`
- **Active:** opacity 0.8
- **Disabled:** opacity 0.5, cursor not-allowed

### Secondary Button

```
┌──────────────────┐
│ Bekor            │
└──────────────────┘
```

- **Background:** `#F5F4F2`
- **Border:** 1px solid `#EBEBEB`
- **Text:** `#19160B`, 13px weight 600
- **Height:** 40px
- **Padding:** 0 16px
- **Border-radius:** 10px
- **Hover:** background `#EBEBEB`

### Danger Button

```
┌──────────────────┐
│ O'chirish        │
└──────────────────┘
```

- **Background:** `#FFF0F3`
- **Border:** 1px solid `#EB295B`
- **Text:** `#EB295B`, 13px weight 600
- **Height:** 40px
- **Padding:** 0 16px
- **Border-radius:** 10px
- **Hover:** background `#FFF8F0`

### Ghost Button

```
┌──────────────────┐
│ Ko'p batafsiliy   │
└──────────────────┘
```

- **Background:** transparent
- **Border:** none
- **Text:** `#FB6633`, 13px weight 600
- **Height:** 40px
- **Padding:** 0 12px
- **Hover:** background `#FFF3EE`

---

## Badge Component

### Status Badges

```
✓ To'langan        ⏳ Kutilmoqda       ◐ Qisman        🔴 Bekor
bg #E8F9E9         bg #FFF8E7         bg #EEF2FF      bg #FFF0F3
text #13AF1B       text #F5A524       text #3B82F6    text #EB295B
12px 500           12px 500           12px 500        12px 500
```

- **Height:** 26px
- **Padding:** 4px 10px
- **Border-radius:** 6px
- **Icon:** 12×12px (if included)

### Role Badges

```
Admin              Kassir             Ofitsant         Oshpaz
bg #FFF3EE         bg #E8F9E9         bg #EEF2FF       bg #FFF8E7
text #FB6633       text #13AF1B       text #3B82F6     text #F5A524
```

Same dimensions as status badges.

### Loyalty Badges

```
Gold               Silver             Bronze
bg #FFF8E7         bg #F5F4F2         bg #FFF3DC
text #F5A524       text #888888       text #CF8506
```

---

## Input Component

### Text Input

```
┌──────────────────────────────────┐
│ [Placeholder text]               │
└──────────────────────────────────┘
```

- **Height:** 40px
- **Padding:** 8px 12px
- **Border:** 1px solid `#EBEBEB`
- **Border-radius:** 10px
- **Font:** 13px
- **Background:** white
- **Placeholder:** `#AAAAAA`

**States:**

| State | Border | Background | Shadow |
|---|---|---|---|
| Idle | `#EBEBEB` | white | none |
| Focused | `#FB6633` | white | `0 0 0 3px rgba(251,102,51,0.1)` |
| Error | `#EB295B` | white | none |
| Disabled | `#EBEBEB` | `#F5F4F2` | none |

### Numpad Display Input

(Larger variant for payment screens)

```
┌─────────────────────────────────────┐
│                            64000    │
└─────────────────────────────────────┘
```

- **Height:** 50px
- **Padding:** 12px 16px
- **Border:** 1px solid `#EBEBEB`
- **Border-radius:** 10px
- **Font:** 24px weight 700, right-aligned
- **Background:** white

---

## Card Component

### Standard Card

```
┌──────────────────────┐
│  Card Title          │
│  ────────────────    │
│                      │
│  Content here        │
│                      │
└──────────────────────┘
```

- **Border-radius:** 16px
- **Border:** 1px solid `#EBEBEB`
- **Padding:** 20px
- **Background:** white
- **Shadow:** `0 1px 4px rgba(0,0,0,0.06)`
- **Hover shadow:** `0 4px 12px rgba(251,102,51,0.15)`

### Table Card (Table Status Card)

```
Empty:              Occupied:           Reserved:
┌────────┐         ┌────────┐          ┌────────┐
│   1    │         │   2    │          │   3    │
│        │         │ Ali: 2 │          │ BOOKED │
│ Free   │         │ 05:12  │          │ 19:00  │
│        │         │        │          │        │
│[Menu]  │         │[Menu]  │          │[Wait]  │
└────────┘         └────────┘          └────────┘

Empty:   border 2px #EBEBEB, bg white, hover shadow + border #FB6633
Busy:    border 2px #FB6633, bg #FFF3EE
Booked:  border 2px #3B82F6, bg #EEF2FF
```

Dimensions:
- **Width:** 180px
- **Height:** 140px
- **Border-radius:** 14px
- **Padding:** 16px

---

## Navigation Components

### Sidebar Nav Item

```
Active:
┌──────────────┐
│ 🏠 Bosh      │ ← bg #2D2B32, icon #FB6633
└──────────────┘

Inactive:
┌──────────────┐
│ 📊 Xisobot   │ ← bg transparent, icon #6B6875
└──────────────┘
```

- **Width:** 56px
- **Height:** 56px
- **Border-radius:** 12px
- **Display:** flex, align-items center, justify-content center
- **Icon:** 22×22px
- **Label:** 10px below icon (if shown)

| State | Background | Icon Color | Label Color |
|---|---|---|---|
| **Active** | `#2D2B32` | `#FB6633` | `#FB6633` |
| **Inactive** | transparent | `#6B6875` | `#6B6875` |
| **Hover** | `#252329` | `#888888` | `#888888` |

### Tab Bar Item

```
Active:
┌────────────────┐
│  Касса         │ ← bg #EB295B, text white
└────────────────┘

Inactive:
┌────────────────┐
│  Schyotlar     │ ← bg transparent, text #888888
└────────────────┘
```

- **Padding:** 8px 14px
- **Border-radius:** 12px
- **Font:** 13px weight 600
- **Height:** 36px

---

## Toggle / Switch Component

```
On:                Off:
┌─────────┐       ┌─────────┐
│ ●      │       │      ●  │ ← white circle
└─────────┘       └─────────┘
  #FB6633          #EBEBEB
```

- **Width:** 40px
- **Height:** 22px
- **Border-radius:** 11px
- **Knob:** 16×16px white circle, border-radius 50%
- **Animation:** 200ms ease

**On state:**
- **Background:** `#FB6633`
- **Knob position:** right

**Off state:**
- **Background:** `#EBEBEB`
- **Knob position:** left

---

## Search Input

```
┌─────────────────────────────┐
│ 🔍 [Search...]              │
└─────────────────────────────┘
```

- **Width:** 240–260px
- **Height:** 40px
- **Padding:** 7px 12px
- **Border:** 1px solid `#EBEBEB`
- **Border-radius:** 10px
- **Background:** `#F5F4F2`
- **Font:** 13px
- **Icon:** 18×18px, color `#888888`

---

## Progress Bar

```
████████░░░░░░░░ 73%
```

- **Height:** 8px
- **Border-radius:** 4px
- **Background (empty):** color 20% opacity
- **Fill (full):** solid color
- **Colors:** Payment method specific

---

## Data Table

```
┌────────────┬──────────┬────────────┬──────────┐
│ Header     │ Header   │ Header     │ Header   │
├────────────┼──────────┼────────────┼──────────┤
│ Data       │ Data     │ Data       │ Data     │
├────────────┼──────────┼────────────┼──────────┤
│ Data       │ Data     │ Data       │ Data     │
└────────────┴──────────┴────────────┴──────────┘
```

**Header row:**
- **Font:** 12px weight 600, color `#888888`
- **Padding:** 11px 14px
- **Background:** white
- **Border-bottom:** 2px solid `#EBEBEB`
- **Height:** 40px

**Data rows:**
- **Font:** 13px weight 400 (default), weight 700 for amounts
- **Padding:** 11px 14px
- **Height:** 50px
- **Border-bottom:** 1px solid `#F5F4F2`
- **Hover:** background `#FAFAFA`

---

## Dialog / Modal

```
┌─────────────────────────────────┐
│ Dialog Title                    │
├─────────────────────────────────┤
│                                 │
│ Content here                    │
│                                 │
│ ┌─────────────┐ ┌─────────────┐ │
│ │ OK          │ │ Cancel      │ │
│ └─────────────┘ └─────────────┘ │
└─────────────────────────────────┘
```

- **Border-radius:** 16px
- **Padding:** 24px
- **Background:** white
- **Shadow:** `0 8px 32px rgba(0,0,0,0.12)`
- **Overlay:** `rgba(0,0,0,0.5)`
- **Max-width:** 90vw
- **Max-height:** 90vh
- **Position:** centered, fixed

---

## Spinners / Loaders

### Loading Spinner

Rotating circle (24px diameter):
- **Stroke:** 2px `#FB6633`
- **Speed:** 1s rotation
- **Easing:** linear

### Empty State

```
    [Icon 48×48px]
    No data found
    Subtitle here
```

- **Icon:** color `#AAAAAA`
- **Title:** 14px weight 600, color `#19160B`
- **Subtitle:** 12px, color `#888888`
- **Centered** in container

---

## Keyboard / Numpad

```
┌────┐ ┌────┐ ┌────┐
│ 1  │ │ 2  │ │ 3  │
└────┘ └────┘ └────┘
┌────┐ ┌────┐ ┌────┐
│ 4  │ │ 5  │ │ 6  │
└────┘ └────┘ └────┘
┌────┐ ┌────┐ ┌────┐
│ 7  │ │ 8  │ │ 9  │
└────┘ └────┘ └────┘
┌────┐ ┌────┐ ┌────┐
│ .  │ │ 0  │ │ ⌫  │
└────┘ └────┘ └────┘
```

- **Grid:** 3 columns × 4 rows
- **Gap:** 8px
- **Button size:** flex width × 44px height

**Number buttons (0–9, .):**
- **Background:** `#F5F4F2`
- **Border:** 1px `#EBEBEB`
- **Text:** `#19160B` 16px weight 600
- **Hover:** background `#EBEBEB`

**Delete button (⌫):**
- **Background:** `#FFF0F3`
- **Border:** 1px `#EB295B`
- **Icon:** backspace, color `#EB295B`
- **Hover:** background `#FFE8F0`

---

## Typography

All text uses **Inter** font family.

| Use Case | Size | Weight | Color | Line Height |
|---|---|---|---|---|
| Page titles | 18px | 700 | `#19160B` | 1.2 |
| Card titles | 15–16px | 700 | `#19160B` | 1.2 |
| Body text | 13px | 400 | `#19160B` | 1.4 |
| Labels | 12px | 500 | `#888888` | 1.4 |
| Captions | 11px | 400 | `#888888` | 1.4 |
| Small text | 10px | 500 | `#AAAAAA` | 1.2 |

---

## Shadow & Elevation

| Elevation | CSS Shadow | Usage |
|---|---|---|
| **Subtle** | `0 1px 4px rgba(0,0,0,0.06)` | Cards at rest |
| **Medium** | `0 4px 12px rgba(251,102,51,0.15)` | Cards on hover |
| **High** | `0 8px 32px rgba(0,0,0,0.12)` | Modals, dropdowns |

---

## Spacing Scale

**8px baseline grid**

| Token | Pixels | Use |
|---|---|---|
| `xs` | 4px | Minimal |
| `sm` | 8px | Tight spacing |
| `md` | 12px | Standard |
| `lg` | 16px | Comfortable |
| `xl` | 20px | Large gaps |
| `xxl` | 24px | Large containers |

---

## Animation / Transitions

- **Standard:** 200ms ease-in-out (hover, active states)
- **Quick:** 150ms ease-out (interactions)
- **Slow:** 300ms ease-in-out (modals, slides)

---

## Icon Style

**Size variants:**
- Large: 22×22px (sidebar nav)
- Medium: 18×18px (buttons, headers)
- Small: 14–16px (inline, tables)

**Style:**
- Stroke-only (no fill)
- Stroke-width: 1.8px
- Stroke-linecap: round
- Stroke-linejoin: round

**Colors:**
- Active: `#FB6633`
- Inactive: `#6B6875`
- Disabled: `#AAAAAA`

---

## Responsive Notes

- Canvas: 1440×900px (fixed for desktop/tablet)
- No breakpoints or mobile layout
- All components scale within this fixed frame
- Use flex layouts for flexibility within container widths

---

## Implementation Notes for Designers

1. **Use 8px grid** for all alignments and spacing
2. **Color tokens** — do NOT use hex hardcoded; reference tokens for consistency
3. **Typography** — use Inter font; match weights and sizes exactly
4. **Shadow** — use subtle shadows consistently on hover states
5. **Hover states** — all interactive elements should have clear hover feedback
6. **Icons** — stroke-only style, 1.8px stroke-width
7. **Transitions** — 200ms ease-in-out for smooth interactions
8. **Component names** — follow naming in this spec for Code Connect mapping
9. **Accessibility** — sufficient color contrast (WCAG AA)
10. **Rounded corners** — use 10px for buttons, 12px for inputs, 16px for cards

---

## Design System References

See **docs/design_system.md** for:
- Detailed color token definitions
- Typography scale with all weights
- Spacing and layout rules
- Component base styles
- Sidebar dimensions and icons

See **docs/cashier_figma_spec.md** for:
- Pixel-level measurements for CashierScreen
- Tab color scheme details
- Action button grid specifications
- Payment breakdown card specifications

---

**End of TZ Document**

Questions? Contact development team for clarification on screen flows, data models, or backend integration.
