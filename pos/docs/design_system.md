# Mary Ai POS — Design System

## Brand Identity

**App Name:** Mary Ai POS
**Platform:** Flutter (Desktop/Tablet)
**Canvas size:** 1440×900px

---

## Colors

### Brand
| Token | Hex | Usage |
|---|---|---|
| `brand` | `#FB6633` | Primary actions, active states, orange accents |
| `brand-light` | `#FF8C5A` | Gradient end, hover states |
| `brand-bg` | `#FFF3EE` | Orange tinted background, selected states |
| `brand-border` | `#FB6633` | Active borders |

Logo gradient: `linear-gradient(135deg, #FB6633, #FF8C5A)`

### Background
| Token | Hex | Usage |
|---|---|---|
| `bg-app` | `#F5F4F2` | App background (warm light gray) |
| `bg-card` | `#FFFFFF` | Card/panel background |
| `bg-secondary` | `#F5F4F2` | Secondary inputs, chips |

### Text
| Token | Hex | Usage |
|---|---|---|
| `text-primary` | `#19160B` | Main text |
| `text-secondary` | `#888888` | Labels, metadata |
| `text-tertiary` | `#AAAAAA` | Placeholders, disabled |

### Border
| Token | Hex | Usage |
|---|---|---|
| `border` | `#EBEBEB` | Default borders |

### Semantic
| Token | Hex | Usage |
|---|---|---|
| `success` | `#13AF1B` | Online, confirmed, closed |
| `error` | `#EB295B` | Cancelled, urgent, delete |
| `warning` | `#F5A524` | Gold loyalty, warnings |
| `info` | `#3B82F6` | Card payment, reserved, info |

### Sidebar
| Token | Hex | Usage |
|---|---|---|
| `sidebar-bg` | `#18171C` | Sidebar background |
| `sidebar-active` | `#2D2B32` | Active nav item background |
| `sidebar-icon` | `#6B6875` | Inactive icon/label color |

---

## Typography

**Font Family:** Inter

| Style | Size | Weight | Usage |
|---|---|---|---|
| Title | 18px | 700 | Page headers |
| Heading | 15–16px | 700 | Card titles, section headers |
| Body | 13px | 400/500 | Table cells, body text |
| Caption | 11–12px | 400/500 | Labels, metadata, badges |
| Micro | 9–10px | 500 | Nav labels, axis labels |

---

## Spacing & Layout

### Sidebar
- Width: **72px**
- Nav item: 56×56px, border-radius: 12px
- Gap between items: 2px
- Padding: 0 8px

### Header
- Height: **56px**
- Padding: 0 24px
- Border-bottom: 1px solid `#EBEBEB`

### Content area
- Padding: **20px 24px**
- Gap between sections: 16px

### Cards
- Border-radius: **16px**
- Border: 1px solid `#EBEBEB`
- Padding: 16–20px

### Buttons
- Border-radius: **10px**
- Padding: 7px 14–16px
- Font: 13px, weight 600

---

## Components

### Sidebar Nav Item
```
Active:  background #2D2B32, icon/label #FB6633
Inactive: icon/label #6B6875
Hover:   background #252329
```

### Badge / Status chip
```
Open:      bg #FFF3EE, text #FB6633
Closed:    bg #E8F9E9, text #13AF1B
Cancelled: bg #FFF0F3, text #EB295B
Reserved:  bg #EEF2FF, text #3B82F6
Pending:   bg #FFF8E7, text #F5A524
```

### Loyalty Badge
```
Gold:   bg #FFF8E7, text #F5A524
Silver: bg #F5F4F2, text #888
Bronze: bg #FFF3DC, text #CF8506
```

### Role Badge (Staff)
```
Admin:   bg #FFF3EE, text #FB6633
Waiter:  bg #EEF2FF, text #3B82F6
Cashier: bg #E8F9E9, text #13AF1B
Kitchen: bg #FFF8E7, text #F5A524
```

### Toggle (Switch)
- Size: 40×22px, border-radius: 11px
- On: `#FB6633` (NOT green)
- Off: `#EBEBEB`
- Knob: white 16×16px circle

### Primary Button
```
Background: #FB6633
Color: white
Border-radius: 10px
Hover: #e55a2b
```

### Secondary Button
```
Background: #F5F4F2
Border: 1px solid #EBEBEB
Color: #19160B
```

### Danger Button
```
Background: #FFF0F3
Border: 1px solid #EB295B
Color: #EB295B
```

### Search Input
```
Background: #F5F4F2
Border: 1px solid #EBEBEB
Border-radius: 10px
Padding: 7px 12px
Width: 240–260px
```

### Filter Tabs
```
Container: background #F5F4F2 or #fff, border-radius 10px, padding 4px
Active tab: background #FB6633, text white (for primary) or bg #fff shadow (for secondary)
Inactive: text #888
```

### Data Table
```
Header: font 12px, weight 600, color #888, border-bottom 2px #EBEBEB
Row: border-bottom 1px #F5F4F2, hover #FAFAFA
Cell padding: 11px 14px
```

