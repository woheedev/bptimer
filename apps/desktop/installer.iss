#define AppName "BPTimer Desktop Companion"
#define AppPublisher "Wohee"
#define AppURL "https://github.com/woheedev/bptimer"
#define AppExeName "bptimer-desktop.exe"
#ifndef AppVersion
  #define AppVersion "0.1.0"
#endif

[Setup]
AppId={{9dafa76e-277e-43fd-8958-38f44246bb09}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher={#AppPublisher}
AppPublisherURL={#AppURL}
AppSupportURL={#AppURL}
AppUpdatesURL={#AppURL}
DefaultDirName={localappdata}\BPTimer
DefaultGroupName={#AppName}
AllowNoIcons=yes
LicenseFile=
OutputDir=Output
OutputBaseFilename=BPTimer-Desktop-Setup-{#AppVersion}
SetupIconFile=..\web\static\favicon.ico
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64compatible

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "target\release\{#AppExeName}"; DestDir: "{app}"; Flags: ignoreversion
Source: "npcap-installer.exe"; DestDir: "{tmp}"; Flags: deleteafterinstall; Check: not IsNpcapInstalled

[Icons]
Name: "{group}\{#AppName}"; Filename: "{app}\{#AppExeName}"; IconFilename: "{app}\{#AppExeName}"
Name: "{group}\{cm:UninstallProgram,{#AppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\{#AppExeName}"; IconFilename: "{app}\{#AppExeName}"; Tasks: desktopicon

[Run]
Filename: "{tmp}\npcap-installer.exe"; StatusMsg: "Installing Npcap (user interaction required)..."; Check: not IsNpcapInstalled
Filename: "{app}\{#AppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(AppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[Code]
function IsNpcapInstalled(): Boolean;
var
  NpcapPath: string;
  RegistryKey: string;
begin
  Result := False;
  
  // Check registry for Npcap installation
  RegistryKey := 'SYSTEM\CurrentControlSet\Services\npcap\Parameters';
  if RegKeyExists(HKEY_LOCAL_MACHINE, RegistryKey) then
  begin
    Result := True;
    Exit;
  end;
  
  // Check for Npcap files
  NpcapPath := ExpandConstant('{pf}\Npcap\NPFInstall.exe');
  if FileExists(NpcapPath) then
  begin
    Result := True;
    Exit;
  end;
  
  // Alternative path check
  NpcapPath := ExpandConstant('{pf32}\Npcap\NPFInstall.exe');
  if FileExists(NpcapPath) then
  begin
    Result := True;
    Exit;
  end;
end;

