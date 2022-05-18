#NoEnv  ; Recommended for performance and compatibility with future AutoHotkey releases.
; #Warn  ; Enable warnings to assist with detecting common errors.
SendMode Input  ; Recommended for new scripts due to its superior speed and reliability.
SetWorkingDir %A_ScriptDir%  ; Ensures a consistent starting directory.

RunWait, _pack7.ahk

Loop, 0 {
  Sleep, 1024
  Send, {Down}
}

Sleep, 1024
Send, {Enter}

Sleep, 10000
Send, {Enter}