### Stat Card
```
Background: white
Border-radius: 16px
Border: 1px solid #EBEBEB
Padding: 16px 20px
Label: 12px, #888, weight 500
Value: 22–24px, weight 700
```

### Table Card (Stol)
```
Empty:    border 2px #EBEBEB, white bg
Occupied: border 2px #FB6633, bg #FFF3EE
Reserved: border 2px #3B82F6, bg #EEF2FF
Border-radius: 14px
Hover: border-color #FB6633 + shadow
```

### CashierScreen Tab Bar
```
Container: bg transparent, gap 8px
Each tab: padding 8px 14px, border-radius 12px
Active tab: bg (color), text white, outline none
Inactive tab: bg transparent, text #888888
Tab colors: see Screens > CashierScreen Tabs
```

### Shift Info Card (CashierScreen Tab 2)
```
Background: white
Border-radius: 16px
Border: 1px solid #EBEBEB
Padding: 16–24px
Height: 80px
Dividers: 1px vertical #EBEBEB between sections
Content: Cashier name | Shift open time | Terminal status | Duration
```

### Action Button Card (CashierScreen Tab 2)
```
Grid: 2 columns, gap 12px
Each: height 80px, border-radius 12px
Background: (color) 10% opacity
Border: 1px solid (color)
Text: 13px 600, centered
Colors:
  Полнота: #00BCD4 (cyan)
  Клиенты: #3B82F6 (blue)
  Доставка: #FB6633 (orange)
  Раздача: #13AF1B (green)
  Оплата: #FB6633 (orange)
```

### Payment Breakdown Card (CashierScreen Tab 2)
```
Background: white
Border-radius: 16px
Border: 1px solid #EBEBEB
Padding: 20px
Content: Title + 2 payment type rows with progress bars
Row: label (13px), percentage (12px #888), amount (13px 700)
Progress bar: height 8px, border-radius 4px, (color) fill
```

### Bills List Row (CashierScreen Tab 3)
```
Height: 50px
Padding: 12px 16px
Border-bottom: 1px #F5F4F2
Hover: bg #FAFAFA
Columns: Bill# | Table/Type | Payment method | Amount (700) | Status badge | Time | Guests
Font: 13px 400 (default), 700 for amount
```

---

## Screens

### Role-based Main Screens

| Role | Screen | File | Description |
|---|---|---|---|
| Waiter | Столы | `waiter-main.html` | Table grid with status colors (current MainScreen) |
| Cashier | CashierScreen | `cashier-main.html` | 4-tab dashboard: Dishes, Cash register, Bills, Settings |
| Admin/Manager | AdminScreen | `admin-main.html` | Full admin dashboard (future) |

### CashierScreen Tabs

| Tab | Color | Accent | Purpose |
|---|---|---|---|
| **Блюда** (Dishes) | `#FFF3EE` bg, `#FB6633` text | Orange `#FB6633` | Menu/category management |
| **Касса** (Cash) | `#FFF0F3` bg, `#EB295B` text | Red `#EB295B` | Shift + payment operations (DEFAULT) |
| **Счета** (Bills) | `#FFF8E7` bg, `#F5A524` text | Gold `#F5A524` | Bills history and filtering |
| **Настройки** (Settings) | `#FFF8E7` bg, `#F5A524` text | Gold `#F5A524` | Staff, halls, printer config |

### Supporting Screens

| Screen | File | Description |
|---|---|---|
| Stol detail | `table-detail.html` | Left: order, Right: menu grid |
| To'lov | `payment.html` | Payment methods + numpad |
| Zal | `hall.html` | Floor plan with table positions |
| Bronlar | `reservations.html` | Calendar + reservation list |
| Hisoblar | `bills.html` | Orders table with stats |
| Xodimlar | `staff.html` | Staff cards grid |
| Mijozlar | `clients.html` | Clients table with loyalty |
| Oshxona | `kitchen2.html` | Kitchen display cards |
| Menyu | `menu.html` | Menu management |
| Sozlamalar | `settings2.html` | Settings with sidebar nav |
| Chek | `receipt2.html` | Receipt constructor |

### Full interactive prototype
`app.html` — Single-page app with all screens, JS navigation between them.

---

## Navigation Flow

```
Столы → (click table) → Stol detail → (Оплатить) → Payment → (confirm) → Столы
Stol detail → (← Назад) → Столы
Settings → (Конструктор чека) → Receipt → (← Назад) → Settings
Sidebar → any screen
```

---

## Icon Style
- Stroke-only (no fill)
- Stroke-width: 1.8px
- Stroke-linecap: round
- Stroke-linejoin: round
- Size: 22×22px in sidebar, 14–18px elsewhere
- Color: `#6B6875` inactive, `#FB6633` active

---

## Elevation / Shadow
- Cards: `box-shadow: 0 1px 4px rgba(0,0,0,0.06)` (subtle)
- Hover card: `box-shadow: 0 4px 12px rgba(251,102,51,0.15)`
- Modal/dialog: `box-shadow: 0 8px 32px rgba(0,0,0,0.12)`
