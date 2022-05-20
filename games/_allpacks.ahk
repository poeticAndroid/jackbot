#NoEnv  ; Recommended for performance and compatibility with future AutoHotkey releases.
; #Warn  ; Enable warnings to assist with detecting common errors.
SendMode Input  ; Recommended for new scripts due to its superior speed and reliability.
SetWorkingDir %A_ScriptDir%  ; Ensures a consistent starting directory.

RunWait, _pack1.ahk
Sleep, 120000
RunWait, _pack2.ahk
Sleep, 120000
RunWait, _pack3.ahk
Sleep, 120000
RunWait, _pack4.ahk
Sleep, 120000
RunWait, _pack5.ahk
Sleep, 120000
RunWait, _pack6.ahk
Sleep, 120000
RunWait, _pack7.ahk
Sleep, 120000
RunWait, _pack8.ahk
Sleep, 120000
RunWait, _shutdown.ahk
