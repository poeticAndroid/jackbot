const
  tmi = require('tmi.js'),
  config = require("./config.json"),
  process = require("child_process"),
  games = require("./games.json")

process.exec(`start ./jackman.ahk exit`)

const state = {
  state: "idle",
  gameVotes: {},
  gameVoters: {},
  quitVotes: {},
  quitVoters: {},
  chatters: [],
  partyGoers: []
}
const client = new tmi.Client(config)
let loneliness, exitReminder

client.connect().catch(console.error)
client.on('message', (channel, tags, message, self) => {
  state.idleSince = Date.now()
  clearTimeout(loneliness)
  loneliness = setInterval(() => {
    lonely(channel)
  }, 1000 * 60 * 15)
  if (!state.chatters.includes(tags.username)) {
    state.chatters.push(tags.username)
  }
  if (self) return
  if (message.slice(0, 1) === '!') {
    let cmd = message.trim().toLowerCase().split(/\s+/)
    if (cmd[0] === "!") {
      cmd.shift()
      cmd[0] = "!" + cmd[0]
    }
    switch (cmd[0]) {
      case "!hello":
        client.say(channel, `@${tags.username} greetings! HeyGuys`)
        break

      case "!secret":
        client.say(channel, `@${tags.username} congratulations! You found the secret command! Use it responsibly PowerUpL MingLee PowerUpR`)
        break

      case "!help":
      case "!commands":
        client.say(channel, `!list - List all available games.`)
        client.say(channel, `!vote <game title> - Vote on a Jackbox game to play.`)
        client.say(channel, `!exit/!restart/!stay - vote for ending/restarting/keep playing the current game.`)
        client.say(channel, `!src - Link to source on Github.`)
        break

      case "!list":
      case "!games":
        listGames(channel, tags, message, self)
        break

      case "!src":
      case "!source":
        client.say(channel, `https://github.com/poeticAndroid/jackbot`)
        break

      case "!game":
      case "!vote":
        voteGame(channel, tags, message, self)
        break

      case "!newgame":
      case "!exit":
      case "!quit":
        voteExit(channel, tags, message, self)
        break

      case "!stay":
      case "!continue":
        voteStay(channel, tags, message, self)
        break

      case "!play":
      case "!start":
      case "!reset":
      case "!restart":
        voteRestart(channel, tags, message, self)
        break

      case "!party":
        joinParty(channel, tags, message, self)
        break
    }
  }
})

function listGames(channel, tags, message, self) {
  let titles = []
  for (let game in games) {
    titles.push(`${games[game].title} (${games[game].playersMin})`)
  }
  titles.sort()
  client.say(channel, "Available games (and players required): " + titles.join(", "))
}

function voteGame(channel, tags, message, self) {
  let cmd = message.trim().toLowerCase().split(/\s+/)
  if (!cmd[1]) {
    client.say(channel, `@${tags.username} forgot to give a title! Type '!vote' followed by the game title.. (or just some of it) BibleThump`)
    return
  }
  if (state.state === "idle") {
    startVoting(channel)
  }
  let gameId = resolveGame(cmd.slice(1))
  let game = games[gameId]
  if (game) {
    let same = state.gameVoters[tags.username] === gameId
    let change, alreadyPlaying
    if (state.gameVoters[tags.username]) {
      state.gameVotes[state.gameVoters[tags.username]]--
      change = true
    }
    if (state.state === "playing" && state.currentGame === gameId) {
      alreadyPlaying = true
    } else {
      state.gameVoters[tags.username] = gameId
      state.gameVotes[state.gameVoters[tags.username]] = state.gameVotes[state.gameVoters[tags.username]] || 0
      state.gameVotes[state.gameVoters[tags.username]]++
    }
    if (alreadyPlaying) {
      client.say(channel, `@${tags.username} we're already playing ${game.title}! Did you mean to '!restart' it?`)
    } else if (same) {
      client.say(channel, `@${tags.username} dont worry. I haven't forgotten your vote for ${game.title}! SeemsGood`)
    } else if (change) {
      client.say(channel, `@${tags.username} changed their mind and would rather play ${game.title} instead. SeemsGood`)
    } else {
      client.say(channel, `@${tags.username} wants to play ${game.title}! SeemsGood`)
    }
    if (state.state === "playing" && !exitReminder) {
      client.say(channel, `We're currently playing ${games[state.currentGame].title}. Type '!exit' to vote for ending this game.`)
      exitReminder = setTimeout(() => {
        exitReminder = false
      }, 1024 * 64)
    }
  } else {
    client.say(channel, `@${tags.username} I don't know the game ${cmd.slice(1).join(" ")}! BibleThump`)
  }
}

