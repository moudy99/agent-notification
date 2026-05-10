Set objShell = CreateObject("WScript.Shell")
objShell.Run "powershell -ExecutionPolicy Bypass -NoProfile -NonInteractive -Sta -WindowStyle Hidden -File """ & Replace(WScript.ScriptFullName, "welcome.vbs", "welcome.ps1") & """", 0, False
