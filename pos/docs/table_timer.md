# Table timer (`GET /orders/{id}/table-timer`)

## Maqsad

Vaqt bo‘yicha hisoblangan stollar (`time_based`) uchun ofitsiant ekranida timer holatini ko‘rsatish: `GET /api/v1/orders/{orderId}/table-timer`, kerak bo‘lsa start/pause/resume.

## Nega `dine_in` bo‘lsa ham har safar GET yuboriladi?

Hozir `OpenOrderModel` (yoki ochiq buyurtmalar ro‘yxati) da stol **`time_based` / `table_type`** aniq flag sifatida ishlatilmaydi. Shuning uchun klient “bu stolda timer bormi?”ni **faqat server javobidan** biladi:

- **200** + `table_type: time_based` → timer UI ko‘rsatiladi.
- **200** lekin `table_type` boshqa → timer yashiriladi (`TableTimerResponse.isTimeBasedTable`).
- **400** (`table timer is only available for time_based tables`) yoki **404** → timer yo‘q; bu **kutilgan** holat, foydalanuvchiga xato sifatida ko‘rsatilmasligi kerak (`TableTimerCubit` 400/404 ni “timer yo‘q” deb qabul qiladi).

Demak, **time_based emas** stollar uchun GET yuborish — hozirgi arxitekturada **“timer bormi-yo‘qmi”ni aniqlash** uchun; alohida discovery endpoint emas, lekin natijada shu vazifani bajaradi.

## Keyingi optimizatsiya (ixtiyoriy)

Backend ochiq buyurtma yoki stol obyektida `table_type` yoki `is_time_based` bersa:

- `time_based` bo‘lmagan buyurtmalar uchun **`GET .../table-timer` chaqirilmasin** — logda 400 kamayadi, ortiqcha so‘rov yo‘qoladi.
- `TableTimerCubit.bindOrder` ichida shu flag bo‘yicha erta `return` qilish kifoya.

## Tezkor havola (kod)

- `lib/features/view/main/presentation/cubit/table_timer/table_timer_cubit.dart` — `bindOrder`, `fetchTimer`, 400/404 handling.
- `lib/features/view/main/data/models/table_timer/table_timer_response_model.dart` — `table_type`, `isTimeBasedTable`.
- `lib/features/view/main/presentation/pages/waiter/widgets/table_timer_section.dart` — UI.
