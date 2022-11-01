#NoEnv ; Recommended for performance and compatibility with future AutoHotkey releases.
; #Warn  ; Enable warnings to assist with detecting common errors.
SendMode Input ; Recommended for new scripts due to its superior speed and reliability.
SetWorkingDir %A_ScriptDir% ; Ensures a consistent starting directory.

WinGetPos, winX, winY, winWidth, winHeight, A
snipX1 := Floor(A_Args[1] * winWidth / 100)
snipY1 := Floor(A_Args[2] * winHeight / 100)
snipX2 := Floor(A_Args[3] * winWidth / 100 + snipX1 - 1)
snipY2 := Floor(A_Args[4] * winHeight / 100 + snipY1 - 1)

Run, MiniCap.exe -exit -save snip.png -captureregion %snipX1% %snipY1% %snipX2% %snipY2%

Sleep, 1024
WinClose, MiniCap
