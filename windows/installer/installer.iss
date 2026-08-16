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
Filename: "{app}\{#AppExeName}"; Description: "{cm:LaunchProgram,{#AppName}}"; Flags: nowait postinstall skipifsilent

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
