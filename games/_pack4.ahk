#NoEnv  ; Recommended for performance and compatibility with future AutoHotkey releases.
; #Warn  ; Enable warnings to assist with detecting common errors.
SendMode Input  ; Recommended for new scripts due to its superior speed and reliability.
SetWorkingDir %A_ScriptDir%  ; Ensures a consistent starting directory.

CoordMode, Mouse, Client

WinClose, The Jackbox Party Pack
Run, steam://rungameid/610180
While (!WinActive("The Jackbox Party Pack")) {
  Sleep, 1024
  If (WinActive("Steam Dialog")) {
    MouseClick, Left, 160, 248
  }
}

Sleep, 15000
Send, {Enter}
Sleep, 5000
