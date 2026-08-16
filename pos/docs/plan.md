# POS App — Implementation Plan

## 1. Login Flow & Role-Based MainScreen

### Maqsad
Hozir: Splash → LoginScreen → LoginPinScreen → MainScreen (static)
Yangi: Splash → LoginScreen → LoginPinScreen → MainScreen (role'ga qarab o'zgaradi)

### Flow (o'zgarmaydi)
```
Splash
  ├─ brandId yo'q ──→ LoginScreen (brand_id + password)
  │                         │
  │                         └──→ LoginPinScreen (PIN kiritish)
  │                                   │
  │                                   └──→ API call: {brand_id, password, pincode}
  │                                   └──→ Backend returns: {accessToken, user{id, name, role}}
  │
  ├─ brandId bor, token yo'q ──→ LoginPinScreen
  │
  └─ brandId + token bor ──→ MainScreen
                              (user.role'ga qarab UI o'zgaradi)
```

### Backend Response'ni o'zgarish (kerak)
Hozir: `{accessToken, refreshToken}`
Yangi: `{accessToken, refreshToken, user: {id, name, role, ...}}`

### MainScreen — Role-based UI

**Hozirgi MainScreen ishchi:**
- HallWidget → Tables grid
- Filter tabs

**O'zgarishi:** MainScreen'ni BlocBuilder'ga o'rash
```dart
BlocBuilder<UserBloc, UserState>(
  builder: (context, state) {
    final role = state.userModel?.role;

    switch(role) {
      case UserRole.cashier:
        return CashierScreen();  // Kassa UI
      case UserRole.waiter:
        return WaiterScreen();   // Ofitsant UI
      case UserRole.admin:
      case UserRole.manager:
        return AdminScreen();    // Admin UI
      default:
        return MainScreen();     // Default (tables grid)
    }
  }
)
```

### O'zgartiriluvchi fayllar
| Fayl | O'zgarish |
|------|-----------|
| `lib/core/api/dto/login_response.dart` | `user` field qo'shiladi |
| `lib/features/view/auth/presentation/cubit/auth_cubit.dart` | Login response'dan `user` saqlanadi |
| `lib/features/view/auth/presentation/bloc/user_bloc.dart` | `user.role` ishlatiladi |
| `lib/features/view/main/presentation/pages/main/main_screen.dart` | Role switch qo'shiladi |

### Yangi screen'lar (keyingi bosqichda)
| Rol | Screen | Fayl |
|-----|--------|------|
| `cashier` | CashierScreen | `lib/features/view/cashier/presentation/pages/cashier_screen.dart` |
| `waiter` | WaiterScreen | `lib/features/view/waiter/presentation/pages/waiter_screen.dart` |
| `admin` | AdminScreen | `lib/features/view/admin/presentation/pages/admin_screen.dart` |

---

---

## 2. CashierScreen — Batafsil Layout

### Umumiy struktura
4 ta tab + left sidebar + content area

### Top Tabs (4)
1. **Блюда** (Dishes) - Pink - Menu/dish management
2. **Касса** (Cash) - Red - Payment/cashier operations
3. **Счета** (Bills) - Yellow - Bills and accounts
4. **Настройки** (Settings) - Yellow - Settings

### Left Sidebar Menu
- Отдел (Department)
- Категория (Category)
- Блюда (Dishes)
- Модификаторы (Modifiers)
- Позиции блюд (Dish positions)
- Стол-лист (Table list)

### Content Area (role'ga qarab o'zgaradi)

**Tab 1: Блюда (Dishes)**
- Группы (Groups)
- Расходы и приходы (Expenses and income)

**Tab 2: Касса (Cash) — MAIN**
- Полнота (Completeness) — cyan highlight
- Клиенты (Clients)
- Доставка (Delivery)
- Раздача (Distribution)
- To'lovni qabul qilish
- Shift status

**Tab 3: Счета (Bills)**
- Все счета (All bills) - blue
- Счет (Bill) - blue
- Доставка (Delivery) - blue
- Раздача (Distribution) - blue

**Tab 4: Настройки (Settings)**
- Персонал ресторана (Restaurant staff)
- Залы (Halls)
- Настройки принтеров (Printer settings)

### Bottom Right Info Panel
```
Кассир: Касса
11:02:31
30 Март 2026, Понедельник
```
- Cashier name
- Current time
- Date

### Highlighted Components
- **Полнота** (Cyan/Turquoise) - Main cashier operation
- **Монитор** (Lime green) - Monitor/display dashboard

---

## 3. Role-Specific Screens

### Rollar va mos screen'lar
| Rol | Screen | Features |
|-----|--------|----------|
| `cashier` | CashierScreen | Shift, payments, reports |
| `admin` / `manager` | AdminScreen | Full access |
| `waiter` | WaiterScreen | Tables, orders |

