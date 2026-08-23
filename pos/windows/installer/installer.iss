; MaryAI POS — Windows o'rnatuvchisi (Inno Setup 6)
;
; Yig'ish:
;   iscc /DAppVersion=1.0.0 /DSourceDir=..\..\build\windows\x64\runner\Release installer.iss
;
; Natija: Output\MaryAI-POS-Setup-<versiya>.exe — bitta fayl, ikki marta
; bosilsa o'rnatadi.

#ifndef AppVersion
  #define AppVersion "1.0.0"
#endif

#ifndef SourceDir
  #define SourceDir "..\..\build\windows\x64\runner\Release"
#endif

#define AppName "MaryAI POS"
#define AppPublisher "MaryAI"
#define AppExeName "mary_ai_pos.exe"

[Setup]
; AppId ilovaning doimiy shaxsi — yangilanishda **o'zgarmasligi shart**,
; aks holda Windows uni boshqa dastur deb bilib eskisining yoniga
; ikkinchi nusxa o'rnatadi.
AppId={{7C4A9E21-3F5B-4D8A-9E17-2B6C8D4F1A03}
AppName={#AppName}
AppVersion={#AppVersion}
AppVerName={#AppName} {#AppVersion}
AppPublisher={#AppPublisher}
DefaultDirName={autopf}\{#AppName}
DefaultGroupName={#AppName}
DisableProgramGroupPage=yes
OutputDir=Output
OutputBaseFilename=MaryAI-POS-Setup-{#AppVersion}
SetupIconFile=..\runner\resources\app_icon.ico
UninstallDisplayIcon={app}\{#AppExeName}
UninstallDisplayName={#AppName}
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern

; POS monoblokka o'rnatiladi — Program Files ga yozish uchun admin kerak.
; `dialog` foydalanuvchiga admin bo'lmasa o'z papkasiga o'rnatish imkonini
; qoldiradi.
PrivilegesRequired=admin
PrivilegesRequiredOverridesAllowed=dialog

; Ilova 64-bit; 32-bit Windows'da umuman ishlamaydi, shuni oldindan aytamiz.
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible

[Languages]
Name: "uz"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Ish stoliga yorliq qo'yish"; GroupDescription: "Qo'shimcha:"

[Files]
; Butun `Release` papkasi ko'chiriladi: exe yonidagi DLL'lar va `data/`
; papkasisiz ilova umuman ishga tushmaydi.
Source: "{#SourceDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#AppName}"; Filename: "{app}\{#AppExeName}"
Name: "{group}\{cm:UninstallProgram,{#AppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\{#AppExeName}"; Tasks: desktopicon

[Run]
; ── Windows Firewall ─────────────────────────────────────────────────────
; POS ofitsiant planshetlari uchun LAN hub vazifasini bajaradi:
;   * TCP 28085 — REST server (`lan_rest_server.dart:defaultPort`)
;   * UDP 8022  — "MARYPOS-DISCOVER" so'rovlariga javob (`lan_discovery.dart`)
;
; Windows Defender yangi ilovaning kiruvchi ulanishlarini SO'RAMASDAN
; bloklaydi (monoblokda odatda "Public" tarmoq profili). Natijada planshet
; POS'ni discovery'da umuman topmaydi yoki topib, ulanolmaydi — va buning
; sababi hech qayerda ko'rinmaydi.
;
; `dir=in` — faqat kiruvchi. Chiquvchi ulanishlar allaqachon ruxsat etilgan.
; Avval o'chirib, keyin qo'shamiz: aks holda har qayta o'rnatishda ayni
; qoidaning yangi nusxasi qo'shilib, ro'yxat cheksiz o'sardi.
Filename: "{sys}\netsh.exe"; Parameters: "advfirewall firewall delete rule name=""MaryAI POS (LAN REST)"""; Flags: runhidden; StatusMsg: "Tarmoq ruxsatlari sozlanmoqda..."
Filename: "{sys}\netsh.exe"; Parameters: "advfirewall firewall delete rule name=""MaryAI POS (LAN Discovery)"""; Flags: runhidden
Filename: "{sys}\netsh.exe"; Parameters: "advfirewall firewall add rule name=""MaryAI POS (LAN REST)"" dir=in action=allow protocol=TCP localport=28085 profile=any"; Flags: runhidden; StatusMsg: "Tarmoq ruxsatlari sozlanmoqda..."
Filename: "{sys}\netsh.exe"; Parameters: "advfirewall firewall add rule name=""MaryAI POS (LAN Discovery)"" dir=in action=allow protocol=UDP localport=8022 profile=any"; Flags: runhidden

Filename: "{app}\{#AppExeName}"; Description: "{cm:LaunchProgram,{#AppName}}"; Flags: nowait postinstall skipifsilent

[UninstallRun]
; O'chirilganda qoidalar ham ketadi — ochiq port ortda qolmasin.
Filename: "{sys}\netsh.exe"; Parameters: "advfirewall firewall delete rule name=""MaryAI POS (LAN REST)"""; Flags: runhidden
Filename: "{sys}\netsh.exe"; Parameters: "advfirewall firewall delete rule name=""MaryAI POS (LAN Discovery)"""; Flags: runhidden

[UninstallDelete]
; Ilova ishlash paytida yozadigan fayllar. Sinov muddati holati
; (`%PROGRAMDATA%\MaryAI`) ataylab **o'chirilmaydi** — o'chirib qayta
; o'rnatish muddatni tiklab yubormasligi kerak.
Type: filesandordirs; Name: "{app}\data"
Type: dirifempty; Name: "{app}"

[Code]
// O'rnatishdan oldin ishlab turgan nusxani yopamiz. Aks holda Windows
// band fayllarni almashtira olmaydi va o'rnatish yarim yo'lda qoladi.
function InitializeSetup(): Boolean;
var
  ResultCode: Integer;
begin
  Exec('taskkill.exe', '/F /IM {#AppExeName}', '', SW_HIDE,
       ewWaitUntilTerminated, ResultCode);
  Result := True;
end;

function InitializeUninstall(): Boolean;
var
  ResultCode: Integer;
begin
  Exec('taskkill.exe', '/F /IM {#AppExeName}', '', SW_HIDE,
       ewWaitUntilTerminated, ResultCode);
  Result := True;
end;
