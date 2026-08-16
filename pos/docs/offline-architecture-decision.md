# Offline arxitektura qarori: alohida server app kerakmi?

> Sana: 2026-08-12
> Manba: `MaryApps/pos`, `MaryApps/backend`, `biznex-cloud-v2` kodini o'qish
> Oldingi hujjat: `docs/offline_mode_plan.md` (2026-08-07) — bu uni almashtirmaydi,
> arxitektura qarorini qo'shadi.

---

## 1. Qaror

**Hozir alohida server app qilinmaydi.** LAN hub POS jarayoni ichida qoladi,
lekin paket chegarasi orqasiga ajratiladi, shunda kelajakdagi ajratish
qayta yozish emas, `main()` fayli bo'ladi.

### Nega — o'lchangan raqamlar

| | biznex-cloud-v2 | MaryAI POS |
|---|---|---|
| LAN klient ilovalar soni | 5 ta (cashier, kds, customer_display, self_order_kiosk, delivery) | **1 ta** (waiter) |
| Server app REST route guruhi | 26 | 8 |
| Fiskal apparat kodi | 5 212 qator | 0 |
| Print dispatch | 1 356 qator | POS ichida |
| "Alohida jarayon bo'lish" narxi (biznes mantiqisiz) | ~8 400 qator (942 bootstrap + 384 discovery + 318 utils + ~558 test + 6 260 operator konsoli) | — |

MaryAI POS'da butun LAN/offline qatlami **3 573 qator** (`lan/` 2 306,
`local/` 627, `offline_queue/` 321, `lan_hub/` 319) — `lib/` dagi 96 557
qatorning 3.7%i. Ya'ni alohida jarayon uni joylashtirish uchun ajratilayotgan
narsadan **2.4 barobar ko'p** kod talab qiladi.

### Muhim kuzatish

biznex'da alohida server bo'lishiga qaramay **cashier ilovasining o'z lokal
drift bazasi bor** (`cashier/lib/core/providers/database_providers.dart`,
`core/network/read_through.dart`, `core/outbox/`). Ya'ni alohida server app
POS'ning lokal omboriga bo'lgan ehtiyojni **yo'q qilmaydi** — ustiga ikkinchi
ombor va ikkinchi migratsiya qo'shadi.

### Va eng muhimi

Tekshirilgan pul yo'qotish nuqtalarining **birortasi ham** jarayon
topologiyasidan kelib chiqmaydi. Eng katta teshik server tomonda
(`backend/.../service/order.go:1122-1295`). LAN hub'ni alohida exe ga
ko'chirish ularning hech birini tuzatmaydi, faqat tuzatishni 2-3 haftaga
kechiktiradi.

---

## 2. Ajratish triggerlari

Alohida server app quyidagilardan **bittasi** ro'y berganda qilinadi:

1. Ikkinchi LAN klient sinfi paydo bo'ladi (KDS, mijoz tablosi, kiosk).
   Tekshiruv: `ls lib/main_*.dart`.
2. **Bironta restoranda ikkita kassa terminali ishlaydi.**
3. POS restartlaridan kelib chiqadigan hub uzilishlari o'lchanadigan
   qo'llab-quvvatlash xarajatiga aylanadi.
4. Fiskal apparat integratsiyasi kiradi.

Bugun hech biri tasdiqlanmagan. **2-trigger tekshirilishi shart** —
`lan_server_service.dart:109-123` da "port band. Boshqa dastur uni egallab
turibdi" degan foydalanuvchiga ko'rinadigan xabar allaqachon bor, ya'ni
kimdir ikkinchi instansiyaga duch kelgan.

Ikkita terminal bo'lsa, stol bandligi egaligi (kim hokim) qayta
loyihalanishi kerak — aks holda ikkala POS o'z Hive faylini haqiqat deb
biladi va bitta stolga ikkita buyurtma ochiladi.

---

## 3. Reja

### Bosqich 0 — pul yo'qotishni to'xtatish (arxitekturaga bog'liq emas)

