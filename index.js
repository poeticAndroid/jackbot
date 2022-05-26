const
  tmi = require('tmi.js'),
  config = require("./config.json"),
  process = require("child_process"),
  games = require("./games.json")

process.exec(`start ./jackman.ahk exit`)

const state = {
  "state": "idle"
}
const client = new tmi.Client(config)
let loneliness

client.connect().catch(console.error)
client.on('message', (channel, tags, message, self) => {
  clearTimeout(loneliness)
  loneliness = setInterval(() => {
    lonely(channel)
  }, 1024 * 64 * 16)
  if (self) return
  if (message.slice(0, 1) === '!') {
    let cmd = message.split(" ")
    switch (cmd[0]) {
      case "!hello":
        client.say(channel, `@${tags.username} greetings! HeyGuys`)
        break

      case "!help":
      case "!commands":
        client.say(channel, `!newgame, !endgame, !exit, !quit - Vote to quit the current game and play something else.`)
        client.say(channel, `!play, !stay, !continue - Vote to NOT quit the current game and keep playing.`)
        client.say(channel, `!restart - Vote to restart the current game.`)
        client.say(channel, `!list, !games - List all available games.`)
        client.say(channel, `!src, !source - Link to source on Github.`)
        client.say(channel, `!vote <game title> - Vote on a specific Jackbox game to play.`)
        break

      case "!list":
      case "!games":
        listGames(channel, tags, message, self)
        break

      case "!src":
      case "!source":
        client.say(channel, `https://github.com/poeticAndroid/jackbot`)
        listGames(channel, tags, message, self)
        break

      case "!vote":
        voteGame(channel, tags, message, self)
        break

      case "!newgame":
      case "!exit":
      case "!quit":
        voteExit(channel, tags, message, self)
        break

      case "!play":
      case "!stay":
      case "!continue":
        voteStay(channel, tags, message, self)
        break

      case "!restart":
        voteRestart(channel, tags, message, self)
        break

    }
  }
})

function listGames(channel, tags, message, self) {
  let titles = []
  for (let game in games) {
    titles.push(games[game].title)
  }
  titles.sort()
  client.say(channel, "Available games: " + titles.join(", "))
}

