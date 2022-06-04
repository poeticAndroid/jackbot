#NoEnv  ; Recommended for performance and compatibility with future AutoHotkey releases.
; #Warn  ; Enable warnings to assist with detecting common errors.
SendMode Input  ; Recommended for new scripts due to its superior speed and reliability.
SetWorkingDir %A_ScriptDir%  ; Ensures a consistent starting directory.

CoordMode, Mouse, Client

global packs := [ "steam://rungameid/331670"
  ,"steam://rungameid/397460"
  ,"steam://rungameid/434170"
  ,"steam://rungameid/610180"
  ,"steam://rungameid/774461"
  ,"steam://rungameid/1005300"
  ,"steam://rungameid/1211630"
  ,"steam://rungameid/1552350" ]

cmd := A_Args[1]
pack := A_Args[2]
game := A_Args[3]

If (cmd == "exit") {
  ExitGame()
}
If (cmd == "restart") {
  RestartGame()
}
If (cmd == "start") {
  StartGame(pack, game)
}

ExitGame() {
  While (WinActive("The Jackbox Party Pack")) {
    WinClose, The Jackbox Party Pack
    Sleep, 1024
  }
  WinClose, The Jackbox Party Pack
  Sleep, 1024
}

RestartGame() {
  If (!WinActive("The Jackbox Party Pack")) {
    Return
  }
  Escape()
  ; Sleep, 1024
  Down()
  Sleep, 1024
  Enter()
  Loop, 3 {
    Sleep, 8192
    Enter()
  }
}

StartGame(pack, game) {
  ExitGame()
  url := packs[pack]
  game := game - 1
  Run, %url%
  While (!WinActive("The Jackbox Party Pack")) {
    Sleep, 1024
    If (WinActive("Steam Dialog")) {
      MouseClick, Left, 160, 232
    }
    WinActivate, The Jackbox Party Pack
  }

  Sleep, 30000
  Enter()
  Sleep, 10000

  Loop, %game% {
    Sleep, 1024
    Down()
  }

  Sleep, 1024
  Enter()
  Sleep, 4096

  While (WinActive("The Jackbox Party Pack")) {
    Enter()
    Sleep, 10000
  }
}


Escape() {
  WinActivate, The Jackbox Party Pack
  If (WinActive("The Jackbox Party Pack")) {
    Send, {Escape}
  }
}
Down() {
  WinActivate, The Jackbox Party Pack
  If (WinActive("The Jackbox Party Pack")) {
    Send, {Down}
  }
}
Enter() {
  WinActivate, The Jackbox Party Pack
  If (WinActive("The Jackbox Party Pack")) {
    Send, {Enter}
  }
}
