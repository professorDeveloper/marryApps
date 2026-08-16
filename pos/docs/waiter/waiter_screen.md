# Ofitsant Ekrani — Implementation Plan
# (Jowi POS screenshotlari asosida)

---

## Layout: 4-panel (Jowi-style)

```
┌──────┬──────────────┬──────────────────────┬──────────────┐
│Sidebar│ Bills Panel  │    Menu Panel        │Detail Panel  │
│ 72px │   280px      │     (flex)           │   320px      │
└──────┴──────────────┴──────────────────────┴──────────────┘
```

---

## Panel 1: Sidebar (72px)

- Logo + nav ikonalar (arxiv, bildirishnoma, smena, chiqish)
- Mavjud `app_sidebar.dart` o'zgarmaydi

---

## Panel 2: Bills Panel (280px)

### Tepa qism:
```
┌─────────────────────────────┐
│  + Yangi Schyot             │  ← orange button, full width
│  Mening Schyotlarim    ▼   │  ← dropdown + filter icon (≡)
└─────────────────────────────┘
```
- "+ Yangi Schyot" tugmasi — `#FB6633`, rounded, full-width, 44px
- "Mening Schyotlarim" dropdown (faqat o'zining schyotlari)
- O'ng tomonda filter icon (≡)

### Bill Card:
```
┌─────────────────────────────┐
│ P38                   14:19 │  ← stol raqami (gray 11px) + vaqt (gray 11px)
│ привет                      │  ← nom (15px 600, qora)
│ Летка  •  2                 │  ← zal • stol (12px gray)
└─────────────────────────────┘
```
- Padding: `12px 16px`
- Border-radius: 10px
- Tanlangan: border `2px #FB6633`, bg `#FFF3EE`
- Hover: bg `#F5F4F2`

---

## Panel 3: Menu Panel (flex)

### Tepa bar (bitta qator):
```
┌──────────────────────────────────────────────────────────┐
│ [←] [→] [🏠]    [Поиск...                            🔍] │
└──────────────────────────────────────────────────────────┘
```
- `←` `→` navigatsiya (categoriya history)
- `🏠` home — asosiy menuga qaytish
- Search — `placeholder: "Поиск..."`, o'ng tomonda 🔍 icon
- Hammasi bitta qatorda, bo'lingan (nav chap, search o'ng)

### Kontent: Kategoriyalar boshlang'ich ekrani
```
Меню

┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  ⚡           │  │  ❤️           │  │  ⭐           │
│              │  │              │  │              │
│ «GO» лист    │  │ Популярные   │  │ Услуги       │
│              │  │  блюда       │  │              │
│ 🍽 1 блюдо  →│  │ 🍽 3 блюда  →│  │ 🍽 1 услуга →│
└──────────────┘  └──────────────┘  └──────────────┘

┌──────────────┐  ┌──────────────┐
│  ✕           │  │  ████        │  ← rang avatar
│              │  │              │
│ Стоп лист    │  │ Шашлык       │
│              │  │              │
│ 🍽 1 блюдо  →│  │ 🍽 3 блюда  →│
└──────────────┘  └──────────────┘
```
- "Меню" section sarlavhasi (16px 600)
- 3 ustun grid
- Kategoriya karta: icon (40×40, rangli yumaloq bg) yoki rangli avatar + nom + "🍽 N блюда →"
- "Все блюда" section pastda alohida

### Kontent: Taomlar (kategoriya ichida)
```
Шашлык                          ← kategoriya nomi (section header)

┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│              │  │              │  │              │
│  (bo'sh bg)  │  │  (bo'sh bg)  │  │  (dim, gray) │ ← stop-listda
│              │  │              │  │              │
│ Кусковой     │  │ Кусковой     │  │ Молотый      │
│ баранина     │  │ говядина     │  │ шашлык       │
│ 18 000 сум   │  │ 17 000 сум   │  │ 13 000 сум   │
│ ♦ ⏱ 15      │  │   ⏱ 15      │  │ ✕ ⏱ 15      │ ← stop badge
└──────────────┘  └──────────────┘  └──────────────┘
```
- Stop-listdagi taom: opacity 0.4, ✕ badge, bosilmaydi
- Hover: karta qorayadi (dark bg), narx highlighted
- Click → detail panelda buyurtma qo'shiladi, pastda "Отправить | Все" paydo bo'ladi

---

## Panel 4: Detail Panel (320px)

### A) Schyot tafsiloti (schyot tanlanganda):

```
Счет P38  [Открыт]                [∧]
─────────────────────────────────────
Официант   Анатолий Ю  │ Зал        Летка
Клиент     —           │ Стол       2
Гости      3           │ Позиция    —
Скидка     0 сум       │ Обслуживание 15%
─────────────────────────────────────
[🔄]  [✏️]  [⋮]        [  Закрыть  ]
─────────────────────────────────────
[ Ожидание ] [ Готовится ] [ Получено ]
─────────────────────────────────────
(buyurtma elementlari status bo'yicha)
```