| # | Ish | Vaqt | Fayl |
|---|---|---|---|
| 1 | Restoranlarda nechta kassa terminali ishlashini sanash (kod emas, ma'lumot so'rovi) | 0.5 kun | deployment ma'lumoti |
| 2 | **Backend:** `MarkOrderPaid` ga replay guard — `idempotency_key` ustuni + unique indeks + to'langan buyurtmani qaytarish | 1-2 kun | `backend/.../service/order.go:1122-1295`, `handler/handler.go:277` |
| 3 | **Backend:** buyurtma qatorlariga klient `id` — `CreateOrderItemEntry` ga `ID *string` + `ON CONFLICT DO NOTHING` | 1-2 kun | `backend/.../model/order.go:176-183`, `local_order_store.dart:246-255` |
| 4 | Widget-lifecycle drainerni o'chirish | 2 soat | `core/widgets/app_scaffold.dart:41-66` |
| 5 | `addItems` ni har qanday xatoda arxivlashni to'xtatish (uch holatli qidiruv) | 1-2 kun | `offline_queue_service.dart:143-156` |
| 6 | Yagona outbox — hamma offline yozuv `LocalOrderStore` orqali | 1 hafta | `create_order_bloc.dart:180-230`, `payment_bloc.dart:291-322` |
| 7 | To'lovda identifikator bo'yicha yopish (stol qidiruvi emas) | 0.5 kun | `payment_bloc.dart:232-237` |
| 8 | Crash-safe prefs — `main()` boshida | 2 kun | `lib/main.dart`, yangi `core/storage/crash_safe_prefs_store.dart` |
| 9 | LAN buyurtmalari uchun oshxona cheki | 3-5 kun | `lan_server_service.dart:98-110`, `printer_service.dart` |
| 10 | LAN auth: rol tekshiruvi, `brandId` filtri, sessiyani diskda saqlash, `onAuthInvalid` ga obuna | 3-4 kun | `lan_rest_server.dart:183-216, 503-578`, `waiter_app.dart` |
| 11 | Yo'qotishni kassir turgan joyda ko'rsatish (faqat dead-letter, `pending` emas) | 2 kun | `offline_banner.dart` |
| 12 | Bind xatosini nazorat qilish + ikkinchi terminalni ko'rinadigan qilish | 2-3 kun | `lan_server_service.dart:93-123` |

### Bosqich 1 — paket chegarasi

13. `packages/` ga ajratish: `pos_protocol` (route'lar, port, WS event nomlari —
    sof Dart), `pos_offline` (store + outbox + sync), `pos_lan_server`,
    `pos_lan_client`. 5-7 kun.

    Deyarli bepul: `lan/`, `local/`, `offline_queue/`, `cache/` ichida
    `features/` importi **bitta** (`offline_auth_cache.dart:3`) va
    `package:flutter/material` umuman yo'q. Teskari bog'liqlik tuzatiladi:
    `waiter/screens/connect_screen.dart:9` planshet uchun `dart:io` server
    klassini import qiladi, faqat `LanRestServer.defaultPort` uchun.

14. CI darvozalari: `packages/` ichida `features/` importi yo'q,
    `pos_lan_server`/`pos_offline` da Flutter yo'q; va DI grafini haqiqiy
    yuklab, drainer rejalashtirilganini va WS klient qurilganini tekshiradigan
    test. 2 kun.

15. Yetishmayotgan LAN yozuv amallari (bekor qilish, transfer, hisob so'rash,
    mehmon soni, smena holati) — hammasi outbox orqali. 10-15 kun.

