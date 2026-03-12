Set WshShell = CreateObject("WScript.Shell")

WshShell.Run "cmd /c cd C:\kintaro-cloud\backend && node index.js", 0, False

WshShell.Run "cmd /c cd C:\kintaro-cloud\frontend && npm run dev", 0, False
