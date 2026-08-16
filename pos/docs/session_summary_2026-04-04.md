# Sessiya xulosasi — POS (mary-ai-pos)

**Sana:** 2026-04-04  
**Maqsad:** kassir oqimi, schyotlar, to‘lov, arxiv va xatoliklarni yaxshilash.

Quyida bu sessiyada amalga oshirilgan ishlar, ulangan qismlar va rollar bo‘yicha qisqa tavsif.

---

## 1. Rollar va umumiy yo‘nalish

| Rol | Asosiy o‘zgarishlar |
|-----|---------------------|
| **Kassir (`UserRole.cashier`)** | Filial buyurtmalari ro‘yxati (barcha `status`), «Закрыть счет» faqat kassir uchun, to‘lov turi + summa bilan `pay`, boshlang‘ich ekran — **Stollar** (Smena avtomatik emas). |
| **Ofitsiant (`UserRole.waiter`)** | Schyotni yopish («Закрыть») **ko‘rinmaydi**; yopish oqimi kassirga xos. |
| **Boshqa rollar** | Smena yo‘q bo‘lganda menejer/admin uchun avvalgidek Smena ekraniga yo‘naltirish saqlanishi mumkin (kassir bundan mustasno). |

---

## 2. Buyurtma ro‘yxati (chap panel — `BillsPanel` / `BillCard`)

- **Status badge** — `OpenOrderModel.status` asosida: open, cooking, ready, served, paid, cancelled, reserved, rescheduled va boshqalar (`OpenOrderStatusLabel` extension).
- **Umumiy widget:** `order_status_badge.dart` — ro‘yxat va detal sarlavhada bir xil ko‘rinish.
- **Muammo tuzatish:** kassir uchun `loadOpenOrders` ichida faqat `status == open` qoldiradigan filtr **olib tashlandi** — endi API qaytargan barcha statuslar ko‘rinadi (masalan, **Оплачен**).

**Fayllar:** `open_order_model.dart`, `bill_card.dart`, `waiter_cubit.dart`, `order_status_badge.dart`.

---

## 3. Schyot detali (`BillDetailPanel`)

- **Sarlavha statusi** — avval doim «Открыт» edi; endi `OrderStatusBadge.fromOrder` — haqiqiy `status`.
- **Ma’lumotlar:** `Сумма` (`total_amount`), **Обслуживание** — `service_percent` bo‘lsa ko‘rsatiladi (`_formatServicePercent`).
- **To‘langan / bekor (`paid`, `cancelled`) — «terminal»**:
  - «Закрыть» va tahrir yo‘q, faqat yangilash;
  - oshxona tablari yashiriladi;
  - pozitsiya bo‘lsa — o‘qish rejimi;
  - pozitsiya bo‘lmasa — `_TerminalOrderEmptyBody` (status, jami, izoh).
- **`showCloseForm()`** — terminal buyurtmada chaqirilsa ham ishlamaydi.

**Fayl:** `bill_detail_panel.dart`, `open_order_model.dart` (`isTerminalOrderStatus`).

---

## 4. «Закрыть счет» modali (`_CloseOrderView`)

- Pozitsiyalar **`WaiterCubit.orderLineItems`** dan (server), `DetailBloc` savati emas.
- **Jami / xizmat:** `kOpenOrderServiceFeeZeroPercent` (constants) — vaqtincha xizmat 0% hisoblanishi; jami uchun mantiq shu bayroqqa bog‘liq.
- **To‘lov:** avval `customer_paid_amount: "0"` yuborilardi — backend **insufficient payment** qaytardi.
- **Tuzatish:** `Способ оплаты` — Наличные / Карта / QR; `payment_type` = `cash` | `card` | `qr`.
- **`customer_paid_amount`** — `order.total_amount` (mavjud bo‘lsa), aks holda faol qatorlar yig‘indisi (`_payAmountSom`).

**Fayllar:** `bill_detail_panel.dart` (`_CloseOrderView`, `_PaymentTypeChip`), `waiter_cubit.dart` (`closeOrder(PaymentType)`).

---

## 5. Smena va navigatsiya

- **Muammo:** kassir kirganda avval **Smena** ochilardi.
- **Sabab:** `ShiftBloc._checkShift` — smena yo‘q bo‘lsa `closeShiftScreen` ga `pushNamed`.
- **Tuzatish:** **`UserRole.cashier`** uchun bu avtomatik o‘tish **o‘chirildi**; kassir **Stollar** (`mainScreen` / `WaiterScreen`) da qoladi; smenani sidebar orqali ochadi.

**Fayl:** `shift_bloc.dart`.

---

## 6. Order line items (`good_name`)

- API `GET .../order-items/order/{id}` javobida **`good_name`** maydoni.
- Modelda allaqachon `good_name` ustuvor o‘qildi; qo‘shimcha: `_stringField` — bo‘sh / noto‘g‘ri tip uchun xavfsiz parse.

**Fayl:** `order_line_item/order_line_item_model.dart`.

---

## 7. Arxiv (`ArchivesBloc`)

- **Xato:** `Cannot add new events after calling close` — ekran yopilgandan keyin async javob `emit` / `add` chaqirardi.
- **Tuzatish:** `await` dan keyin va `fold` ichida **`if (isClosed) return;`**.

**Fayl:** `archives_bloc.dart` (`_getArchived`, `_getArchiveDetail`).

---

## 8. Ulangan qismlar (texnik)

| Komponent | Bloc / API |
|-----------|------------|
| Ro‘yxat va detal | `WaiterCubit`, `MainCubit`, `UserBloc` |
| Menyu / savat | `DetailBloc` |
| To‘lov yopish | `POST /api/v1/orders/{id}/pay` |
| Pozitsiyalar | `GET /api/v1/order-items/order/{orderId}` |
| Buyurtmalar | `GET /api/v1/orders` (kassir), `GET /api/v1/orders/my` (ofitsiant) |

---

## 9. Konstanta (eslatma)

`lib/core/constants/constants.dart`:

- `kOpenOrderServiceFeeZeroPercent` — ochiq buyurtma **yopish** ekranida jami hisoblash uchun xizmatni vaqtincha 0% deb olish; **to‘lov** (`pay`) esa `total_amount` / qatorlar bo‘yicha haqiqiy summa yuboradi.

---

## 10. Hujjatlar

Ushbu fayl loyihadagi **`docs/`** papkasida saqlanadi: `docs/session_summary_2026-04-04.md`.

Keyingi sessiyalar uchun yangi fayl yoki shu faylga qo‘shimcha yozish mumkin.