- Header: "Счет P38" (bold) + "Открыт" badge (orange bg, white text) + `∧` collapse button
- Info grid: 2 ustun, har birida 4 qator
- Action row: [🔄 refresh] [✏️ edit] [⋮ more] va o'ng tomonda yashil **"Закрыть"** button
- Status tabs: `Ожидание | Готовится | Получено` — aktiv tab dark bg

### Status: Ожидание (Kutish)
```
Обычный  •  14:35:31
Кусковой говядина                    5
```
- Order type (Обычный) + vaqt (gray)
- Taom nomi + miqdor

### Status: Готовится (Tayyorlanmoqda)
```
Обычный  •  14:35:31
Кусковой говядина                    5
До приготовления:              14m. 46s   ← qizil nuqta + countdown
```

### Status: Получено (Olindi)
```
Обычный  •  14:35:31
Кусковой говядина                    5
[❌]  [🔄]           [  Получить 1  ]
```

### Yangi taom qo'shilganda (pastki qism):
```
─────────────────────────────────────
[        Отправить  |  Все          ]   ← ko'k button, full width
```
- `Отправить` — tanlanganlarni yuborish
- `Все` — hammasini yuborish

---

### B) Yangi schyot formi (o'ng panel slide-in):

```
Новый счет                          [×]
─────────────────────────────────────
Название счета
┌─────────────────────────────────┐
│ привет                          │
└─────────────────────────────────┘

Зал                    Стол
┌────────────────┐  ┌────────────────┐
│ Летка        ▼ │  │ 2            ▼ │
└────────────────┘  └────────────────┘

Официант               Обслуживание
┌────────────────┐  ┌────────────┐  %
│ Анатолий Ю   ▼ │  │ 15         │
└────────────────┘  └────────────┘

Клиент
┌─────────────────────────────┐  [👤]
│ +998                        │
└─────────────────────────────┘

Количество гостей
┌────────────────────┐  [−]  [+]
│ 0                  │
└────────────────────┘

─────────────────────────────────────
[    Отмена    ]    [   Сохранить   ]
                          ↑ orange
```
- "Клиент" maydoniga bosilganda raqamli keyboard (numpad) chiqadi
- Numpad: 1-9, `.`, `0`, `←` + "Готово" tugmasi
- Saqlash → `POST /api/v1/orders`

---

### C) Zakryt schyot formi:

```
Закрыть счет                       [×]
─────────────────────────────────────
Обычный
Кусковой говядина           17 000 сум
                                    ×5
─────────────────────────────────────

Язык чека
┌──────────────┐  ┌──────────────┐
│  Английский  │  │   Русский    │
└──────────────┘  └──────────────┘

─────────────────────────────────────
[    Назад    ]        [ Закрыть ✓ ]
                            ↑ green
```

---

## Ranglar va stillar

| Element | Rang |
|---|---|
| Bills panel bg | `#FFFFFF` |
| Menu panel bg | `#F5F4F2` |
| Detail panel bg | `#FFFFFF` |
| Panel border | `1px #EBEBEB` |
| "+ Yangi schyot" button | `#FB6633` |
| Tanlangan bill border | `2px #FB6633` |
| Tanlangan bill bg | `#FFF3EE` |
| "Закрыть" button | `#13AF1B` (yashil) |
| "Отправить" button | `#3B82F6` (ko'k), full width |
| "Открыт" badge | orange bg, white text |
| Status tab aktiv | `#19160B` bg, white text |
| Status tab inactive | transparent, gray text |
| Section header (Меню, Все блюда) | `16px 600, #19160B` |
| Stop-list karta | `opacity: 0.4`, ✕ badge, `pointer-events: none` |

---

## API endpointlari

| Amal | Endpoint |
|---|---|
| Ochiq orderlarni olish | `GET /api/v1/orders` |
| Order yaratish | `POST /api/v1/orders` |
| Order item qo'shish | `POST /api/v1/order-items` |
| Schyotni yopish | `POST /api/v1/orders/{id}/pay` |
| Zallar | `GET /api/v1/halls` |
| Stollar | `GET /api/v1/cafe-tables/hall/{id}` |
| Kategoriyalar | `GET /api/v1/categories` |
| Taomlar (kategoriya) | `GET /api/v1/categories/{id}/goods` |
| Barcha taomlar | `GET /api/v1/goods` |

---

## Fayl strukturasi

```
lib/features/view/main/presentation/pages/waiter/
  ├── waiter_screen.dart
  └── widgets/
      ├── bills_panel.dart
      ├── bill_card.dart
      ├── menu_panel.dart
      ├── bill_detail_panel.dart
      ├── create_bill_form.dart
      └── (order_status_tabs.dart — keyinchalik)

lib/features/view/main/presentation/cubit/waiter/
  ├── waiter_cubit.dart
  └── waiter_state.dart
```
