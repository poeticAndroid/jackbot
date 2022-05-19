#NoEnv  ; Recommended for performance and compatibility with future AutoHotkey releases.
; #Warn  ; Enable warnings to assist with detecting common errors.
SendMode Input  ; Recommended for new scripts due to its superior speed and reliability.
SetWorkingDir %A_ScriptDir%  ; Ensures a consistent starting directory.

While (WinActive("The Jackbox Party Pack")) {
  WinClose, The Jackbox Party Pack
  Sleep, 1024
}
WinClose, The Jackbox Party Pack
