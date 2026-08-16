# Mary AI POS — Offline rejim: tahlil va reja

> Sana: 2026-08-07
> Manba: `pos/` (mary_ai_pos), `backend/` (Go/echo/sqlc) tahlili
> Solishtirildi: `biznex_flutter` (offline-first desktop ERP), `biznex-cloud-v2` (cloud + `flutter/packages/{local_db,sync_engine}` + `docs/rules/offline-sync-2026.md`)

---

## 0. Qisqacha xulosa

POS "faqat cloud" emas — offline qatlamning **taxminan 40%i allaqachon yozilgan**
(`CacheService`, `OfflineQueueService`, `ConnectivityCubit`, `OfflineAuthCache`,
`LanHubService`, `OfflineBanner`). Muammo shundaki, bu qatlam **pul yo'qotadigan
dizaynga** ega: navbatdagi offline savdo jimgina o'chib ketishi mumkin, offline
yaratilgan buyurtmani offline to'lab bo'lmaydi, va bitta to'lovni qayta yuborish
serverda **ikkinchi tranzaksiya** yaratadi.

Backendda esa eng qiyin qism allaqachon bor: `POST /api/v1/orders` **client
tomonidan berilgan `id` ni qabul qiladi va o'sha id mavjud bo'lsa mavjudini
qaytaradi** (`backend/app/internal/service/order.go:189-208`) — ya'ni buyurtma
yaratish idempotent. Klient bundan foydalanmayapti.

Shuning uchun reja "noldan offline-first qilish" emas, balki:
**(1) mavjud navbatni pul yo'qotmaydigan qilish → (2) lokal DB ga o'tkazish →
(3) qamrovni kengaytirish**.

---

## 1. Hozir nima ishlaydi (offline)

| Imkoniyat | Fayl | Holat |
|---|---|---|
| Login (brand + parol, PIN) | `core/services/auth/offline_auth_cache.dart` | ✅ ishlaydi |
| Zallar, stollar, kategoriyalar, mahsulotlar | `core/services/cache/cache_service.dart` | ✅ cache-first |
| Barcha mahsulotlarni oldindan yuklash (500 tadan) | `cache_service.dart:118` `prefetchAllGoods` | ✅ 30 daq throttle |
| Yangi buyurtma (dine-in) | `create_order_bloc.dart:168` `_handleOfflineOrder` | ⚠️ navbatga tushadi |
| Mavjud buyurtmaga item qo'shish | shu yerda, `addItems` | ⚠️ navbatga tushadi |
| To'lov | `payment_bloc.dart:238` `_enqueuePayment` | ⚠️ navbatga tushadi |
| Bill ekranida kutayotgan itemlar (⏳ prefiksi) | `detail_bloc.dart:349` | ✅ ko'rinadi |
| Smena ochish/yopish | `shift_bloc.dart:270` | ⚠️ lokal, **serverga yuborilmaydi** |
| Stol holatini LAN orqali tarqatish | `core/services/lan_hub/` | ✅ faqat status |
| Offline banner + qayta ulanishda sync | `core/widgets/app_scaffold.dart:42` | ⚠️ faqat shu joyda |

Non-GET so'rovlar offline paytda `_OfflineInterceptor` (`dio_client.dart:196`)
tomonidan darhol rad etiladi — bu to'g'ri yondashuv, timeout kutilmaydi.

---

## 2. Kritik kamchiliklar (pul yo'qotish xavfi)

### 2.1 🔴 Har qanday 4xx navbatdagi savdoni **o'chirib yuboradi**

`offline_queue_service.dart:106` `_isTerminalError` — 400..499 oralig'idagi
har qanday javob "terminal" deb qaraladi va operatsiya navbatdan `delete`
qilinadi. Xabar yo'q, dead-letter yo'q, kassir hech narsa ko'rmaydi.

Bu biznex-cloud-v2 da **2026-07-29 da real hodisaga** aylangan (rules §3):
"The Eyfel kafesi" 2s26d internetsiz qoldi, 42 ta to'langan savdo
(5,953,868 dan 1,193,039 UZS) cloudga umuman yetib bormadi. Ularning xulosasi:

- **poison** (doimiy 4xx — noto'g'ri payload) → dead-letter
- **transient** (5xx, timeout — server javob berdi) → attempt sanaladi
- **unreachable** (`DioException.response == null` — DNS/tarmoq) → attempt
  **sanalmaydi**, faqat kechiktiriladi

Hozir POS da uchalasi ham bitta `catch (e)` ichida.

