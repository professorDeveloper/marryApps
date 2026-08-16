# Offline rejim va ofitsiant ilovasi

> POS'ni restoran hub'iga aylantirib, ofitsiant planshetlarini internetsiz
> ishlatish. Model iiko'nikiga o'xshash: **restoran ichidagi qurilma hokim,
> bulut emas.**

## Arxitektura

```
                    Internet (ixtiyoriy)
                          │
                   api.maryai.uz
                          │  outbox push (GUID bilan)
        ┌─────────────────┴──────────────────┐
        │  POS (Windows)                     │
        │    Hive local store                │
        │      · CacheService — menyu/stollar│
        │      · LocalOrderStore — buyurtma  │
        │    LAN REST  :28085                │
        │    UDP discovery :8022             │
        └─────────────────┬──────────────────┘
                          │ WiFi (internetsiz ham)
              ┌───────────┴────────────┐
              │  Ofitsiant (Android)   │
              │   kesh + o'z navbati   │
              └────────────────────────┘
```

**Asosiy qoida:** LAN server hech qachon cloudga so'rov yubormaydi. U faqat
lokal ombordan o'qiydi. Aks holda internet o'chganda LAN API ham o'lardi.

## POS tomonida yoqish

1. Sozlamalar → **Tarmoq (LAN)** bo'limi
2. Pastdagi **"Ofitsiant ilovasi"** kartasidagi tugmani yoqing
3. Kartada chiqadigan manzilni (`192.168.x.x:28085`) yozib oling — planshetda
   avtomatik topilmasa qo'lda kiritiladi

### Windows Firewall

Bu qadam **majburiy** — busiz planshet POS'ni ko'rmaydi:

```powershell
netsh advfirewall firewall add rule name="MaryAI POS LAN" `
  dir=in action=allow protocol=TCP localport=28085
netsh advfirewall firewall add rule name="MaryAI POS Discovery" `
  dir=in action=allow protocol=UDP localport=8022
```

### Menyu keshi

LAN server keshdan o'qiydi, kesh esa POS oddiy ishlaganda to'ladi
(`app_scaffold.dart` taomlarni oldindan yuklaydi, floor plan zallar va
stollarni saqlaydi). Shuning uchun **birinchi marta POS internetli holda
kamida bir marta ochilishi kerak.** Undan keyin internet shart emas.

## Ofitsiant ilovasini yig'ish

```bash
flutter build apk --release --target=lib/main_waiter.dart
```

APK: `build/app/outputs/flutter-apk/app-release.apk`

Ilova POS bilan bitta `pubspec.yaml` da yashaydi — modellar, Slate Dawn
dizayn sistemasi va LAN protokoli ikkalasida bir xil bo'lishi uchun.

## Planshetni ulash

1. Planshet POS bilan **bitta WiFi** da bo'lsin
2. Ilovani oching — POS avtomatik topiladi (UDP broadcast)
3. Topilmasa "Qo'lda kiritish" → `192.168.x.x:28085`
4. Brand ID va ofitsiantning PIN kodini kiriting

PIN offline tekshiriladi: `OfflineAuthCache` da saqlangan ma'lumot bo'yicha.
Ya'ni ofitsiant kamida bir marta POS'da internetli holda kirgan bo'lishi kerak.

## Nima offline ishlaydi

| Amal | Internetsiz | Izoh |
|---|:---:|---|
| Menyuni ko'rish | ✅ | Keshdan |
| Stollar va bandlik | ✅ | Lokal ombordan |
| Buyurtma yaratish | ✅ | Lokal, keyin sinxron |
| Buyurtmaga taom qo'shish | ✅ | Lokal, keyin sinxron |
| Kassir ofitsiant buyurtmasini ko'rishi | ✅ | LAN orqali darhol |
| Naqd to'lov | ⚠️ | Navbatga tushadi, lekin replay himoyasi yo'q |
| Karta to'lovi | ❌ | Bank avtorizatsiyasi yo'q — pastdagi ogohlantirishga qarang |
| Smena ochish/yopish | ⚠️ | Lokal ishlaydi, lekin serverga yetmaydi |
| Fiskal chek | ❌ | Hali ulanmagan |

### Uch ochiq xavf

**Karta to'lovi offline'da yolg'on "to'landi" beradi.** `payment_bloc.dart`
ning `_enqueuePayment()` kartani naqddan ajratmaydi: chek chiqadi, buyurtma
yopiladi, lekin bank avtorizatsiyasi bo'lmagan. Pul kelmaydi.

**To'lovni qayta yuborish ikki marta yozadi.** Backend `MarkOrderPaid` da
"allaqachon to'langanmi" tekshiruvi yo'q — `bill_status` ham, `paid_at` ham
qaralmaydi. Buyurtma yaratishda GUID himoyasi bor, to'lovda yo'q.

**Offline ochilgan smena serverga yetmaydi.** `shift_bloc.dart:139` da
`local_` bilan boshlanadigan id'lar push qilinmaydi. Buyurtmalar
sinxronlanadi, lekin qaysi smenaga tegishli ekani yo'qoladi va o'sha
davrning Z-hisoboti bulutda paydo bo'lmaydi.

## Dublikat buyurtma nega chiqmaydi

Har bir buyurtmaning `id` si **klientda** generatsiya qilinadi
(`UuidV4.generate()`) va hech qachon o'zgarmaydi. Backend
`CreateOrderRequest.ID` ni qabul qiladi va o'sha id bilan buyurtma allaqachon
bor bo'lsa uni qaytaradi — yangisini yaratmaydi
(`backend/app/internal/service/order.go:187-206`).

Shu sababli javob yo'qolib buyurtma qayta yuborilsa ham dublikat tushmaydi.
Bu iiko'ning GUID modeli.

Qatorlar uchun ham xuddi shunday: har bir qatorning klient `id` si bor va
POS takroriy yuborishda mavjudlarini filtrlab tashlaydi.

## Yo'qolgan buyurtmalar

Server rad etgan (4xx) buyurtma **hech qachon o'chirilmaydi**. U
`deadLetter` deb belgilanadi va Sozlamalar → Tarmoq (LAN) bo'limida qizil
karta bo'lib chiqadi. Kassir buni ko'radi va qo'lda hal qiladi.

Eski `OfflineQueueService` bu holatda yozuvni jimgina o'chirib yuborardi —
sotuv izsiz yo'qolardi. Endi u `offline_queue_failed_v1` box'iga arxivlanadi.

## Hali qilinmagan

- `POST /api/v1/sync/pull` orqali to'liq delta sync (hozir kesh oddiy
  API chaqiruvlaridan to'ladi)
- Drift local DB (hozir Hive)
- Fiskal chek offline
- Smena offline ochish/yopish
- Ofitsiant ilovasida WebSocket real-time (hozir 15 soniyalik polling)
