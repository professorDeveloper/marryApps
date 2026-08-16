# Mary AI POS — Muammolar va Yaxshilanishlar

> Sana: 2026-03-27
> Holat: Tahlil qilingan, bajarilishi kerak

---

## 🔴 CRITICAL — Ishlamaydigan narsalar

### 1. `fcm_token` comment qilingan — Login to'liq ishlamaydi
- **Fayl:** `lib/features/view/auth/data/models/login/request/login_request_model.dart:10`
- **Fayl:** `lib/features/view/auth/presentation/cubit/login_pin/login_pin_cubit.dart:27, 34`
- **Muammo:** Server `fcm_token` ni talab qilishi mumkin. Swagger da `fcm_token` bilan ishlagan, ilovada yo'q.
- **Yechim:** Firebase Messaging integratsiya qilish va `fcm_token` ni so'rovga qo'shish.
- **Holat:** [ ] Bajarilmagan

---

### 2. Notification screen — to'liq MOCK (soxta) data
- **Fayl:** `lib/features/view/main/presentation/pages/notification/notification_screen.dart:28-35`
- **Fayl:** `lib/features/view/main/presentation/cubit/notification/notification_bloc.dart:54-61`
- **Muammo:**
  - `_items` — 18 ta hardcoded soxta bildirishnoma
  - `_onGetNotifications` ichida hech qanday API chaqiruvi yo'q, faqat `SUCCESS` emit qiladi
  - Real API endpoint umuman ulangan emas
- **Yechim:** Notification uchun API endpoint qo'shish, `NotificationBloc` ni real datasource ga ulash.
- **Holat:** [ ] Bajarilmagan

---

### 3. `cashier_id` va `cash_register_id` comment qilingan
- **Fayl:** `lib/features/view/main/data/models/create_order/create_order_request_model.dart:25`
- **Fayl:** `lib/features/view/main/data/models/payment_pay_request/payment_pay_request_model.dart:32-33`
- **Muammo:** Buyurtma yaratish va to'lov qilishda `cashier_id`, `cash_register_id` serverga yuborilmaydi.
- **Yechim:** UserBloc/storage dan cashier ID ni olib, so'rovga qo'shish.
- **Holat:** [ ] Bajarilmagan

---

