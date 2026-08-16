# Mary AI — Restaurant Management Platform
## Sales Team Overview

---

## Mahsulot haqida qisqacha

**Mary AI** — restoranlar va umumiy ovqatlanish korxonalari uchun yaratilgan zamonaviy boshqaruv platformasi. Bitta tizimda: inventarizatsiya, buyurtmalar, moliyaviy hisoblar, xodimlar va analitika — bularning barchasi real vaqt rejimida ishlaydi.

Platforma **multi-tenant** arxitekturada qurilgan, ya'ni bitta texnik infratuzilmada yuzlab mustaqil restoran tarmog'ini alohida, xavfsiz muhitda xizmat qila oladi.

---

## Asosiy imkoniyatlar

### Buyurtmalar va POS
- Stol, zallar va filiallarga buyurtma biriktirish
- Buyurtmalarni stollar orasida o'tkazish (atomik tranzaksiya)
- Oshpaz uchun alohida navbat (kitchen queue)
- Buyurtmaga qo'shimcha mahsulotlar (modifiers — "qo'shimcha pishloq", "o'tkir emas" va h.)
- Tayyor buyurtmani hisob-kitob qilish va to'lovni qabul qilish

### Stol boshqaruvi
- Oddiy stollar va **vaqt bo'yicha hisob-kitob** qilinadigan stollar (o'yin klublari, karaoke zallar)
- Stol sessiyasi: boshlash, to'xtatish, davom ettirish
- Stolni o'zgartirish — vaqt segmentlari saqlanib qoladi
- Zal va bo'limlar bo'yicha taqsimlash

### Inventarizatsiya va omborxona
- Xom ashyo va yarim tayyor mahsulotlar uchun real vaqt hisobi
- Buyurtma yaratilganda resept orqali ombor avtomatik kamayadi
- Vaqtga bog'liq inventarizatsiya: berilgan sanaga holatni qayta hisoblash
- Ko'p omborxona qo'llab-quvvatlash (filiallar o'rtasida transfer)
- Isrof va ayb harakatlarini qayd qilish (deduction)

### Yetkazib beruvchilar va kirim fakturalar
- Yetkazib beruvchilar bazasi
- 3 bosqichli faktura jarayoni: _kutilmoqda → yetib keldi → qabul qilindi_
- Ombor zaxirasi faqat "qabul qilindi" holatida yangilanadi
- Tarixiy sanaga kirim qayd etish imkoniyati

### Moliya va kassa
- Kassa smenalari va ish o'chirgich
- Daromad, xarajat, o'tkazma — tranzaksiyalar hisobi
- Chiquvchi fakturalar (outgoing invoices)
- To'lov tizimlari: **Click** va **Payme** (O'zbekiston)

### Resept va tannarx
- Har bir taomning tarkibini (reseptini) belgilash
- Avtomatik tannarx hisoblash (ingredient narxlar asosida)
- Foyda marjasi (Price − CostPrice) real vaqt yangilanadi
- Yarim tayyor mahsulotlar (compound goods) orqali murakkab reseptlar

### Xodimlar va kirish huquqlari
- Rollar: admin, menejer, kassir, ofitsiant, oshpaz, supervisor
- Smena boshqaruvi va davomat
- Har bir rolga mos API kirish huquqi

### Hisobotlar va analitika
- Ingredient harakatlar tarixi
- Inventarizatsiya holati bo'limlari bo'yicha
- Dashboard — bosh sahifada umumiy ko'rsatkichlar
- Vaqt oralig'i bo'yicha filtrlash

### Ko'p til qo'llab-quvvatlash
- O'zbek, Rus, Ingliz tillarida interfeys va xabарlar (i18n)
- Har bir API so'rovda til sarlavhasi orqali boshqariladi

---

## Texnik imkoniyatlar (integratsiya uchun)

| Xususiyat | Tafsilot |
|-----------|----------|
| **API** | RESTful, 58 ta marshrut guruhi |
| **Autentifikatsiya** | JWT + Firebase |
| **Hujjatlashtirish** | Swagger (avtomatik) |
| **Til** | Go 1.25 (yuqori unumdorlik) |
| **Ma'lumotlar bazasi** | PostgreSQL 15+ |
| **Kesh** | Redis |
| **Fayl saqlash** | MinIO (S3 muvofiqligi) |
| **Monitoring** | Prometheus + Grafana |
| **Deploy** | Docker / Docker Compose |

