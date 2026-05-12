@echo off
powershell.exe -ExecutionPolicy Bypass -NoProfile -NonInteractive -Sta -WindowStyle Hidden -File "%~dp0notification.ps1"
