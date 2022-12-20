@echo off
echo:
echo update bot ...
call git pull
echo:
echo installing modules ...
call npm install
echo:
echo starting Twitch bot ...
call node index.js
echo:
echo Restarting
start ./jackman.ahk exit
shutdown /r
