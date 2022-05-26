JackBot
=======

See it in action on https://www.twitch.tv/publicplayground

Requirements
------------
 - [node.js](https://nodejs.org/)
 - [AutoHotkey](https://www.autohotkey.com/)
 - [Steam client](https://store.steampowered.com/)
   - [Jackbox party packs 1 - 8](https://store.steampowered.com/search/?term=jackbox+party+pack)
 - [OBS Studio](https://obsproject.com/)

Configuration
-------------

Create a `config.json` file in this folder and edit it to your needs:

```json
{
  "options": {
    "debug": true
  },
  "identity": {
    "username": "channelname",
    "password": "oauth:token"
  },
  "channels": [
    "channelname"
  ]
}
```
Get your OAuth token at https://twitchapps.com/tmi/

More info on https://tmijs.com/


