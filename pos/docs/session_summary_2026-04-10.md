# Sessiya xulosasi — mary-ai-pos

**Sana:** 2026-04-10  
**Mavzu:** to‘lov/chegirma, schyot yopish UI, printer defaultlari, brand logo, dropdown, hujjatlar.

Quyida shu kunda muhokama qilingan va koddagi o‘zgarishlar (commitlar bilan) qisqacha.

---

## 1. Smena / Mebel uslubi (reja)

- **Hozir:** Mary AI backend kontraktiga mos (`POST .../close` body bilan).
- **Kelajak:** `docs/plan.md` → **§6. Smena / Shift — Mebel House uslubi (kelajak reja)** — dialog (Ha/Yo‘q), sidebar rollari, Mebel vs Mary API farqi.
- **Qaytarilgan:** smena ekranidagi tasdiqlash dialogi va sidebar’da «Smena»ni rollar bo‘yicha yashirish (avval qo‘shilgan edi, keyin qaytarildi).

---

## 2. To‘lov va chegirma (API)

- **Chegirma kalitlari** — faqat haqiqiy chegirma bo‘lganda (`> 0`): `discount_amount`, `discount_percent`, `discount_comment` yuborilmaydi, agar ikkalasi ham 0.
  - `PaymentPayRequestModel.request()`
  - `WaiterCubit.closeOrder` body
- **`customer_paid_amount`** — **chegirmadan oldingi to‘liq jami** (backend talabi); chegirma alohida `discount_*` da.
  - `WaiterCubit.closeOrder` — `base.round()` (qatorlar / `total_amount`)
  - `PaymentBloc` — `grandTotal + hourPrice` (naqd/karta farqi yo‘q, `enterSum` emas)

---

## 3. «Закрыть счет» / `BillDetailPanel`

- **Vaqt bo‘yicha stol** — `kOpenOrderServiceFeeZeroPercent == true` bo‘lganda jami faqat qatorlar yig‘indisi edi; vaqt summasi yo‘qolardi.
  - **`_grandTotalForCloseOrder`** — `table_type == time_based` va API jami `> 0` bo‘lsa, `totalAmountValue` ishlatiladi.
- **Chegirma qatori overflow** — `Row` o‘rniga `Column`, keyin `crossAxisAlignment: start`.
- **Sum kiritish** — **`SumThousandsInputFormatter`** (`app_formatter.dart`): masalan `10000` → `10 000`; parse `RegExp(r'\s')` bilan.
- **Fayllar:** `bill_detail_panel.dart`, `app_formatter.dart`

---

## 4. Yangi hisob — stol dropdown

- **Muammo:** `DropdownButton` assert — tanlangan `CafeTableModel` ro‘yxatdagi obyekt bilan `==` bo‘lmasligi (`copyWith(status)` yangilanishi).
- **Yechim:** joriy `tables` dan **`id` bo‘yicha** topish, takroriy `id` ni **dedupe** qilish, kerak bo‘lsa `PostFrameCallback` da `_selectedTable` ni sinxronlash.
- **Fayl:** `create_bill_form.dart`

---

## 5. Brand logo va Windows ikonka

- **`BrandLogo`** (`lib/core/widgets/brand_logo.dart`) — `mary_logo.png`, xato bo‘lsa **`ic_logo.svg`**.
- **Splash, login, `AppSidebar`** — `BrandLogo` ga o‘tkazildi.
- **`dart run flutter_launcher_icons`** — `windows/runner/resources/app_icon.ico` yangilandi (taskbar uchun qayta build shart).

---

## 6. Printer (default va backend)

- **Defaultlar** (`PrinterConfigStorage`, prefs bo‘sh bo‘lsa):

```json
{
  "cashier_printer_ip": "192.168.123.100",
  "kitchen_printer_ip": "192.168.1.222",
  "printer_port": 9100
```

- **Backend:** `GET api/v1/settings/printer` — `UserBloc` ichida `getUser` muvaffaqiyatidan keyin `SyncPrinterSettingsUsecase` → `applyFromApi` → SharedPreferences (faqat to‘ldirilgan maydonlar).
- **Chek qachon:** kassir cheki — schyot **muvaffaqiyatli yopilganda** (`printCashierReceipt`, bo‘sh qatorlar bo‘lmasa); oshxona — **`sendItems` OK**; smena — yopish/chop etish oqimi. TCP ulanmasa — ovozsiz, `debugPrint`.

---

## 7. Git (asosiy commitlar, tartibsiz)

- `fix(waiter/payment): ...` — chegirma body, `customer_paid_amount`, vaqt stoli jami, chegirma formati, `CreateBillForm` dropdown.
- `feat(brand): BrandLogo ...` — SVG fallback, Windows `app_icon.ico`.

---

## 8. Eslatmalar

- Eski **SharedPreferences** printer IP saqlagan bo‘lsa, kod defaultlari o‘rniga saqlangan qiymat ishlatiladi.
- Windows’da yangi ikonka uchun **`flutter clean` / qayta `build windows`** tavsiya etiladi.