### 2.2 🔴 Offline buyurtmaning IDsi yo'q → offline to'lab bo'lmaydi

`_handleOfflineOrder` `CreateOrderRequestModel` ni `id` siz navbatga qo'yadi.
Natijada:

- `payment_bloc._enqueuePayment` `state.detail!.id` ni talab qiladi — offline
  yaratilgan buyurtmada bunday id yo'q → **offline yaratilgan stolni offline
  to'lash mumkin emas**;
- ack yo'qolgan holda qayta yuborish **ikkinchi buyurtma** yaratadi;
- `addItems` esa serverdan `_getOpenOrderIdByTable` bilan qidiriladi — offline
  buyurtma hali serverga chiqmagan bo'lsa `''` qaytadi va operatsiya
  **o'chiriladi** (`offline_queue_service.dart:51-55`).

Yechim tayyor turibdi: backend `req.ID` ni qabul qiladi va mavjud bo'lsa
mavjudini qaytaradi (replay-return). Klient UUID ni **bir marta** generatsiya
qilib, retrylar bo'ylab saqlashi kerak (rules §1).

### 2.3 🔴 To'lovni qayta yuborish serverda dublikat tranzaksiya yaratadi

`backend/app/internal/service/order.go:1230` `MarkOrderPaid` — replay guard yo'q.
Har chaqiruvda `CreateTransaction` (`:1260`, `ID: uuid.New()`) yangi qator
yozadi. Offline navbat ack yo'qotib qayta yuborsa — bitta savdo hisobotda
**ikki marta** ko'rinadi.

Backend tomonida kerak: `client_payment_id` (yoki `Idempotency-Key`) + unique
constraint + replay-return, xuddi order create dagidek.

### 2.4 🔴 Offline smena hech qachon serverga chiqmaydi

`shift_bloc.dart:146` — "Smena yopildi (offline ochilgan, serverga
yuborilmaydi)". Ya'ni offline o'tgan butun smenaning Z-hisoboti yo'qoladi.
biznex rules §5: avtomatik yopilgan smenaga `actualCash`/`variance` **hech
qachon to'qib chiqarilmaydi** — lekin uni yuborish kerak.

### 2.5 🟡 Sync tartibi vaqt bo'yicha emas, tur bo'yicha

`syncAll` avval barcha `createOrder`, keyin barcha `addItems`, keyin barcha
`payOrder` ni yuboradi. Bir stol uchun "yarat → qo'sh → to'la" ketma-ketligi
boshqa stolning operatsiyalari bilan aralashadi; `payOrder` esa `addItems`
muvaffaqiyatsiz bo'lgan holatda ham ketaveradi → **kam summaga to'lov**.

### 2.6 🟡 Drain faqat bitta joyda ishga tushadi

`app_scaffold.dart:42` — connectivity stream. Ilova ochilganda (boot) drain
yo'q, davriy (periodic) drain yo'q, `AppScaffold` mount bo'lmagan ekranlarda
(login, splash, payment) yo'q. biznex rules §3: dead-letterlarni reconnect da
tiklash kerak, faqat bootda emas.

### 2.7 🟡 Kassir yo'qotishni ko'rmaydi

