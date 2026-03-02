!macro customUnInstall
  DeleteRegKey HKCU "Software\MKClue"
  DeleteRegKey HKLM "Software\MKClue"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\MKClue"
  RMDir /r "$APPDATA\mkclue"
  RMDir /r "$LOCALAPPDATA\MKClue"
  RMDir /r "$LOCALAPPDATA\mkclue"
!macroend
