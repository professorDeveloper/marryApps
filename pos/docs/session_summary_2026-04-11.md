# Sessiya xulosasi — mary-ai-pos (to‘liq)

**Sana:** 2026-04-11  
**Maqsad:** Foydalanuvchi bergan barcha promptlar, assistant javoblari va kod o‘zgarishlari bir joyda, keyinroq o‘qish uchun to‘liq yozuv.

---

## A. Foydalanuvchi bergan promptlar (tartib bo‘yicha)

### 1) Birinchi asosiy so‘rov (o‘zbekcha, bitta xabarda bir nechta vazifa)

Foydalanuvchi taxminan quyidagilarni so‘radi (matn mazmuni bo‘yicha):

- **Cheklarda hamma yozuvlar rus tilida bo‘lsin:** masalan «Stol» ruschada bo‘lsin va **stol raqami** ham ko‘rsatilsin; «Mehmon» ham ruscha; boshqalar ham.
- **POS tili hamma joyda rus tilida** bo‘lsin.
- **Yangi schyot:** zal va stol tanlanganda **band stol** (ochiq buyurtmasi bor stol) tanlanmasin.
- **Summa 0 bo‘lsa ham «Oplatit» ishlashi kerak:** mijoz ovqat buyurtma qiladi, tayyor bo‘ladi, keyin hammasini cancel qiladi — stol summasi 0, stol ochiq qolmasin; hozircha mahsulot «urib» keyin yopish majburiyati bo‘lmasin.
- **API dan kelgan xato xabarlarini overlay** da ko‘rsatish kerak.

### 2) Skrinshot: `GET /api/v1/users` → 403

- Savol mazmuni: **«Mana bu apini nima uchun ishlatyapmiz»** — tarmoqda `/api/v1/users` so‘rovi va 403 ko‘rsatilgan.

### 3) Users API ni vaqtincha o‘chirish

- **«Bu apini commentga olib tur»** — `GET /api/v1/users` chaqiruvini komment / ishlatmaslik.

### 4) Table timer API

