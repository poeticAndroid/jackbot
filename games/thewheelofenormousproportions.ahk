#NoEnv  ; Recommended for performance and compatibility with future AutoHotkey releases.
; #Warn  ; Enable warnings to assist with detecting common errors.
SendMode Input  ; Recommended for new scripts due to its superior speed and reliability.
SetWorkingDir %A_ScriptDir%  ; Ensures a consistent starting directory.

RunWait, _pack8.ahk

Loop, 1 {
  Sleep, 1024
  Send, {Down}
}

Sleep, 1024
Send, {Enter}

Sleep, 15000
Send, {Enter}