function voteRestart(channel, tags, message, self) {
  if (state.state === "playing") {
    startQuitting(channel)
  }
  if (state.state !== "quitting") {
    client.say(channel, `@${tags.username} type '!vote <game name>' if you want to play something.. BibleThump`)
    return
  }
  let same = state.quitVoters[tags.username] === "restart"
  let change = false
  if (state.quitVoters[tags.username]) {
    state.quitVotes[state.quitVoters[tags.username]]--
    change = true
  }
  state.quitVoters[tags.username] = "restart"
  state.quitVotes[state.quitVoters[tags.username]] = state.quitVotes[state.quitVoters[tags.username]] || 0
  state.quitVotes[state.quitVoters[tags.username]]++
  if (same) {
    client.say(channel, `@${tags.username} can't wait to start over! SeemsGood`)
  } else if (change) {
    client.say(channel, `@${tags.username} changed their mind and wants to restart ${games[state.currentGame].title} instead.. SeemsGood`)
  } else {
    client.say(channel, `@${tags.username} wants to restart ${games[state.currentGame].title}.. SeemsGood`)
  }
}

function voteExit(channel, tags, message, self) {
  if (state.state === "playing") {
    startQuitting(channel)
  }
  if (state.state !== "quitting") {
    client.say(channel, `@${tags.username} type '!vote <game name>' if you want to play something.. BibleThump`)
    return
  }
  let same = state.quitVoters[tags.username] === "quit"
  let change = false
  if (state.quitVoters[tags.username]) {
    state.quitVotes[state.quitVoters[tags.username]]--
    change = true
  }
  state.quitVoters[tags.username] = "quit"
  state.quitVotes[state.quitVoters[tags.username]] = state.quitVotes[state.quitVoters[tags.username]] || 0
  state.quitVotes[state.quitVoters[tags.username]]++
  if (same) {
    client.say(channel, `@${tags.username} is so impatient! SeemsGood`)
  } else if (change) {
    client.say(channel, `@${tags.username} changed their mind and dont't want to play ${games[state.currentGame].title} after all.. SeemsGood`)
  } else {
    client.say(channel, `@${tags.username} don't want to play ${games[state.currentGame].title} anymore.. SeemsGood`)
  }
}

function voteStay(channel, tags, message, self) {
  if (state.state === "playing") {
    startQuitting(channel)
  }
  if (state.state !== "quitting") {
    client.say(channel, `@${tags.username} type '!vote <game name>' if you want to play something.. BibleThump`)
    return
  }
  let same = state.quitVoters[tags.username] === "continue"
  let change = false
  if (state.quitVoters[tags.username]) {
    state.quitVotes[state.quitVoters[tags.username]]--
    change = true
  }
  state.quitVoters[tags.username] = "continue"
  state.quitVotes[state.quitVoters[tags.username]] = state.quitVotes[state.quitVoters[tags.username]] || 0
  state.quitVotes[state.quitVoters[tags.username]]++
  if (same) {
    client.say(channel, `@${tags.username} really likes this game! SeemsGood`)
  } else if (change) {
    client.say(channel, `@${tags.username} changed their mind and wants to keep playing ${games[state.currentGame].title}.. SeemsGood`)
  } else {
    client.say(channel, `@${tags.username} wants to keep playing ${games[state.currentGame].title}.. SeemsGood`)
  }
}

function joinParty(channel, tags, message, self) {
  let now = new Date()
  let minutes = 60 - now.getMinutes()
  let i = state.partyGoers.indexOf(tags.username)
  if (now.getMinutes() < 5) {
    client.say(channel, `@${tags.username} Welcome to the party! PartyTime`)
  } else if (i < 0) {
    client.say(channel, `@${tags.username} you're coming to the party? That's great! We'll see you back here in ${minutes} minutes then! Bring snacks and drinks! PartyTime`)
    state.partyGoers.push(tags.username)
    if (state.partyGoers.length === 1) {
      setTimeout(() => {
        state.partyGoers = []
        if (state.state === "playing") {
          startQuitting(config.channels[0])
        }
      }, 1000 * 60 * minutes)
    }
  } else {
    client.say(channel, `@${tags.username} excited for the party? That's great! We'll see you back here in ${minutes} minutes then! Bring snacks and drinks! PartyTime`)
  }
}