### 4. Category bo'yicha mahsulot olishda response parsing xatosi
- **Fayl:** `lib/features/view/main/data/data_source/main_datasources.dart:440`
- **Muammo:** `getGoodsByCategoryId` (category bo'yicha) `response.data as List` ishlatadi, boshqa barcha endpointlar `response.data['data']` ishlatadi. Response format mos kelmasa crash bo'ladi.
- **Yechim:** `response.data['data'] as List` ga o'zgartirish (yoki API response ni tekshirib to'g'rilash).
- **Holat:** [ ] Bajarilmagan

---

### 5. `createOrder` (band stol) — DioClient interceptor bypass qilingan
- **Fayl:** `lib/features/view/main/data/data_source/main_datasources.dart:271`
- **Muammo:** Band stol uchun buyurtma qo'shishda `_client.dio.post(...)` ishlatilgan — token interceptor va error handling ishlamaydi.
- **Yechim:** `_client.post(...)` ga o'zgartirish.
- **Holat:** [ ] Bajarilmagan

---

## 🟡 WARNING — Yarim ishlaydigan narsalar

### 6. Splash screen — navigation comment qilingan
- **Fayl:** `lib/features/view/auth/presentation/pages/splash/splash_screen.dart:57`
- **Muammo:** `// Navigator.pushReplacementNamed(context, AppRoutes.mainScreen)` comment qilingan. Navigatsiya `UserBloc` ichidan bajariladi — bu noto'g'ri pattern (Bloc ichida UI navigatsiyasi).
- **Yechim:** Navigatsiyani `SplashScreen` ichiga qaytarish, `UserBloc` dan olib tashlash.
- **Holat:** [ ] Bajarilmagan

---

### 7. ListAPI — URL formatida nomuvofiqlik
- **Fayl:** `lib/core/api/list_api.dart`
- **Muammo:** Ba'zi URLlar `/api/v1/...` (boshida `/` bor), ba'zilari `api/v1/...` (yo'q). Dio `baseUrl` bilan birlashtirganida noto'g'ri URL hosil bo'lishi mumkin.
- **Misol:**
  - `halls = "api/v1/halls"` — to'g'ri
  - `goods = "/api/v1/goods"` — noto'g'ri (boshida `/`)
  - `orders = "/api/v1/orders"` — noto'g'ri
- **Yechim:** Barcha URLlardan boshidagi `/` ni olib tashlash.
- **Holat:** [ ] Bajarilmagan

---

### 8. Shift tekshiruvi faqat admin uchun ishlaydi
- **Fayl:** `lib/features/view/main/presentation/pages/main/main_screen.dart:30`
- **Muammo:** `UserRole.admin` bo'lsa shift tekshiriladi, cashier va boshqa rollar uchun tekshirilmaydi.
- **Yechim:** Shift tekshirishni cashier uchun ham qo'shish (yoki backend bilan kelishib rol mantiqini aniqlashtirish).
- **Holat:** [ ] Bajarilmagan

---

### 9. `setPin` logikasida xato
- **Fayl:** `lib/features/view/auth/presentation/cubit/login_pin/login_pin_cubit.dart:62`
- **Muammo:** `value.length < 6` sharti har doim `true` (chunki `value` doim 1 ta belgi — raqam yoki `⌫` yoki `✓`). Max pin uzunligi to'g'ri tekshirilmayapti.
- **Yechim:** `pinUpdated.length < 6` ga o'zgartirish (yangilangan pin uzunligini tekshirish).
- **Holat:** [ ] Bajarilmagan

---

### 10. `TECHNICAL_SUPPORT_URL` bo'sh
- **Fayl:** `lib/core/constants/constants.dart:13`
- **Muammo:** `const TECHNICAL_SUPPORT_URL = ''` — texnik yordam URL si ko'rsatilmagan.
- **Yechim:** Haqiqiy URL qo'yish.
- **Holat:** [ ] Bajarilmagan

---

### 11. `getGoodsWithName` — search response format noto'g'ri bo'lishi mumkin
- **Fayl:** `lib/features/view/main/data/data_source/main_datasources.dart:470`
- **Muammo:** `response.data as List` ishlatilgan — server `{"data": [...]}` qaytarsa crash bo'ladi.
- **Yechim:** API response formatini tekshirib, `response.data['data']` yoki `response.data` ekanini aniqlashtirish.
- **Holat:** [ ] Bajarilmagan

---

### 12. `checkShift` — barcha xatolarni yashiradi
- **Fayl:** `lib/features/view/main/data/data_source/main_datasources.dart:174`
- **Muammo:** `catch (e)` barcha xatolarni ushlab `Right(null)` qaytaradi — network xatosi ham "smena yo'q" deb qabul qilinadi.
- **Yechim:** Kamida `DioException` ni alohida handle qilish.
- **Holat:** [ ] Bajarilmagan

---

## 🟢 FEATURE — Qo'shish mumkin bo'lgan funksiyalar

### F-1. Firebase FCM Push Notification
- **Tavsif:** `firebase_messaging` paketi qo'shib, `fcm_token` ni login so'roviga ulash.
- **Bog'liq:** Muammo #1
- **Holat:** [ ] Bajarilmagan

---

### F-2. Real Notification API integratsiyasi
- **Tavsif:** Bildirishnomalar uchun API endpoint qo'shish, `NotificationBloc` ni datasource ga ulash, soxta datani o'chirish.
- **Bog'liq:** Muammo #2
- **Holat:** [ ] Bajarilmagan

---

### F-3. Printer (chek chiqarish) integratsiyasi
- **Tavsif:** `ic_printer.svg` icon va UI elementi bor, lekin chek chiqarish logikasi yo'q. Windows printer yoki Bluetooth printer bilan integratsiya qilish.
- **Holat:** [ ] Bajarilmagan

---

### F-4. QR to'lov
- **Tavsif:** `PaymentType.qr` enum mavjud, lekin QR to'lov UI va logikasi yo'q.
- **Holat:** [ ] Bajarilmagan

---

### F-5. Offline rejim
- **Tavsif:** Internet yo'q bo'lganda `SavedOrdersBloc` orqali buyurtmalarni saqlash va ulanganida sync qilish.
- **Holat:** [ ] Bajarilmagan

---

### F-6. Waiter / Kitchen role UI
- **Tavsif:** `UserRole` enum da `waiter` va `kitchen` rollari bor, lekin ular uchun alohida sahifa yo'q. Oshpaz ekrani (tayyorlanishi kerak buyurtmalar) va ofitsiant ekrani.
- **Holat:** [ ] Bajarilmagan

---

### F-7. Smenalar tarixi va hisoboti
- **Tavsif:** Faqat joriy smena ko'rsatiladi. O'tgan smenalar tarixi va yig'ma hisobot (naqd/karta) ko'rsatish.
- **Holat:** [ ] Bajarilmagan

---

## Ustuvorlik tartibi

| Ustuvorlik | # | Muammo |
|---|---|---|
| 1 | #5 | `createOrder` DioClient bypass — tezda tuzatish |
| 2 | #7 | URL format nomuvofikligi — tezda tuzatish |
| 3 | #9 | `setPin` logika xatosi — tezda tuzatish |
| 4 | #4 | Category goods parsing xatosi |
| 5 | #3 | `cashier_id` ni qo'shish |
| 6 | #1 | FCM token integratsiya |
| 7 | #2 | Notification real API |
| 8 | #6 | Splash navigation refactor |
| 9 | F-3 | Printer integratsiya |
| 10 | F-4 | QR to'lov |
