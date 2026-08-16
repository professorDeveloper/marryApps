# CashierScreen — Detailed Plan

## Overview

When a user with `role == UserRole.cashier` logs in, they land on `CashierScreen`.

**On first load:** `ShiftBloc.checkShift()` is called.
- Shift not found → show **Open Shift dialog**
- Shift exists → show cashier dashboard, default to Tab 2 (Касса)

---

## Screen Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  HEADER                                                          │
│  [← Logout]   Restaurant Name   Cashier: Ali  |  11:02:31      │
├──────────────────────────────────────────────────────────────────┤
│  TAB BAR                                                         │
│  [Блюда 🔴]  [Касса 🔴 ●]  [Счета 🟡]  [Настройки 🟡]          │
├──────────────────────────────────────────────────────────────────┤
│  BODY  (changes per tab)                                         │
│                                                                  │
│  Tab 1: ┌─Sidebar 200px─┐  ┌─Content Area─────────────────┐    │
│         │ Отдел         │  │ (changes per sidebar item)    │    │
│         │ Категория     │  │                               │    │
│         │ Блюда         │  │                               │    │
│         │ Модификаторы  │  │                               │    │
│         │ Позиции блюд  │  │                               │    │
│         │ Стол-лист     │  │                               │    │
│         └───────────────┘  └───────────────────────────────┘    │
│                                                                  │
│  Tab 2–4: Full-width content (no sidebar)                        │
├──────────────────────────────────────────────────────────────────┤
│  BOTTOM INFO BAR                                                 │
│  Кассир: Ali              11:02:31         30 Март 2026         │
└──────────────────────────────────────────────────────────────────┘
```

---

## Bottom Info Bar

Always visible at the bottom. Updates every second via `Timer.periodic`.

| Field | Data source |
|-------|-------------|
| Cashier name | `UserBloc.state.userMOdel?.fullName` |
| Live time | `DateTime.now()` formatted `HH:mm:ss` |
| Date | `DateTime.now()` formatted `"30 Март 2026, Понедельник"` |

---

## Tab 1: Блюда (Dishes) — Pink accent

**Layout:** Left sidebar (200px) + Content area

Left sidebar has 6 items. Tap one → content area updates.

### Sidebar → Content mapping

| Sidebar Item | Content Area |
|--------------|--------------|
| **Отдел** (Department) | Table list: Name, Hall count. No edit for now — read-only |
| **Категория** (Category) | Category cards grid. API: `GET /categories` (reuse `getCategories()`) |
| **Блюда** (Menu items) | Product grid. API: `GET /goods` (reuse `getGoodsByCategoryId('all')`) |
| **Модификаторы** | Placeholder: "Keyinchalik qo'shiladi" |
| **Позиции блюд** | Placeholder: "Keyinchalik qo'shiladi" |
| **Стол-лист** | Reuse `HallWidget` + `TabFilter` from waiter screen |

Default selected: **Категория**

---

## Tab 2: Касса (Cash Register) — Red accent — DEFAULT TAB

**Layout:** Full width, 2 columns

```
Left column (flex 3):                  Right column (flex 2):
┌─────────────────────────┐            ┌──────────────────────────┐
│ SHIFT INFO CARD          │            │ STATS                    │
│ Cashier | Opened | Term. │            │ Naqd: 1,200,000 so'm    │
│ Duration: 02:15          │            │ Karta: 450,000 so'm     │
└─────────────────────────┘            │ Jami: 1,650,000 so'm    │
┌─────────────────────────┐            └──────────────────────────┘
│ ACTION BUTTONS                        ┌──────────────────────────┐
│ ┌─────────────────────┐ │            │ PAYMENT BREAKDOWN        │
│ │  ПОЛНОТА (cyan)     │ │            │ Naqd ████████ 73%       │
│ └─────────────────────┘ │            │ Karta ████ 27%          │
│ ┌────────┐ ┌──────────┐ │            └──────────────────────────┘
│ │Клиенты │ │ Доставка │ │
│ └────────┘ └──────────┘ │
│ ┌────────┐ ┌──────────┐ │
│ │Раздача │ │  Оплата  │ │
│ └────────┘ └──────────┘ │
└─────────────────────────┘
[        Smenani yopish (red)         ]
```

### Buttons and actions

| Button | Color | What happens |
|--------|-------|--------------|
| **Полнота** | Cyan `#00BCD4` | Navigate to `DetailScreen` with takeaway args `{table: null, guest_count: 1, table_status: TableStatus.away}`. Cashier creates order not tied to a table. |
| **Клиенты** | Blue | Show client search panel (placeholder — future feature) |
| **Доставка** | Orange | Show delivery orders inline list. Filter: call `getArchives()` with delivery type filter |
| **Раздача** | Green | Show distribution/employee meal orders inline list |
| **Оплата** | Brand orange | Open payment dialog: numpad, select cash/card/both, submit via `createPayment()` |
| **Smenani yopish** | Red | Navigate to `AppRoutes.closeShiftScreen` (existing screen) |

### Shift Info Card
Reuse `_ShiftInfoCard` from `close_shift_screen.dart` (extract to shared widget).
Shows: cashier name, shift open time, terminal status, duration.

