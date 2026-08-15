!macro customHeader
  ShowInstDetails show
  ShowUninstDetails show
!macroend

!macro customInstallMode
  StrCpy $isForceCurrentInstall "1"
!macroend

!macro customInstall
  SetDetailsPrint both
  DetailPrint "Configuring Speech-to-Text Application for the current Windows user..."
  SetShellVarContext current
  DetailPrint "Writing current-user application registry settings..."
  WriteRegStr HKCU "Software\FNBUBBLES420 Org\Speech-to-Text Application" "DisplayName" "Speech-to-Text Application"
  WriteRegStr HKCU "Software\FNBUBBLES420 Org\Speech-to-Text Application" "Publisher" "FNBUBBLES420 Org"
  WriteRegStr HKCU "Software\FNBUBBLES420 Org\Speech-to-Text Application" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "Software\FNBUBBLES420 Org\Speech-to-Text Application" "ManualUpdatesOnly" "1"
  DetailPrint "Installer configuration complete."
!macroend

!macro customUnInstall
  SetDetailsPrint both
  DetailPrint "Removing Speech-to-Text Application registry settings..."
  DeleteRegKey HKCU "Software\FNBUBBLES420 Org\Speech-to-Text Application"
  DetailPrint "Uninstall cleanup complete."
!macroend
