#NoEnv  ; Recommended for performance and compatibility with future AutoHotkey releases.
; #Warn  ; Enable warnings to assist with detecting common errors.
SendMode Input  ; Recommended for new scripts due to its superior speed and reliability.
SetWorkingDir %A_ScriptDir%  ; Ensures a consistent starting directory.

Run, git pull
Sleep, 30000
Run, OBS_Studio.lnk
Sleep, 60000
WinActivate, OBS Studio
Sleep, 1024
Send, {Ctrl down}
Sleep, 256
Send, {Alt down}
Sleep, 256
Send, {l down}
Sleep, 256
Send, {l up}
Sleep, 256
Send, {Alt up}
Sleep, 256
Send, {Ctrl up}
; Sleep, 4096
; Send, {Enter}

Sleep, 30000
Run, start.bat
