# Windows Build & Inno Setup Installer Flow

Bu hujjat GitHub Actions orqali Mebelhouse Desktop ilovasini Windows uchun build qilish va Inno Setup bilan `.exe` installer yaratish jarayonini tavsiflaydi.

---

## Maqsad

macOS-da ishlayotgan developer Windows `.exe` installer-ni qo'lda yasay olmaydi. GitHub Actions `windows-latest` runner-dan foydalanib, butun build + packaging jarayonini bulutda avtomatlashtirish kerak.

**Natija:** Bitta tugma bosish bilan `MebelhouseDesktop-Setup-<version>.exe` installer-ni yuklab olish imkoniyati.

---

## Arxitektura

```
pubspec.yaml (version: 1.0.1+1)
      │
      ▼
┌──────────────────────────────────────────────────┐
│  GitHub Actions (windows-latest runner)          │
│                                                  │
│  1. Flutter SDK setup                            │
│  2. flutter build windows --release              │
│     → build/windows/x64/runner/Release/*.exe     │
│  3. ISCC.exe compile installer.iss               │
│     → dist/MebelhouseDesktop-Setup-1.0.1.exe     │
│  4. Upload artifact                              │
└──────────────────────────────────────────────────┘
      │
      ▼
  Artifact (30 kun saqlanadi)
      │
      ▼
  gh run download → lokal .exe
```

---

## Fayllar

### 1. `windows/installer.iss` — Inno Setup skripti

Inno Setup `.iss` formatini tushunadigan compiler (`ISCC.exe`) uchun yozilgan konfiguratsiya.

**Asosiy parametrlar:**

| Parametr | Qiymat |
|----------|--------|
| AppName | "Mebelhouse Desktop" |
| AppId | `{B7A3F1E2-5D4C-4A8B-9F6E-3C2D1A0B5E4F}` (uninstall uchun) |
| DefaultDirName | `{autopf}\Mebelhouse Desktop` (`C:\Program Files\...`) |
| SetupIconFile | `runner\resources\app_icon.ico` |
| OutputBaseFilename | `MebelhouseDesktop-Setup-<version>` |
| Compression | `lzma2` (solid) |
| Architectures | `x64compatible` |
| PrivilegesRequired | `admin` |
| Languages | English + Russian |

**Muhim preprocessor defines:**

```
#ifndef MyAppVersion
  #define MyAppVersion "1.0.0"
#endif
```

Bu `MyAppVersion`-ni tashqaridan (GitHub Actions-dan `/D` flag orqali) o'zgartirish imkonini beradi. Agar uzatilmasa, default `1.0.0` ishlatiladi.

**[Files] bo'limi:**

```
Source: "{#SourceDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
```

Flutter release build-idagi **barcha fayllarni** (`.exe`, `.dll`, `data/` papkasi) installer ichiga o'raydi.

**[Tasks] va [Icons]:**

Start Menu shortcut avtomatik yaratiladi. Desktop shortcut — ixtiyoriy (checkbox `unchecked`).

---

### 2. `.github/workflows/build-windows.yml` — CI pipeline

`workflow_dispatch` trigger — faqat qo'lda ishga tushiriladi (automatic triggerlar yo'q, har push-da build ketmaydi).

**Step-by-step:**

#### Step 1: Checkout
```yaml
- uses: actions/checkout@v4
```

#### Step 2: Flutter setup
```yaml
- uses: subosito/flutter-action@v2
  with:
    flutter-version: '3.35.6'
    channel: 'stable'
    cache: true
```
`cache: true` — Flutter SDK-ni runner-da keshlaydi, keyingi build-lar tez ishlaydi.

#### Step 3: Windows desktop yoqish
```yaml
- run: flutter config --enable-windows-desktop
```

#### Step 4: Dependencies
```yaml
- run: flutter pub get
```

#### Step 5: Windows build
```yaml
- run: flutter build windows --release
```
Natija: `build\windows\x64\runner\Release\` papkasida `mebelhouse_desktop.exe` va unga kerakli barcha DLL/asset fayllar.

#### Step 6: Version ajratib olish
```yaml
- id: version
  shell: pwsh
  run: |
    $raw = (Select-String -Path pubspec.yaml -Pattern '^version:\s*(.+)$').Matches[0].Groups[1].Value.Trim()
    $ver = $raw.Split('+')[0]
    echo "version=$ver" >> $env:GITHUB_OUTPUT