`OfflineBanner` faqat "internet yo'q" deydi. `pending` (hali yuborilmagan =
qarz) va `deadLetter` (voz kechilgan = yo'qotish) ajratilmagan (rules §4).

---

## 3. Saqlash qatlamining zaifligi

1. **Cache — bitta katta JSON blob.** `cache_service.dart` butun ro'yxatni
   `jsonEncode` qilib bitta Hive kalitiga yozadi (read → modify → write).
   Parallel yozuvlar bir-birini o'chiradi. biznex NC-6 aynan shu edi —
   yechim: har yozuv alohida qator (drift/SQLite).
2. **`SharedPreferences` Windows da crash-safe emas** (rules §6). POS
   kompyuteri rozetkadan o'chiriladi; `shared_preferences_windows` faylni
   joyida qayta yozadi → NUL bilan to'lgan fayl → `SharedPreferences
   .getInstance()` ichida `FormatException` → ilova umuman ochilmaydi.
   biznex da `CrashSafePrefsStore` (temp → flush → rename) bor. POS da
   `AppTokenStorage`, `OfflineAuthCache`, `ShiftBloc` lokal smenasi,
   `LanHubService` — barchasi `SharedPreferences` da.
3. **Buyurtmalar uchun lokal jadval yo'q.** Stol billi faqat online paytda
   cache'langan bo'lsa ko'rinadi; offline yaratilgan buyurtma esa faqat
   navbat orqali "⏳" sifatida ko'rsatiladi.

---

## 4. Offline qamrovi: nima yo'q

| Amal | Offline holati |
|---|---|
| Takeaway buyurtma | ❌ kodda ochiq "always requires online" (`create_order_bloc.dart:59`) |
| Item bekor qilish / o'chirish | ❌ |
| Stolni ko'chirish (transfer) | ❌ |
| Chegirma / service charge o'zgartirish | ❌ |
| Arxiv (savdo tarixi) | ❌ cache yo'q |
| Smena ochish/yopish sync | ❌ (2.4) |
| Soatlik narx / stol taymeri | ❌ |
| Printer sozlamalari sync | ❌ |
| Chek chiqarish | ✅ lokal ESC/POS, internetga bog'liq emas |

---

## 5. Solishtirish: biznex ikki loyihasi

| | `biznex_flutter` | `biznex-cloud-v2` | `MaryApps/pos` |
|---|---|---|---|
| Asos | offline-first (lokal birinchi) | cloud + offline outbox | cloud-first |
| Lokal DB | Isar + Hive | **drift/SQLite** (`packages/local_db`) | Hive JSON blob |
| Sync | `cloud_synchronising_controller`, `order_sync_service` | `sync_engine` + `outbox_pusher/drainer/reconciler/sweeper` | `offline_queue_service` (1 fayl, 117 qator) |
| Idempotentlik | — | key bir marta, retrylarda saqlanadi, body `id` | ❌ |
| Dead-letter | — | bor + kassirga banner | ❌ (jimgina o'chiradi) |
| Reconciliation | — | manifest sweep (deep + incremental) | ❌ |
| LAN | to'liq lokal server (`shelf_router`, WS, 9 ta route) | alohida `server` app (LAN authority) | faqat stol statusi broadcast |

`biznex-cloud-v2/docs/rules/offline-sync-2026.md` (276 qator) — bu real
pul yo'qotish hodisalaridan chiqarilgan checklist. POS uchun to'g'ridan-to'g'ri
qo'llasa bo'ladi; oxiridagi "Checklist for offline/sync work" bo'limini har PR
ga ko'chirish tavsiya etiladi.

**Muhim farq:** `biznex_flutter` da bitta kompyuter lokal server bo'lib ishlaydi
va boshqa terminallar unga ulanadi — internet umuman shart emas. `MaryApps/pos`
da `LanHubService` faqat stol statusini tarqatadi, ya'ni ikkita terminal offline
paytda **bitta stolga ikkita buyurtma** yaratishi mumkin. Agar restoranlarda
2+ terminal bo'lsa, bu alohida hal qilinishi kerak masala.

---

## 6. Reja

### Faza 1 — Pul yo'qotishni to'xtatish (1–2 hafta, eng yuqori ustuvorlik)

Mavjud arxitekturani buzmasdan, faqat `OfflineQueueService` ni qayta yozish.

1. `PendingOperation` ga maydonlar qo'shish: `attempts`, `lastError`,
   `nextAttemptAt`, `status` (`pending|deadLetter`), `idempotencyKey`.
2. `PushResult` ni uch sinfga ajratish:
   `success | poison(4xx javob bor) | transient(5xx/timeout) | unreachable(response == null)`.
   `unreachable` da `attempts` **oshirilmaydi**.
3. Poison → `deadLetter` ga o'tkaziladi, **o'chirilmaydi**. Dead-letterlar
   sozlamalarda ko'rinadigan ro'yxat + qayta yuborish tugmasi.
4. Offline buyurtmaga klient UUID berish (`create_order_bloc`), `payload['id']`
   sifatida yuborish → backend replay-return ni ishlatadi. Shu UUID
   `addItems` va `payOrder` uchun ham order id bo'ladi → `_getOpenOrderIdByTable`
   bo'yicha qidirish olib tashlanadi.
5. `syncAll` ni **stol bo'yicha zanjir** qilish: bitta stolning operatsiyalari
   `createdAt` bo'yicha ketma-ket; oldingisi muvaffaqiyatsiz bo'lsa keyingisi
   yuborilmaydi (ayniqsa `payOrder`).
6. Drain nuqtalari: boot (`initDi` dan keyin), connectivity restore, har 60s
   davriy timer, va navbatga yozilganda darhol (agar online).
7. Banner: `pending` (sariq, "N ta yuborilmagan") va `deadLetter` (qizil,
   "N ta savdo yuborilmadi") alohida.

Backend (parallel):

8. `POST /orders/:id/pay` ga `client_payment_id` + unique constraint +
   replay-return qo'shish (2.3).
9. `POST /order-items` ga ham client `id` / replay-return (hozir dublikat
   item qo'shilishi mumkin).

### Faza 2 — Ishonchli saqlash (1 hafta)

10. `CrashSafePrefsStore` ekvivalentini portlash (biznex
    `packages/core/lib/utils/crash_safe_prefs_store.dart`) — Windows da
    `main()` boshida o'rnatiladi. Bu **eng arzon va eng katta ta'sirli** ish:
    ilova umuman ochilmay qolishining oldini oladi.
11. Hive `pos_cache` blobini `drift` jadvallariga ko'chirish (goods, tables,
    halls, categories, order_detail) — har yozuv alohida qator.
    Muqobil (arzonroq): Hive box ichida kalit-per-yozuv, `jsonEncode(list)`
    o'rniga. Drift'ga o'tish uzoq muddatda to'g'ri, chunki Faza 3 uchun ham kerak.

### Faza 3 — Offline qamrovni kengaytirish (2–3 hafta)

12. Lokal `orders` + `order_items` jadvali → offline yaratilgan buyurtma bill
    ekranida to'liq ko'rinadi (⏳ hack o'rniga).
13. Smenani offline ochish/yopish + sync (2.4), fabrikatsiyasiz.
14. Takeaway offline (12 dan keyin oson bo'ladi).
15. Item bekor qilish, transfer, chegirma → outbox operatsiya turlari.
16. Arxivni cache'lash (oxirgi N kun).

### Faza 4 — Reconciliation (1 hafta)

17. Backendga manifest endpoint: `GET /api/v1/orders/manifest?since=...` →
    `[{id, updated_at}]`. Klient lokal `cloud_lsn IS NULL` bo'lgan
    buyurtmalarni solishtiradi, yo'qolganini qayta yuboradi (rules §8).
18. Deep pass — o'z timeri bilan (boot va smena yopishda emas, chunki
    haftalab ochiq turgan terminal hech qachon ishga tushirmaydi).

### Faza 5 — LAN authority (agar 2+ terminal bo'lsa; 2–3 hafta)

19. `biznex_flutter/lib/src/server/` yoki `biznex-cloud-v2/flutter/apps/server`
    modelida: bitta terminal LAN server, qolganlari klient. Buyurtma IDsi va
    stol bandligi bir joydan beriladi → offline konflikt yo'q.
20. LAN endpointlari cloud JWT ni **tekshiradi** (rules §7) — hozirgi
    `lan_hub_server` da autentifikatsiya umuman yo'q.

---

## 7. Har PR uchun checklist

`biznex-cloud-v2/docs/rules/offline-sync-2026.md` oxiridagi ro'yxatdan
POS ga tegishlilari:

- [ ] Idempotency key bir marta generatsiya qilinadi va retrylar bo'ylab
      saqlanadi; body ichida `id` sifatida ketadi; backend unique constraint
      bilan replay qaytaradi.
- [ ] `unreachable` (HTTP javob yo'q) `attempts` ni oshirmaydi; faqat poison
      dead-letter bo'ladi; dead-letterlar reconnect da tiklanadi.
- [ ] Kassir dead-letter bannerini ko'radi; navbat UI dan kuzatiladi.
- [ ] Smena avtomatik yopilganda `actualCash`/`variance` to'qib chiqarilmaydi.
- [ ] Navbat decode xatosida **hech qachon** butunlay o'chirilmaydi — buzuq
      qator karantinga olinadi.
- [ ] Terminal yozadigan har bir fayl: temp → flush → rename.
- [ ] Chek **to'lov saqlangandan keyin** chiqadi (hozir shunday — buzilmasin).
- [ ] Mexanizmni **olib tashlaganda yiqiladigan** test yozilgan
      (`CLAUDE.md` §12a mantiqi) — aks holda bu qoida emas, niyat.

---

## 8. Tavsiya

Faza 1 + 10-band (crash-safe prefs) — bular birgalikda ~2 hafta va
mavjud ma'lum yo'qotishlarning deyarli barchasini yopadi. Faza 3–5 esa
biznes qarori: agar restoranlarda 2+ terminal bo'lsa Faza 5 muqarrar,
aks holda Faza 4 dan keyin to'xtash mumkin.
