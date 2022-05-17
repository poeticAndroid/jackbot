const tmi = require('tmi.js')
const client = new tmi.Client(require("./config.json"))
client.connect().catch(console.error)
client.on('message', (channel, tags, message, self) => {
  if (self) return
  if (message.slice(0, 1) === '!') {
    let cmd = message.split(" ")
    switch (cmd[0]) {
      case "!hello":
        client.say(channel, `@${tags.username} greetings! PogChamp`)
        break;

      default:
        client.say(channel, `@${tags.username} I don't know how to ${cmd[0].slice(1)}! BibleThump`)
        break;
    }
  }
})