```

`pubspec.yaml`-dagi `version: 1.0.1+1` qatoridan `1.0.1` qismini ajratib olib, keyingi stepda `${{ steps.version.outputs.version }}` orqali foydalaniladi.

#### Step 7: Inno Setup compile
```yaml
- shell: pwsh
  run: |
    & "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe" `
      "/DMyAppVersion=${{ steps.version.outputs.version }}" `
      windows\installer.iss
```

**Muhim:** GitHub-ning `windows-latest` runner-iga Inno Setup 6 **oldindan o'rnatilgan**, alohida install qilish shart emas.

`/DMyAppVersion=1.0.1` flag — `.iss` fayldagi `MyAppVersion` define-ini override qiladi.

#### Step 8-9: Upload artifacts
```yaml
- uses: actions/upload-artifact@v4
  with:
    name: MebelhouseDesktop-Installer-${{ steps.version.outputs.version }}
    path: dist/*.exe
    retention-days: 30
```

Ikki alohida artifact:
- **Installer** (30 kun) — foydalanuvchilarga tarqatish uchun
- **Raw build** (7 kun) — debug uchun, toza ZIP

---

## Ishga tushirish jarayoni

### Variant A: GitHub UI orqali

1. Repo → **Actions** tab
2. Chapdagi ro'yxatdan **"Build Windows"** tanlanadi
3. O'ngda **"Run workflow"** tugmasi → branch tanlab "Run workflow"
4. ~10-15 daqiqa kutish
5. Run sahifasining pastida **Artifacts** bo'limidan `.zip` yuklab olinadi

### Variant B: `gh` CLI orqali (lokal terminal)

```bash
# 1. Workflow-ni ishga tushirish
gh workflow run build-windows.yml --ref dev

# 2. Oxirgi run holatini ko'rish
gh run list --workflow=build-windows.yml --limit 3

# 3. Run tugashini kuzatish (blocking)
gh run watch <run-id> --exit-status

# 4. Installer artifact-ni yuklab olish
gh run download <run-id> -n MebelhouseDesktop-Installer-1.0.1
```

`<run-id>` — `gh run list` natijasidagi raqam (masalan `24802811383`).

---

## Real misol (2026-04-22)

| Bosqich | Vaqt | Natija |
|---------|------|--------|
| Checkout + Flutter setup | ~1 min | SDK keshdan olindi |
| `flutter pub get` | ~30 sek | |
| `flutter build windows --release` | ~10 min | ~80 MB build folder |
| Inno Setup compile | ~15 sek | lzma2 siqish |
| Upload artifact | ~20 sek | |
| **Jami** | **14 min 25 sek** | **14 MB `.exe` installer** |

---

## Versiyani yangilash

Yangi versiyali installer chiqarish uchun faqat `pubspec.yaml`-ni o'zgartirish kifoya:

```yaml
version: 1.0.2+2   # 1.0.1+1 → 1.0.2+2
```

Commit → push → workflow run. Fayl nomi avtomatik `MebelhouseDesktop-Setup-1.0.2.exe` bo'ladi.

---

## Muammolar va yechimlar

### "ISCC.exe not found"
**Sabab:** Inno Setup yo'li boshqa bo'lishi mumkin.
**Yechim:** `Get-ChildItem "${env:ProgramFiles(x86)}\Inno Setup*"` bilan aniq yo'lni topish.

### "SetupIconFile not found"
**Sabab:** `.iss` fayl `windows/` papkasidan ishga tushmoqda, `runner/resources/app_icon.ico` yo'li relative.
**Yechim:** `.iss`-ni `windows/` papkasida saqlash (hozirgi yechim) yoki absolute yo'l berish.

### Uzun build vaqti
**Sabab:** Flutter SDK har safar yuklanadi.
**Yechim:** `subosito/flutter-action@v2` da `cache: true` — ikkinchi build-dan boshlab SDK keshdan olinadi.

---

## Fayl strukturasi

```
mebelhouse_desktop/
├── .github/
│   └── workflows/
│       └── build-windows.yml       # GitHub Actions pipeline
├── windows/
│   ├── installer.iss               # Inno Setup skripti
│   └── runner/
│       └── resources/
│           └── app_icon.ico        # Installer ikonasi
└── pubspec.yaml                    # Version manbai
```

---

**Oxirgi yangilanish:** 2026-04-22
**Test qilingan run:** [#24802811383](https://github.com/mebelhouse/mebelhouse-desktop/actions/runs/24802811383)
