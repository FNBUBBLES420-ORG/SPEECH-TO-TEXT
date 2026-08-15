!macro customInstallMode
  StrCpy $isForceCurrentInstall "1"
!macroend

!macro customInstall
  SetShellVarContext current
  WriteRegStr HKCU "Software\FNBUBBLES420 Org\Speech-to-Text Application" "DisplayName" "Speech-to-Text Application"
  WriteRegStr HKCU "Software\FNBUBBLES420 Org\Speech-to-Text Application" "Publisher" "FNBUBBLES420 Org"
  WriteRegStr HKCU "Software\FNBUBBLES420 Org\Speech-to-Text Application" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "Software\FNBUBBLES420 Org\Speech-to-Text Application" "ManualUpdatesOnly" "1"
!macroend

!macro customUnInstall
  DeleteRegKey HKCU "Software\FNBUBBLES420 Org\Speech-to-Text Application"
!macroend