function startQuitting(channel) {
  state.state = "quitting"
  setTimeout(() => {
    client.say(channel, `Anyone else? Type '!exit', '!restart' or '!stay' in chat to vote! You now have one minute to vote!`)
  }, 1024)
  setTimeout(() => {
    let bestChoices = ["quit"]
    let bestVotes = 0
    for (let candidate in state.quitVotes) {
      if (state.quitVotes[candidate] > bestVotes) {
        bestChoices = []
        bestVotes = state.quitVotes[candidate]
      }
      if (state.quitVotes[candidate] === bestVotes) {
        bestChoices.push(candidate)
      }
    }
    let bestChoice = bestChoices[Math.floor(Math.random() * bestChoices.length)]
    if (bestChoice === "quit") {
      client.say(channel, `It's decided! We're not playing ${games[state.currentGame].title} anymore! ResidentSleeper`)
      process.exec(`start ./jackman.ahk exit`)
      state.state = "idle"
    } else if (bestChoice === "restart") {
      client.say(channel, `It's decided! We're restarting ${games[state.currentGame].title}! VoHiYo`)
      process.exec(`start ./jackman.ahk restart`)
      state.state = "playing"
    } else {
      client.say(channel, `It's decided! We'll continue playing ${games[state.currentGame].title}! SoonerLater`)
      process.exec(`start ./jackman.ahk continue`)
      state.state = "playing"
    }
    state.quitVotes = {}
    state.quitVoters = {}
  }, 60000)
}
function startVoting(channel) {
  state.state = "voting"
  client.say(channel, `Type '!list' to see a list of all available games. Read more about each game at https://www.jackboxgames.com/games/`)
  client.say(channel, `Type '!vote <game title>' to vote for a Jackbox game to play! You have one minute left to vote, if you haven't already!`)
  setTimeout(() => {
    let bestGames = []
    let bestVotes = 0
    for (let game in games) {
      if (games[game].playersMin <= state.chatters.length) {
        if (state.currentGame !== game) bestGames.push(game)
      }
    }
    for (let candidate in state.gameVotes) {
      if (state.gameVotes[candidate] > bestVotes) {
        bestGames = []
        bestVotes = state.gameVotes[candidate]
      }
      if (state.gameVotes[candidate] === bestVotes) {
        bestGames.push(candidate)
      }
    }
    let bestGame = bestGames[Math.floor(Math.random() * bestGames.length)]
    state.currentGame = bestGame
    client.say(channel, `It's decided! We're playing ${games[bestGame].title}! PogChamp`)
    process.exec(`start ./jackman.ahk start ${games[bestGame].pack} ${games[bestGame].game}`)
    state.state = "playing"
    setTimeout(() => {
      if (games[bestGame].playersMin > 1) {
        client.say(channel, `At least ${games[bestGame].playersMin} players are needed for ${games[bestGame].title}.. Invite some friends to the stream and have fun! PartyHat`)
      } else {
        client.say(channel, `You can play ${games[bestGame].title} by yourself or wait for other players.. Up to you.. GunRun`)
      }
    }, 1024 * 64 * 1)
    setTimeout(() => {
      client.say(channel, `Keep the chat alive during a game. If the chat is idle for more than 15 minutes, I'll assume nobody is playing and end the game. PoroSad`)
    }, 1024 * 64 * 2)
    setTimeout(() => {
      client.say(channel, `If you've joined a game and don't wanna play anymore, please type '!restart' in chat before you leave so others can take your place. HeyGuys`)
    }, 1024 * 64 * 4)
    state.gameVotes = {}
    state.gameVoters = {}
    state.chatters = []
  }, 60000)
}

setInterval(() => {
  if (state.state === "idle") {
    startVoting(config.channels[0])
  }
}, 4096)
function lonely(channel) {
  client.say(config.channels[0], `Is anyone there? type '!stay' in chat to keep playing!`)
  if (state.state === "playing") {
    startQuitting(config.channels[0])
  }
}

function resolveGame(words) {
  let title = words.join(" ").toLowerCase().replace(/[^\w]/g, "")
  let result = []
  for (let game in games) {
    if (games[game].title.toLowerCase().replace(/[^\w]/g, "") === title) return game
    games[game].id = game
    result.push(games[game])
  }

  for (let word of words) {
    let newresult = []
    for (let game of result) {
      if (game.title.toLowerCase().replace(/[^\w]/g, "").includes(word.toLowerCase().replace(/[^\w]/g, ""))) {
        newresult.push(game)
      }
    }
    if (newresult.length) result = newresult
  }

  let bestGame = result[Math.floor(Math.random() * result.length)]
  return bestGame.id
}



/// web server ///

const http = require("http"),
  fs = require("fs"),
  path = require("path")

const hostname = "127.0.0.1"
const port = 3000

const server = http.createServer((req, res) => {
  let file = req.url.slice(0, ((req.url + "?")).indexOf("?"))
  if (file === "/state.json") {
    res.setHeader("Content-Type", "application/json; charset=utf-8")
    res.statusCode = 200
    return res.end(JSON.stringify(state, null, 2))
  }
  if (file === "/games.js") {
    res.setHeader("Content-Type", "application/javascript; charset=utf-8")
    res.statusCode = 200
    return res.end('window.games = ' + JSON.stringify(games, null, 2))
  }
  if (file === "/present.js") {
    res.setHeader("Content-Type", "application/javascript; charset=utf-8")
    res.statusCode = 200
    return res.end(`present=true`)
  }
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Cache-Control", "max-age=4096")
  let filename = "./web" + file
  if (filename.slice(-1) === "/") {
    filename += "index.html"
  }
  let ext = filename.slice(filename.lastIndexOf("."))
  switch (ext) {
    case ".html":
      res.setHeader("Content-Type", "text/html; charset=utf-8")
      break
    case ".css":
      res.setHeader("Content-Type", "text/css; charset=utf-8")
      break
    case ".js":
      res.setHeader("Content-Type", "application/javascript; charset=utf-8")
      break
    default:
      res.setHeader("Content-Type", "text/plain; charset=utf-8")
  }
  fs.readFile(filename, (err, data) => {
    if (err) {
      res.statusCode = 404
      res.end("<h1>not found!")
    } else {
      res.statusCode = 200
      res.end(data)
    }
  })
})

server.listen(port, "", () => {
  console.log(`Server running at http://${hostname}:${port}/`)
})