### Stats panel
- Pull values from `ShiftBloc.state.shift` (opening cash/card)
- Update when new payments come in (future: real-time from API)

---

## Tab 3: Счета (Bills) — Yellow accent

**Layout:** Full width

### Sub-filter tabs
```
[Все счета]  [Счет]  [Доставка]  [Раздача]
```
Each filter calls `getArchives()` with corresponding type.

### Bills list
Each row shows:
- Bill number (`#bilNumber`)
- Table or order type
- Total amount (`grandTotal`)
- Status badge (paid / open)
- Date/time

Tap on a row → navigate to bill detail using `getArchiveWithId(bill.id)`.

### Bill Detail (side panel or new page)
Shows full `ArchiveDetailEntity`:
- Goods list (name, qty, price)
- Totals breakdown (food, service, discount, grand total)
- Payment method used
- Cashier name, date/time

---

## Tab 4: Настройки (Settings) — Yellow accent

**Layout:** Full width, settings list

| Setting | Icon | Action |
|---------|------|--------|
| **Персонал ресторана** | `Icons.people` | Staff list from `GET /users`. Read-only |
| **Залы** | `Icons.store` | Hall list. Reuse `getHalls()`. Read-only for now |
| **Настройки принтеров** | `Icons.print` | Placeholder: "Keyinchalik qo'shiladi" |

Each tapped → opens detail panel on the right (split view, similar to Tab 1).

---

## Open Shift Dialog

Shown as a bottom sheet or center dialog when no active shift.

```
Dialog: "Smenani ochish"
├── Cash input field + numpad (reuse _keyboardKey from close_shift_screen.dart)
├── Card/terminal input field
├── [Naqd] / [Karta] toggle to switch active input
└── [Ochish] button → ShiftBloc.add(ShiftEvent.openShift())
```

After success: close dialog, Tab 2 content loads with shift data.

Uses existing:
- `OpenShiftModel` (`open_shift_model.dart`)
- `ShiftEvent.openShift()` (`shift_event.dart`)
- Numpad logic from `close_shift_screen.dart`

---

## State Management

No new blocs needed. Reuse:

| Bloc | Purpose |
|------|---------|
| `ShiftBloc` | Shift open/check/close, cash/card totals |
| `UserBloc` | Cashier name in header and bottom bar |
| `MainCubit` | Halls + tables (for Стол-лист in Tab 1) |

Local state in `CashierScreen`:
```dart
int _selectedTab = 1;           // default: Касса tab
int _selectedSidebarItem = 1;   // default: Категория in Tab 1
```

---

## File Structure

```
lib/features/view/cashier/
└── presentation/
    └── pages/
        ├── cashier_screen.dart               ← root screen, tab switcher
        └── widgets/
            ├── cashier_header.dart           ← header with back + cashier info
            ├── cashier_tab_bar.dart          ← 4-tab pill/colored tab bar
            ├── cashier_bottom_bar.dart       ← live clock + date + name
            ├── open_shift_dialog.dart        ← dialog: open shift with numpad
            ├── tab_dishes/
            │   ├── dishes_tab.dart           ← Tab 1: sidebar + content area
            │   └── dishes_sidebar_item.dart  ← single sidebar nav item
            ├── tab_kassa/
            │   ├── kassa_tab.dart            ← Tab 2: shift info + action buttons
            │   └── kassa_action_button.dart  ← large action card button
            ├── tab_bills/
            │   ├── bills_tab.dart            ← Tab 3: sub-filter + list
            │   └── bill_list_item.dart       ← single bill row widget
            └── tab_settings/
                └── settings_tab.dart         ← Tab 4: settings list
```

---

## Reusable Code (do NOT duplicate)

| What | File |
|------|------|
| `_ShiftInfoCard` | Extract from `close_shift_screen.dart` → move to shared widgets |
| `_PaymentBreakdownCard` | Extract from `close_shift_screen.dart` → move to shared widgets |
| Numpad `_keyboardKey` | Extract from `close_shift_screen.dart` → move to shared widgets |
| `HallWidget` + `TabFilter` | `hall_widget.dart` / `tab_filter.dart` — use directly |
| `ShiftBloc` events | Already in DI — just `context.read<ShiftBloc>()` |

---

## Implementation Order

1. `cashier_screen.dart` — skeleton with 4 tabs (placeholders for each)
2. `cashier_bottom_bar.dart` — live clock widget
3. `open_shift_dialog.dart` — open shift on first load
4. `kassa_tab.dart` — Tab 2 (most critical: shift info + action buttons)
5. `bills_tab.dart` — Tab 3 (archives reuse)
6. `dishes_tab.dart` — Tab 1 (sidebar + content stubs)
7. `settings_tab.dart` — Tab 4 (list with placeholders)
8. Extract shared widgets from `close_shift_screen.dart`

---

## Verification

1. Login with cashier role → `CashierScreen` opens
2. If no shift → `OpenShiftDialog` appears, after submit → Tab 2 loads
3. Tab 2: Shift info card shows cashier name and open time
4. Полнота button → `DetailScreen` opens in takeaway mode
5. Smenani yopish → `CloseShiftScreen` opens
6. Tab 3: Bills list loads, tap one → detail shows
7. Bottom bar clock ticks every second
8. Tab 1 → sidebar nav → content area changes
