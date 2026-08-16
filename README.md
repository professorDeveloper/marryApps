# marryApps

MaryAI POS ekotizimi — uchta loyiha bitta repoda. Har birining to'liq
commit tarixi `git subtree` orqali saqlangan.

| Papka | Nima |
|---|---|
| `pos/` | Flutter: kassa ilovasi (Windows exe) + ofitsiant ilovasi (Android apk) |
| `backend/` | Go API |
| `frontend/` | Vite/React back office |

## Yig'ish

**Actions → "Build POS (exe) & Waiter (apk)" → Run workflow.**

Ishga tushirishda to'rtta qiymat so'raladi:

| Qiymat | Ma'nosi |
|---|---|
| `trial_hours` | Sinov muddati soatlarda. `36` = 1.5 kun |
| `trial_deadline` | Mutlaq muddat, ISO-8601 (`2026-08-20`). Binarga qadaladi — ilovani o'chirib qayta o'rnatish unga ta'sir qilmaydi |
| `trial_contact` | Qulf ekranidagi aloqa. Bo'sh qoldirilsa faqat "Contact to developer" chiqadi |
| `trial_enabled` | Haqiqiy mijoz uchun `false` — qulf umuman o'chadi |

Natija — Actions sahifasidagi artifact'lar:
* `pos-windows` — `MaryAI-POS-windows.zip` (butun `Release` papkasi; exe yolg'iz ishlamaydi)
* `waiter-apk` — ABI bo'yicha ajratilgan uchta APK

`v*` tegi qo'yilsa ikkalasi avtomatik Release'ga chiqadi.

## Sinov muddati qulfi

Qulf **internetsiz** ishlaydi — serverdan tasdiq so'ralmaydi.

* Muddat tugagach POS to'liq qulflanadi va planshetlarga `423` qaytaradi
* Planshetning o'z muddati ham bor, POS'nikidan mustaqil
* Soatni orqaga surish muddatni qaytarmaydi (to'plangan vaqt alohida sanaladi)
* Windows'da holat ilova papkasidan tashqarida uch joyda saqlanadi —
  qayta o'rnatish muddatni tiklamaydi
* Android'da qayta o'rnatish `trial_hours` ni tiklaydi, lekin
  `trial_deadline` ni emas — shuning uchun uni doim qo'ying

Tekshirish uchun: `--dart-define=TRIAL_MINUTES=3`.

## Subtree bilan ishlash

Bu repo uchta mustaqil repodan yig'ilgan. Ular hali ham o'z joyida:

```bash
# yuqoriga qaytarish
git subtree push --prefix=pos      https://github.com/MaryAIGroup/pos.git      main
# yuqoridan olish
git subtree pull --prefix=backend  https://github.com/MaryAIGroup/backend.git  main
```