- **«`/api/v1/orders/.../table-timer` shu apiga stol time based bo‘lmasa murojaat qilmaslik kerak, hozir murojaat qilyapti»`**

### 5) Git

- **«Barcha o‘zgarishlarni gitga push qil»**

### 6) Repoda summary

- **«Yuq repoda bo‘laversin, bugungi summaryni ham yaratib push qil»** — xulosa fayli repoda qolsin, bugungi uchun yaratilsin va push qilinsin.

### 7) To‘liq hujjat

- **«To‘liq yoz. Bugun nima qilindi, sanga qanday prompt berdim, san nima qilding hammasini to‘liq yozish kerak»** — shu faylning kengaytirilgan varianti (ushbu bo‘limlar B–F).

---

## B. Assistant nima qildi — birinchi promptga javob (kod)

Quyidagilar loyihada amalga oshirildi (fayllar / mantiq).

### B1. Printer cheklari — rus matnlar

- **`lib/core/service/printer/receipt/cashier_receipt_builder.dart`**  
  Sarlavha, zal/stol/mehmon (Гости), ustunlar (Блюдо, Кол, Сумма), итого, обслужение, скидка, «К ОПЛАТЕ», footer «Спасибо за покупку!» va xizmat foizi yozuvlari ruschaga.
- **`kitchen_receipt_builder.dart`** — «КУХОННЫЙ ЧЕК», Стол, Зал, Гостей.
- **`shift_close_receipt_builder.dart`** — smena yopish, кассир, смена, терминал, карта, сум, ogohlantirishlar ruscha.
- **`receipt_notice_lines.dart`** — chekda qayta tayyorlamaslik haqidagi ogohlantirishlar ruscha.

### B2. Ilova tilining defaulti — rus

- **`settings_state.dart`** — `@Default('ru') String language`.
- **`login_repository_impl.dart`** — saqlangan til bo‘lmasa `?? 'ru'`.
- **`dart run build_runner build`** — `settings_cubit.freezed.dart` ichidagi default til `ru` bo‘lishi uchun.

### B3. Yangi schyot — band stol tanlanmasin

- **`create_bill_form.dart`**  
  - `WaiterCubit.openOrders` + `MainCubit` stollari bilan: ochiq va terminal bo‘lmagan buyurtma uchun **busy** stol `table_id` yoki `hall_name` + `table_number` bo‘yicha aniqlanadi.  
  - Dropdown faqat **bo‘sh** stollarni ko‘rsatadi.  
  - Tanlangan stol band bo‘lib qolsa, `PostFrameCallback` orqali tanlov sinxronlanadi.

### B4. Summa 0 — schyotni yopish («Оплатить»)

- **`waiter_cubit.dart` — `closeOrder`**  
  Oldin `base <= 0` bo‘lsa xato va return. Keyin: faqat `base < 0` xato; `customer_paid_amount` **`'0'`** yuborilishi mumkin (`clamp` bilan musbat chegarasi).
- **`printer_service.dart` — `printCashierReceipt`**  
  Avval `items.isEmpty` bo‘lsa return; olib tashlandi — barcha qatorlar bekor bo‘lsa ham chek oqimi ishlaydi (agar printer konfiguratsiyasi ruxsat bersa).
 
### B5. API xatoliklari — overlay

- **Yangi fayl:** `lib/core/api/api_error_overlay.dart`  
  `navigatorKey` orqali `OverlayEntry`: qizil fon, xato matni, yopish tugmasi, ~12 s keyin o‘zi yopiladi.
- **`dio_interceptor.dart`**  
  `DioException` da `response` bo‘lsa, status **≥ 400**, lekin **401** va **`ListAPI.refresh`** yo‘li uchun overlay **chiqarilmaydi**; qolganlarida `data` dan `message` / `detail` / `error` olinadi va overlay chaqiriladi (403 jumladan).

### B6. Ofitsiant UI — qisman rus

- **`bill_detail_panel.dart`**  
  Bo‘sh panel matni, «Скидка», «К оплате», «Оплатить ✓», summa suffix «сум», chegirma turidagi «Сумма» tab — ruscha/qulayroq variantlar.

### B7. Boshqa (shu commitda bo‘lgan, avvalgi sessiyadan kelgan o‘zgarishlar)

Push qilingan umumiy diffda printer konfiguratsiyasi, `pubspec`, `di`, `main`, `flush_bars`, `list_api`, `user_bloc`, repository/usecase o‘zgarishlari ham bor edi — ular bitta katta commitda `main` ga ketgan.

---

## C. Users API haqida savol — assistant javobi (tushuntirish)

- **`GET /api/v1/users`** ilovada filial **foydalanuvchilari ro‘yxati** uchun: keyin kod **`waiter` roliga** filtrlash (`GetStaffWaitersUsecase`).
- **Maqsad:** «Новый счет» formasidagi **официант** tanlovi va `POST /orders` da **`waiter_id`** yuborish.
- **403** — joriy token/rol uchun server ushbu endpointga ruxsat bermayapti; yechim odatda backendda rol yoki alohida waiters endpoint.

---

## D. «Commentga olib tur» — users API

- **`main_datasources.dart` — `getUsers()`**  
  Haqiqiy `_client.get(ListAPI.users)` **ishlamaydi**; darhol `Right(<UserModel>[])` qaytariladi.  
  Asl `try/catch` bloki **`/* Qayta yoqish: ... */`** ichida saqlangan.

**Oqibat:** ofitsiantlar ro‘yxati bo‘sh; `waiter_id` ko‘pincha `null` ketishi mumkin — backend qabul qilishini tekshirish kerak.

---

## E. Table-timer — faqat time-based

- **`table_timer_cubit.dart` — `bindOrder`**

Oldingi mantiq: `table_type` **aniq berilgan** va `time_based` **emas** bo‘lsa so‘rov yo‘q; lekin `table_type` **null/bo‘sh** bo‘lsa baribir **`fetchTimer`** (GET `.../table-timer`) chaqirilar edi — oddiy stollar uchun ham so‘rov ketardi.

**Yangi mantiq:** faqat **`order.isTimeBasedTable`** (`OpenOrderModel` ichida `table_type` trim + lower == `time_based`) bo‘lsa `_activeOrderId` o‘rnatiladi va GET/periodik sinxron ishlaydi; aks holda state `shouldShow: false` va **HTTP yo‘q**.

**Muhim:** agar vaqt bo‘yicha stol uchun ham API `table_type` yubormasa, taymer UI umuman chiqmaydi — shunda backend buyurtmada `table_type: "time_based"` berishi kerak.

---

## F. Git va hujjatlar

### F1. «Barcha o‘zgarishlarni push qil»

- **`main`** → **`origin/main`** (`Mary-Ai-Group/Mary-Ai-POS`).
- Asosiy commit (xulosadan oldin): **`1cd70c7`** — yuqoridagi POS/receipt/overlay/waiter/timer/users va boshqa fayllar bitta commitda.

### F2. «Bugungi summary yaratib push qil»

- **`docs/session_summary_2026-04-11.md`** yaratildi (dastlab qisqa variant).
- Commit: **`e718d24`** — `docs: session summary 2026-04-11 ...`

### F3. Ushbu yangilanish

- Foydalanuvchi **to‘liq yozuv**ni so‘radi — shu fayl **A–F** bo‘limlari bilan yangilandi: barcha promptlar, assistant harakatlari va fayl nomlari bir joyda.

---

## G. Hali qilinmagan / cheklovlar (shaffoflik)

- **Butun POS** har bir ekranda 100% rus tilida emas: ko‘p joylar `intl_*.arb` yoki boshqa hardcode; qilingani — **default `ru`**, **cheklar**, **qisman ofitsiant paneli**.
- **`GET /users`** hozircha stub — 403 muammosi backend yoki rol bilan hal qilinmaguncha ofitsiant tanlovi ishlamaydi.
- **Overlay** 401 da chiqmaydi (login/refresh shovqinini kamaytirish uchun).

---

*Oxirgi yangilanish: foydalanuvchining «to‘liq yoz» so‘rovi bo‘yicha shu fayl kengaytirildi.*
