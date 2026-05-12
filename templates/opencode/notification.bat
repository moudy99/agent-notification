@echo off
set "vbs=%~dp0notification.vbs"
if not exist "%vbs%" (
  > "%vbs%" echo Set objShell = CreateObject("WScript.Shell")
  >> "%vbs%" echo objShell.Run "powershell.exe -ExecutionPolicy Bypass -NoProfile -NonInteractive -Sta -WindowStyle Hidden -File """ ^& Replace(WScript.ScriptFullName, "notification.vbs", "notification.ps1") ^& """", 0, False
)
wscript //nologo "%vbs%"