---

## Multi-Tenant arxitektura — raqobatchilik afzalligi

Platforma har bir mijoz (restoran tarmog'i) uchun **alohida ma'lumotlar bazasi** ishlatadi:

```
Mary AI infratuzilmasi
├── Restoran A ma'lumotlari  ← to'liq izolyatsiya
├── Restoran B ma'lumotlari  ← to'liq izolyatsiya
└── Restoran N ma'lumotlari  ← to'liq izolyatsiya
```

**Mijozga foydasi:**
- Boshqa mijozlarning ma'lumotlari bilan hech qanday kesishish yo'q
- GDPR va mahalliy ma'lumot xavfsizligi talablariga javob beradi
- Bir tizimda minglab filial — alohida infratuzilma kerak emas

---

## Kimlar uchun mos

| Segment | Nega mos |
|---------|----------|
| **Restoran tarmoqlari** | Ko'p filial, markazlashgan boshqaruv |
| **Oshxonalar / Kafe** | Tezkor POS, oshpaz navbati, inventarizatsiya |
| **O'yin klublari / Karaoke** | Vaqt asosida hisob-kitob (table timer) |
| **Bulut oshxonalar** | Omborxona va buyurtma boshqaruvi |
| **Franchayzing tarmoqlari** | Har bir filial alohida, markaz hisobot oladi |

---

## Asosiy raqamlar

| Ko'rsatkich | Qiymat |
|-------------|--------|
| API marshrutlar guruhi | 58 |
| Ma'lumotlar bazasi jadvallari | 54 |
| Migratsiyalar | 54 (to'liq versiyalash) |
| Til qo'llab-quvvatlash | O'z / Ru / En |
| To'lov tizimlari | Click, Payme |
| Monitoring | Prometheus + Grafana |

---

## Joriy qilish jarayoni

1. **Onboarding** — Mijoz uchun alohida tenant yaratish (< 5 daqiqa)
2. **Sozlash** — Filiallar, zallar, stollar, xodimlar kiritish
3. **Katalog** — Menyu, reseptlar, ingredient bazasi
4. **Integratsiya** — Mavjud POS yoki kassa tizimlari bilan API orqali ulanish
5. **Ishga tushirish** — Smena ochdimi, tizim tayyormi, keting!

---

## Texnik infratuzilma (mijozga ko'rsatish uchun)

```
[Mobil / Web POS] ──HTTP──▶ [Mary AI API (Go)]
                                     │
                         ┌───────────┼────────────┐
                         ▼           ▼             ▼
                   [PostgreSQL]   [Redis]      [MinIO]
                   (ma'lumotlar)  (kesh)     (rasm/fayl)
                         │
                   [Prometheus]
                   [Grafana]
                  (monitoring)
```

---

## Savol-javob (Sales uchun)

**"Tizim qancha filialga chidaydi?"**
> Multi-tenant arxitektura tufayli cheklov amalda yo'q. Har bir filial alohida sxemada ishlaydi, resurslar kerak bo'lganda kengaytirsa bo'ladi (horizontal scaling).

**"Ma'lumotlarim xavfsizmi?"**
> Ha. Har bir mijozning ma'lumotlari alohida PostgreSQL ma'lumotlar bazasida saqlanadi. Boshqa mijozlar bilan hech qanday umumiy jadval yo'q.

**"Mavjud kassam bilan ulana oladimi?"**
> Ha, RESTful API orqali istalgan qurilma yoki dastur bilan integratsiya mumkin. Swagger orqali barcha endpointlar hujjatlashtirilgan.

**"O'zbek tilida ishlaydi?"**
> Ha. O'zbek, Rus va Ingliz tillari qo'llab-quvvatlanadi. Foydalanuvchi tilini istalgan vaqt o'zgartirishi mumkin.

**"Click va Payme bor?**
> Ha. Ikkala to'lov tizimi ham integratsiya qilingan, API orqali to'lovlar qabul qilish mumkin.

**"Oflayn ishlasa bo'ladimi?"**
> Hozirgi versiya onlayn rejimda ishlaydi. Oflayn sinxronizatsiya `/sync` API orqali qisman mavjud (pull/push).

---

*Hujjat yaratilgan: 2026-05-11 | Versiya: 1.0*