function voteGame(channel, tags, message, self) {
  let cmd = message.split(" ")
  if (state.state === "idle") {
    startVoting(channel)
  }
  let gameId = resolveGame(cmd.slice(1))
  let game = games[gameId]
  if (game) {
    if (state.state !== "voting") {
      client.say(channel, `@${tags.username} type '!newgame' if you want to play something else.. BibleThump`)
      return
    }
    if (state.voters[tags.username]) {
      state.votes[state.voters[tags.username]]--
    }
    state.voters[tags.username] = gameId
    state.votes[state.voters[tags.username]] = state.votes[state.voters[tags.username]] || 0
    state.votes[state.voters[tags.username]]++
    client.say(channel, `@${tags.username} wants to play ${game.title}! SeemsGood`)
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
  if (state.voters[tags.username]) {
    state.votes[state.voters[tags.username]]--
  }
  state.voters[tags.username] = "restart"
  state.votes[state.voters[tags.username]] = state.votes[state.voters[tags.username]] || 0
  state.votes[state.voters[tags.username]]++
  client.say(channel, `@${tags.username} wants to restart this game.. SeemsGood`)
}

function voteExit(channel, tags, message, self) {
  if (state.state === "playing") {
    startQuitting(channel)
  }
  if (state.state !== "quitting") {
    client.say(channel, `@${tags.username} type '!vote <game name>' if you want to play something.. BibleThump`)
    return
  }
  if (state.voters[tags.username]) {
    state.votes[state.voters[tags.username]]--
  }
  state.voters[tags.username] = "quit"
  state.votes[state.voters[tags.username]] = state.votes[state.voters[tags.username]] || 0
  state.votes[state.voters[tags.username]]++
  client.say(channel, `@${tags.username} don't want to play this game anymore.. SeemsGood`)
}

function voteStay(channel, tags, message, self) {
  if (state.state === "playing") {
    startQuitting(channel)
  }
  if (state.state !== "quitting") {
    client.say(channel, `@${tags.username} type '!vote <game name>' if you want to play something.. BibleThump`)
    return
  }
  if (state.voters[tags.username]) {
    state.votes[state.voters[tags.username]]--
  }
  state.voters[tags.username] = "continue"
  state.votes[state.voters[tags.username]] = state.votes[state.voters[tags.username]] || 0
  state.votes[state.voters[tags.username]]++
  client.say(channel, `@${tags.username} wants to keep playing this game.. SeemsGood`)
}

function startQuitting(channel) {
  state.state = "quitting"
  state.votes = {}
  state.voters = {}
  setTimeout(() => {
    let bestChoices = ["quit"]
    let bestVotes = 0
    for (let candidate in state.votes) {
      if (state.votes[candidate] > bestVotes) {
        bestChoices = []
        bestVotes = state.votes[candidate]
      }
      if (state.votes[candidate] === bestVotes) {
        bestChoices.push(candidate)
      }
    }
    let bestChoice = bestChoices[Math.floor(Math.random() * bestChoices.length)]
    if (bestChoice === "quit") {
      client.say(channel, `It's decided! We're not playing this game anymore! ResidentSleeper`)
      process.exec(`start ./jackman.ahk exit`)
      state.state = "idle"
    } else if (bestChoice === "restart") {
      client.say(channel, `It's decided! We're restarting the game! VoHiYo`)
      process.exec(`start ./jackman.ahk restart`)
      state.state = "playing"
    } else {
      client.say(channel, `It's decided! We'll continue playing this game! SoonerLater`)
      process.exec(`start ./jackman.ahk continue`)
      state.state = "playing"
    }
  }, 60000)
}
function startVoting(channel) {
  state.state = "voting"
  state.votes = {}
  state.voters = {}
  setTimeout(() => {
    let bestGames = []
    let bestVotes = 0
    for (let game in games) {
      bestGames.push(game)
    }
    for (let candidate in state.votes) {
      if (state.votes[candidate] > bestVotes) {
        bestGames = []
        bestVotes = state.votes[candidate]
      }
      if (state.votes[candidate] === bestVotes) {
        bestGames.push(candidate)
      }
    }
    let bestGame = bestGames[Math.floor(Math.random() * bestGames.length)]
    state.currentGame = bestGame
    client.say(channel, `It's decided! We're playing ${games[bestGame].title}! PogChamp`)
    process.exec(`start ./jackman.ahk start ${games[bestGame].pack} ${games[bestGame].game}`)
    state.state = "playing"
    setTimeout(() => {
      client.say(channel, `If you join a game and don't wanna play anymore, please type '!restart' in chat before you leave. HeyGuys`)
    }, 1024 * 64 * 4)
  }, 60000)
  client.say(channel, `Type '!list' to see a list of all available games.`)
  client.say(channel, `Type '!vote <game title>' to vote for a Jackbox game to play!`)
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
  let result = []
  for (let game in games) {
    games[game].id = game
    result.push(games[game])
  }

  for (let word of words) {
    let newresult = []
    for (let game of result) {
      if (game.title.toLowerCase().includes(word.toLowerCase())) {
        newresult.push(game)
      }
    }
    if (newresult.length) result = newresult
  }

  let bestGame = result[Math.floor(Math.random() * result.length)]
  return bestGame.id
}



/// web server ///

/*
const http = require("http"),
  fs = require("fs"),
  path = require("path")

const hostname = "127.0.0.1"
const port = 3000

const server = http.createServer((req, res) => {
  if (req.url === "/state.json") {
    res.setHeader("Content-Type", "application/json; charset=utf-8")
    res.statusCode = 200
    return res.end(JSON.stringify(state, null, 2))
  }
  if (req.url === "/games.js") {
    res.setHeader("Content-Type", "application/javascript; charset=utf-8")
    res.statusCode = 200
    return res.end('window.games = ' + JSON.stringify(games, null, 2))
  }
  res.setHeader("Cache-Control", "max-age=4096")
  let filename = "./web" + req.url
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
*/