### WaiterScreen (Ofitsant) — kerakli featurlar (hozir ishlanmoqda)
- [x] Enhanced table cards (waiting time, alerts, badges)
- [x] Item notes modal (Izoh qo'shish)
- [x] Split bill modal (To'lovni bo'lish)
- [x] Special requests checkboxes
- [ ] Band stolga kirganda avvalgi buyurtmalar ko'rinishi
- [ ] Oshxonaga bildir (Kitchen notification)

### CashierScreen (Кешier) — kerakli featurlar
- Shift ochish / yopish
- To'lovni qabul qilish (naqd, karta, online)
- Kunlik hisobot
- Client management
- Delivery tracking
- Staff management
- Hall/section management

### Admin uchun kerakli featurlar
- Barcha funksiyalar
- Xodimlar boshqaruvi
- Statistika va hisobotlar
- Menu boshqaruvi

---

## 4. Band stolga kirganda orders ko'rsatish (fix kerak)

### Muammo
Band stol ustiga bosilganda avvalgi tanlangan menu itemlari ko'rinmaydi.

### Yechim
**Option A (Hozirgi):** SavedOrdersBloc — lokal xotirada saqlash
**Option B (To'liq):** `GET /api/v1/bills/{tableId}` — API'dan fetch qilish

### API ma'lumotlari
- Endpoint: `/api/v1/bills/{id}`
- Mavjud: `getArchiveWithId()` in `main_datasources.dart`
- Response: `ArchiveDetailEntity` (goods, totalPrice, guestCount...)

### Implementatsiya
1. Band stol bosilganda table ID bilan `/api/v1/bills/{tableId}` chaqiriladi
2. Response'dagi `goods` → `OrderItem` formatiga convert qilinadi
3. `DetailEvent.initSavedGoods()` orqali sidebar'ga yuklanadi

---

## 6. Cash Register Shift API (`/api/v1/cash-register-shifts`)

> Hujjat: `README_CASH_REGISTER_SHIFT.md`

### Endpointlar

| Method | URL | Maqsad |
|--------|-----|--------|
| `POST` | `/api/v1/cash-register-shifts` | Smena ochish |
| `GET` | `/api/v1/cash-register-shifts/active?cash_register_id=` | Faol smena tekshirish |
| `POST` | `/api/v1/cash-register-shifts/{id}/close` | Smena yopish |
| `GET` | `/api/v1/cash-register-shifts/{id}` | Smena by ID |
| `GET` | `/api/v1/cash-register-shifts` | Smena ro'yxati |

### Muhim qoidalar
- `cashier_id` — **jo'natilmaydi**, backend JWT tokendan oladi
- `cash_register_id` — JWT'dan `_resolveCashRegisterId()` orqali olinadi
- Bir kassa uchun bir vaqtda faqat bitta faol smena bo'lishi mumkin
- 404 javob = faol smena yo'q → smena ochish ekrani ko'rsatiladi

### Request: Smena ochish
```json
{
  "cash_register_id": "...",
  "opening_cash": "100000",
  "opening_card": "0"
}
```

### Request: Smena yopish
```json
{
  "closing_cash": "250000",
  "closing_card": "80000"
}
```
> `shiftId` faqat URL path'da: `POST /api/v1/cash-register-shifts/{id}/close`

### Flutter integratsiyasi
- **`ShiftBloc`** — smena holati boshqaradi, JWT'dan `cash_register_id` chiqaradi
- **`main_datasources.dart`** — request body qo'lda yig'iladi (model.toJson() emas)
- **Offline fallback** — network xatosida `SharedPreferences`'ga lokal smena saqlanadi

---

## 7. To'lov API — Chegirma (Discount)

### Endpoint
```
POST /api/v1/orders/{id}/pay
```

### Request body
```json
{
  "payment_type": "cash | card | qr",
  "customer_paid_amount": "54000",
  "discount_percent": "10",
  "discount_amount": "0",
  "discount_comment": ""
}
```

### Qoidalar
- `discount_percent` — foiz chegirma (0-100). `"10"` = 10%
- `discount_amount` — summa chegirma (so'm). `"200000"` = 200,000 so'm
- Faqat bittasi ishlatiladi: yo foiz, yo summa (ikkinchisi `"0"` bo'ladi)
- `customer_paid_amount` — chegirmadan keyin to'lanadigan haqiqiy summa

### Flutter integratsiyasi
- **`WaiterCubit.closeOrder(paymentType, {discountPercent, discountAmount})`**
  - Chegirma qo'llanilgach `customer_paid_amount` avtomatik hisoblanadi
  - `discountPercent > 0` → `base * (1 - percent/100)` formula
  - `discountAmount > 0` → `base - amount` formula
- **`_CloseOrderView`** (bill_detail_panel.dart)
  - Chegirma input: foiz (%) yoki summa (Sum) toggle
  - Kiritilganda: chegirma summasi va yangi to'lov miqdori ko'rsatiladi

---

## 8. Offline Buyurtma Navbati (Rejali feature)

### Muammo

```
Internet yo'q → createOrder() → DioException → "Xato" xabari → hech narsa saqlanmaydi
```

Hozirgi holat:
- **Smena** — offline ishlaydi ✅ (`ShiftBloc` → `SharedPreferences` lokal smena)
- **Zakazlar** — offline ishlamaydi ❌ (`WaiterCubit.createOrder/sendItems/closeOrder` faqat API, fallback yo'q)

### Kerakli paketlar (kelajakda qo'shiladi)

| Paket | Maqsad |
|-------|--------|
| `connectivity_plus` | Internet holati real-time kuzatish |
| `shared_preferences` | JSON queue saqlash (mavjud, qo'shimcha paket shart emas) |
| `sqflite` yoki `drift` | Murakkab sync kerak bo'lsa lokal DB (ixtiyoriy) |

### Arxitektura

```
OfflineQueueService
  ├── enqueue(PendingOperation)   — operatsiyani navbatga qo'shish
  ├── processQueue()              — internet kelganda navbatni jo'natish
  └── clear()                    — muvaffaqiyatdan keyin tozalash

PendingOperation turlari:
  - createOrder   {tableId, guestCount, hallName, tableNumber, waiterId, ...}
  - sendItems     {localOrderId, items: [{goodId, quantity, comment}]}
  - closeOrder    {orderId, paymentType, discountPercent, discountAmount}
```

### Asosiy murakkabliklar

1. **Lokal ID muammosi** — `createOrder` offline bo'lsa server ID yo'q, lekin `sendItems` shu ID ga bog'liq
   - Yechim: lokal UUID yaratish (`local_<timestamp>`), sync vaqtida server ID bilan almashtirish

2. **Operatsiyalar tartibi** — ketma-ket bajarilishi shart
   - `createOrder` → server ID qaytaradi → `sendItems(serverId)` → `closeOrder(serverId)`

3. **Conflict resolution** — server va lokal holat farq qilishi mumkin
   - Yechim: optimistic approach, sync vaqtida server holati ustun

### Implement qilish tartibi (kelajak sprint)

1. `lib/core/service/offline/offline_queue_service.dart` — enqueue/processQueue
2. `lib/core/service/offline/connectivity_service.dart` — internet stream
3. `WaiterCubit` — API xatosida: `enqueue()`, internet kelganda: `processQueue()`
4. UI — offline indicator badge, "N ta amal sync kutmoqda" xabari
5. `di.dart` — yangi servicelarni register

### Verification (implement qilingandan keyin)

1. WiFi o'chir → order qo'sh → lokal saqlanganini tekshir (UI badge ko'rinishi)
2. WiFi yoq → sync avtomatik boshlanishini tekshir
3. Bir nechta pending operation: tartib saqlanganini tekshir
4. Server qaytargan ID lokal ID ni almashtirganini tekshir

---

## 5. Texnik qarzlar (Technical Debt)

- [ ] Debug `print()` statementlarini olib tashlash (order_side_bar_widget.dart)
- [ ] EnhancedTableCard'dagi waiting time real data bilan bog'lash
- [ ] Split bill modal'da real total amount uzatish
- [ ] Freezed files regenerate (`build_runner build`)

---

## 6. Smena / Shift — Mebel House uslubi (kelajak reja)

**Hozir:** Mary AI backend kontraktiga mos: `POST /api/v1/cash-register-shifts/{id}/close` body bilan (`closing_cash`, `closing_card`), ochish/yopish to‘g‘ridan-to‘g‘ri tugma orqali (ekranda tasdiqlash dialogisiz).

**Keyin (Mebel House desktop ga yaqinlashish):**

1. **UX** — ochish va yopishdan oldin ixchoq dialog: matn + **Ha / Yo‘q** (alohida `ShiftConfirmDialog` yoki shunga o‘xshash vidjet).
2. **Sidebar** — «Smena» punktini faqat smena bilan ishlaydigan rollarga ko‘rsatish (masalan `admin` / `manager` / `cashier`; ofitsiant/oshxonada yashirish) — `AppSidebar` ichida `UserBloc` roli bo‘yicha shart.
3. **Backend farqi** — Mebelda `POST close-shift/{id}` **tanasiz**; Mary AIda yopishda **body majburiy**. Kelajakda agar backend Mebelga o‘xshatilsa, clientda ham soddalashtirish mumkin; hozircha API o‘zgarmaguncha body bilan qolish.

Bu bandlar implement qilinmaguncha `ShiftBloc` va `list_api` dagi mavjud endpointlar o‘zgarishsiz qoladi.