16. Chegaralangan reconciliation sweep — `syncState != synced OR cloudCreated == false`
    nomzod to'plami bo'yicha (**vaqt oynasi bo'yicha emas**), saqlangan
    idempotency kalitini qayta ishlatib. 5-7 kun.

### Bosqich 2 — ajratish (faqat trigger ishlagach)

17. `apps/server/lib/main.dart` — `pos_lan_server` + `pos_offline` +
    `pos_protocol` ga tayanadi; POS o'zi ham `pos_lan_client` orqali
    localhost'ga ulanadigan klientga aylanadi. 4-6 hafta. Eng xavfli qadam —
    bir martalik Hive migratsiyasi (`local_orders_v1`, `pos_cache`,
    `offline_queue`), sinxronlanmagan savdolari bor mashinada avtomatik
    ishlaydi: qator-ma-qator tekshirilishi va manbani **hech qachon
    o'chirmasligi** shart.

---

## 4. Ofitsiant ilovasi — tasdiqlangan nuqsonlar

Ilova mavjud va `flutter analyze` toza. Muammolar ishlashda, kodning
yo'qligida emas.

1. `onAuthInvalid` (`lan_api_client.dart:61`) ga **hech kim obuna emas**.
   POS restart bo'lsa sessiyalar o'ladi (in-memory `Map`,
   `lan_rest_server.dart:546-548`), har yozuv 401 beradi, ofitsiantga
   "WiFi va kassani tekshiring" deyiladi — aslida 5 soniyalik qayta kirish
   yetardi.
2. Navbatni yuborish sharti buzuq: `waiter_app.dart:30` da
   `reachable && !wasReachable`, lekin `loginPin` (`lan_api_client.dart:143`)
   `_setReachable(true)` qiladi — qayta kirgandan keyin chekka hech qachon
   ishlamaydi va navbat yashil "Ulangan" chipi ortida smena oxirigacha
   o'tirib qoladi.
3. Savat faqat `State` da (`order_screen.dart:55`) — Android ilovani
   o'ldirsa 12 taomlik buyurtma izsiz yo'qoladi.
4. "Yuborilgan" va "yuborilmagan" qatorlar bir xil ko'rinadi. Ma'lumot
   allaqachon yozilyapti (`queued: true`, `lan_api_client.dart:559-561`),
   lekin `order_screen.dart:150-162` uni tashlab yuboradi.
5. Stol kartalarida ham shu — `_markTable` `queued` bayrog'ini ko'chirmaydi,
   natijada "Ochiq summa" hali oshxonaga yetmagan pulni ham qo'shib ko'rsatadi.
6. `LanWsClient` (`lan_ws_client.dart:48`) hech qayerda qurilmaydi. Server
   tomoni jonli broadcast qiladi (`lan_rest_server.dart:281-289, 351, 466-490`),
   lekin planshet 15 soniyalik pollingda. `connectedWaiters` doim 0,
   `notifyTableStatus` (`lan_server_service.dart:164-166`) — o'lik kod.
7. Navbatda yosh chegarasi yo'q: kecha 23:30 da qolgan buyurtma ertalab
   bugungi stolga tushadi va oshxonaga chek chiqadi.
8. IP o'zgarsa avtomatik qayta topish yo'q — `discover()` faqat
   `ConnectScreen` dan chaqiriladi, unga esa chiqib ketish orqali kiriladi.
9. Bitta rad etilgan operatsiya ulanish indikatorini butun smenaga qizil
   qilib qo'yadi (`tables_screen.dart:548-583`).
10. Miqdor 0 bo'lganda "−" bosilsa karta `onTap: onAdd` ga tushib mahsulot
    **qo'shiladi** (`order_screen.dart:1042, 1084`).
11. `_load` da qayta kirish qorovuli yo'q (`tables_screen.dart:105`) — 8s
    timeout'li so'rov 15s pollingdan keyin qaytib, yangi ma'lumot ustiga eski
    keshni yozishi mumkin.
12. Kesh TTLsiz (`lan_api_client.dart:209-237`) — eskirgan menyu narxi
    buyurtmaga yoziladi.
13. Login xatosida xom istisno matni ko'rsatiladi (`connect_screen.dart:191`).
14. `_outbox()` har chaqirilganda butun Hive'ni jsonDecode qiladi; bitta
    `build` da 6 marta chaqiriladi.
15. `waiter/widgets/status_chip.dart` — hech qayerda ishlatilmaydi va boshqa
    dizayn sistemasini (`slate_dawn`) import qiladi. O'chirilsin.

---

## 5. Kassa tomonidagi eng og'ir nuqsonlar

1. **To'lovni qayta yuborish daromadni ikki marta yozadi.**
   `order.go:1122-1295` to'langanlikni umuman tekshirmaydi va har chaqiruvda
   `CreateTransaction{ID: uuid.New()}` yozadi. Klientda `grep -ri idempot` — 0 natija.
2. **Qatorlarda klient id yo'q.** Javob yo'qolsa, tarmoq xatosi to'g'ri
   tasniflanadi va 30 soniyadan keyin **o'sha delta qayta yuboriladi** →
   dublikat qatorlar va dublikat sklad chiqimi.
3. **Sovuq startda navbat umuman drain bo'lmaydi.** `syncAll` ning yagona
   chaqiruvchisi `app_scaffold.dart:64`, u esa `initState` dagi connectivity
   tinglovchisi. `ConnectivityCubit` `super(true)` bilan boshlanadi va
   `initDi()` paytida, hech qanday widget obuna bo'lishidan oldin emit qiladi;
   stream replay qilmaydi.
4. **Ikkita outbox manba bo'yicha ajratilgan.** Ofitsiant buyurtmasi
   `LocalOrderStore` ga, kassirning offline buyurtmasi `OfflineQueueService` ga
   tushadi. `main_cubit.dart:61-71` faqat birinchisini o'qiydi → restartdan
   keyin stol bo'sh ko'rinadi, kassir uni qayta ochadi va
   `create_order_bloc.dart:209` ikkinchi UUID chiqaradi.
5. **LAN buyurtmasi oshxonaga chiqmaydi.** `printKitchenReceipt` ning yagona
   chaqiruvchisi `waiter_cubit.dart:377` — POS'ning cloud yo'li.
6. **Chek olingan puldan kam ko'rsatadi.** `payment_bloc.dart:141`
   `pendingOfflineExtra` ni qo'shib undiradi, `:249` esa faqat `state.detail`
   dan chop etadi.
7. **To'lov stol bo'yicha topilgan buyurtmani yopadi.** To'lov ketayotganda
   ofitsiant yangi taom yuborgan bo'lsa, **yangisi** yopiladi.
