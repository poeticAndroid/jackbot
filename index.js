{
  const fs = require("fs")
  if (!fs.existsSync("./parties.json")) {
    fs.writeFileSync("./parties.json", "[]")
  }
}

const
  tmi = require('tmi.js'),
  config = require("./config.json"),
  process = require("child_process"),
  games = require("./games.json")

process.exec(`start ./jackman.ahk exit`)

const state = {
  state: "idle",
  gameVoteTime: 120,
  gameVotes: {},
  gameVoters: {},
  quitVoteTime: 60,
  quitVotes: {},
  quitVoters: {},
  chatters: [],
  parties: require("./parties.json"),
  partyGuests: []
}
const client = new tmi.Client(config)
let loneliness, exitReminder, chilled
let voteTO

client.connect().catch(console.error)
client.on('message', (channel, tags, message, self) => {
  if (nextParty(2).length) {
    nextParty(2).length = 0
    setTimeout(() => {
      fs.writeFileSync("./parties.json", JSON.stringify(state.parties, null, 2))
    }, 600 * 1000)
  }
  state.idleSince = Date.now()
  clearTimeout(loneliness)
  loneliness = setInterval(() => {
    lonely(channel)
  }, 1000 * 60 * 15)
  if (!state.chatters.includes(tags["display-name"])) {
    state.chatters.push(tags["display-name"])
  }
  if (thisParty().includes(tags["display-name"])) {
    thisParty().splice(thisParty().indexOf(tags["display-name"]), 1)
    state.partyGuests.push(tags["display-name"])
    client.say(channel, `@${tags["display-name"]} welcome to the party! So glad you could come! PartyTime`)
  }
  if (self) return
  if (message.slice(0, 1) === '!') {
    let cmd = message.trim().toLowerCase().split(/\s+/)
    if (cmd[0] === "!") {
      cmd.shift()
      cmd[0] = "!" + cmd[0]
    }
    switch (cmd[0]) {
      case "!crash":
        if (isMod(tags.username)) throw "crash!"
        break

      case "!hello":
        client.say(channel, `@${tags["display-name"]} greetings! HeyGuys`)
        break

      case "!secret":
        client.say(channel, `@${tags["display-name"]} congratulations! You found the secret command! Use it responsibly PowerUpL MingLee PowerUpR`)
        break

      case "!streamers":
        if (!chilled) getStreamers().then(streamers => {
          client.say(channel, streamers.join(", "))
        })
        chilled = true
        break

      case "!help":
      case "!commands":
        let now = new Date()
        let minutesLeft = 60 - now.getMinutes()
        client.say(channel, `!list - List all available games and number of players required.`)
        client.say(channel, `!vote <game title> - Vote on a Jackbox game to play.`)
        client.say(channel, `!exit/!restart/!stay - vote for ending/restarting/keep playing the current game.`)
        // client.say(channel, `!party - Promise to be back here in ${minutesLeft} minutes for the next party!`)
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
  setTimeout(() => {
    client.say(channel, "Read more about the games at https://www.jackboxgames.com/games/#:~:text=Games%20in%20Party%20Packs")
  }, 1024)
}

function voteGame(channel, tags, message, self) {
  let weight = 1
  let cmd = message.trim().toLowerCase().split(/\s+/)
  if (!cmd[1]) {
    client.say(channel, `@${tags["display-name"]} forgot to give a title! Type '!vote' followed by the game title.. (or just some of it) BibleThump`)
    return
  }
  if (state.state === "idle") {
    startVoting(channel)
  }
  let gameId = resolveGame(cmd.slice(1))
  let game = games[gameId]
  if (game) {
    let same = state.gameVoters[tags["display-name"]] === gameId
    let change, alreadyPlaying
    if (state.gameVoters[tags["display-name"]]) {
      state.gameVotes[state.gameVoters[tags["display-name"]]] -= weight
      change = true
    }
    if (state.state === "playing" && state.currentGame === gameId) {
      alreadyPlaying = true
    } else {
      state.gameVoters[tags["display-name"]] = gameId
      state.gameVotes[state.gameVoters[tags["display-name"]]] = state.gameVotes[state.gameVoters[tags["display-name"]]] || 0
      state.gameVotes[state.gameVoters[tags["display-name"]]] += weight
      if (state.state !== "voting") state.gameVoteTime = 10
    }
    if (alreadyPlaying) {
      client.say(channel, `@${tags["display-name"]} we're already playing ${game.title}! Did you mean to '!restart' it?`)
    } else if (same) {
      client.say(channel, `@${tags["display-name"]} dont worry. I haven't forgotten your vote for ${game.title}! SeemsGood`)
    } else if (change) {
      client.say(channel, `@${tags["display-name"]} changed their mind and would rather play ${game.title} instead. SeemsGood`)
    } else {
      client.say(channel, `@${tags["display-name"]} wants to play ${game.title}! SeemsGood`)
    }
    if (state.state === "playing" && !exitReminder) {
      client.say(channel, `We're currently playing ${games[state.currentGame].title}. Type '!exit' to vote for ending this game.`)
      exitReminder = setTimeout(() => {
        exitReminder = false
      }, 1024 * 64)
    }
  } else {
    client.say(channel, `@${tags["display-name"]} I don't know the game ${cmd.slice(1).join(" ")}! BibleThump`)
  }
}

function voteRestart(channel, tags, message, self) {
  let weight = 1
  if (isMod(tags.username) && message.toLowerCase().includes(" now")) {
    weight = 1024
    rushQuitVote(channel)
  }
  if (state.state === "playing") startQuitting(channel)
  if (state.state !== "quitting") {
    client.say(channel, `@${tags["display-name"]} type '!vote <game name>' if you want to play something.. BibleThump`)
    return
  }
  let same = state.quitVoters[tags["display-name"]] === "restart"
  let change = false
  if (state.quitVoters[tags["display-name"]]) {
    state.quitVotes[state.quitVoters[tags["display-name"]]] -= weight
    change = true
  }
  state.quitVoters[tags["display-name"]] = "restart"
  state.quitVotes[state.quitVoters[tags["display-name"]]] = state.quitVotes[state.quitVoters[tags["display-name"]]] || 0
  state.quitVotes[state.quitVoters[tags["display-name"]]] += weight
  if (same) {
    if (isMod(tags.username)) rushQuitVote(channel)
    else client.say(channel, `@${tags["display-name"]} can't wait to start over! SeemsGood`)
  } else if (change) {
    client.say(channel, `@${tags["display-name"]} changed their mind and wants to restart ${games[state.currentGame].title} instead.. SeemsGood`)
  } else {
    client.say(channel, `@${tags["display-name"]} wants to restart ${games[state.currentGame].title}.. SeemsGood`)
  }
}

function voteExit(channel, tags, message, self) {
  let weight = 1
  if (isMod(tags.username) && message.toLowerCase().includes(" now")) {
    weight = 1024
    rushQuitVote(channel)
  }
  if (state.state === "playing") startQuitting(channel)
  if (state.state !== "quitting") {
    client.say(channel, `@${tags["display-name"]} type '!vote <game name>' if you want to play something.. BibleThump`)
    return
  }
  let same = state.quitVoters[tags["display-name"]] === "quit"
  let change = false
  if (state.quitVoters[tags["display-name"]]) {
    state.quitVotes[state.quitVoters[tags["display-name"]]] -= weight
    change = true
  }
  state.quitVoters[tags["display-name"]] = "quit"
  state.quitVotes[state.quitVoters[tags["display-name"]]] = state.quitVotes[state.quitVoters[tags["display-name"]]] || 0
  state.quitVotes[state.quitVoters[tags["display-name"]]] += weight
  if (same) {
    if (isMod(tags.username)) rushQuitVote(channel)
    else client.say(channel, `@${tags["display-name"]} is so impatient! SeemsGood`)
  } else if (change) {
    client.say(channel, `@${tags["display-name"]} changed their mind and dont't want to play ${games[state.currentGame].title} after all.. SeemsGood`)
  } else {
    client.say(channel, `@${tags["display-name"]} don't want to play ${games[state.currentGame].title} anymore.. SeemsGood`)
  }
}

function voteStay(channel, tags, message, self) {
  let weight = 1
  if (isMod(tags.username) && message.toLowerCase().includes(" now")) {
    weight = 1024
    rushQuitVote(channel)
  }
  if (state.state === "playing") startQuitting(channel)
  if (state.state !== "quitting") {
    client.say(channel, `@${tags["display-name"]} type '!vote <game name>' if you want to play something.. BibleThump`)
    return
  }
  let same = state.quitVoters[tags["display-name"]] === "continue"
  let change = false
  if (state.quitVoters[tags["display-name"]]) {
    state.quitVotes[state.quitVoters[tags["display-name"]]] -= weight
    change = true
  }
  state.quitVoters[tags["display-name"]] = "continue"
  state.quitVotes[state.quitVoters[tags["display-name"]]] = state.quitVotes[state.quitVoters[tags["display-name"]]] || 0
  state.quitVotes[state.quitVoters[tags["display-name"]]] += weight
  if (same) {
    if (isMod(tags.username)) rushQuitVote(channel)
    else client.say(channel, `@${tags["display-name"]} really likes this game! SeemsGood`)
  } else if (change) {
    client.say(channel, `@${tags["display-name"]} changed their mind and wants to keep playing ${games[state.currentGame].title}.. SeemsGood`)
  } else {
    client.say(channel, `@${tags["display-name"]} wants to keep playing ${games[state.currentGame].title}.. SeemsGood`)
  }
}

function joinParty(channel, tags, message, self) {
  let party = nextParty()
  let now = new Date()
  let minutes = 60 - now.getMinutes()
  let i = party.indexOf(tags['display-name'])
  if (now.getMinutes() < 1) {
    client.say(channel, `@${tags["display-name"]} The party just started! Stay a while! PartyTime`)
  } else if (i < 0) {
    client.say(channel, `@${tags["display-name"]} you're coming to the party? That's great! We'll see you back here in ${minutes} minutes! Bring snacks and drinks! PartyTime`)
    party.push(tags['display-name'])
    fs.writeFileSync("./parties.json", JSON.stringify(state.parties, null, 2))
  } else {
    client.say(channel, `@${tags["display-name"]} oh... You're not coming to the party after all..? oh well... BibleThump`)
    party.splice(i, 1)
  }
}

function startQuitting(channel) {
  clearTimeout(voteTO)
  state.state = "quitting"
  setTimeout(() => {
    client.say(channel, `Anyone else? Type '!exit', '!restart' or '!stay' in chat to vote! You now have ${state.quitVoteTime} seconds to vote!`)
  }, 1024)
  voteTO = setTimeout(() => {
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
    state.quitVoteTime = 60
  }, 1000 * state.quitVoteTime)
}
function startVoting(channel) {
  clearTimeout(voteTO)
  state.state = "voting"
  // client.say(channel, `Type '!list' to see a list of all available games. Read more about each game at https://www.jackboxgames.com/games/`)
  client.say(channel, `Type '!vote <game title>' to vote for a Jackbox game to play! You have ${state.gameVoteTime} seconds left to vote, if you haven't already!`)
  voteTO = setTimeout(() => {
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
      client.say(channel, `Keep the chat alive during a game. If the chat is idle for 15 minutes, I'll assume nobody is playing and end the game. PoroSad`)
    }, 1024 * 64 * 2)
    setTimeout(() => {
      client.say(channel, `If you've joined a game and don't wanna play anymore, please type '!restart' in chat before you leave so others can take your place. HeyGuys`)
    }, 1024 * 64 * 4)
    state.gameVotes = {}
    state.gameVoters = {}
    state.chatters = []
    state.gameVoteTime = 60
  }, 1000 * state.gameVoteTime)
}
function rushQuitVote(channel) {
  state.quitVoteTime = 1
  startQuitting(channel)
}

setInterval(() => {
  if (state.state === "idle") {
    startVoting(config.channels[0])
  }
}, 4096)
function lonely(channel) {
  client.say(channel, `Is anyone there? type '!stay' in chat to keep playing!`)
  if (state.state === "playing") startQuitting(channel)
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

function nextParty(plus = 1) {
  let now = new Date()
  let hour = now.getHours() + plus
  if (hour > 23) hour -= 24
  state.parties[hour] = state.parties[hour] || []
  return state.parties[hour]
}
function thisParty() {
  let now = new Date()
  let hour = now.getHours()
  state.parties[hour] = state.parties[hour] || []
  return state.parties[hour]
}

function isMod(username) {
  if (username.toLowerCase() === config.identity.username.toLowerCase()) return true
  config.mods = config.mods || []
  for (let mod of config.mods) {
    if (mod.toLowerCase() === username.toLowerCase()) return true
  }
  return false
}

async function getStreamers(game = "Jackbox Party Packs") {
  let url = `https://m.twitch.tv/directory/game/${encodeURI(game)}`
  // let res = await fetch(url)
  let html = await httpsGet(url)
  let names = []
  let all = []
  let i = html.indexOf("tw-link")
  do {
    let name = html.slice(html.indexOf(">", i) + 1, html.indexOf("<", i))
    if (all.includes(name)) {
      if (names.includes(name)) names.splice(names.indexOf(name), 1)
    } else {
      all.push(name)
      names.push(name)
    }
    i = html.indexOf(" tw-link\"", i + 1)
  } while (i > 0)
  return names
}

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const https = require('node:https')

    https.get(url, (res) => {
      let data = ""
      res.on('data', (d) => {
        data += d
      })
      res.on('close', (d) => {
        resolve(data)
      })

    }).on('error', (e) => {
      reject(e)
    })
  })
}


/// web server ///

const http = require("http"),
  fs = require("fs"),
  path = require("path")
const { rejects } = require("assert")

const hostname = "127.0.0.1"
const port = 3000

const server = http.createServer((req, res) => {
  let file = req.url.slice(0, ((req.url + "?")).indexOf("?"))
  if (file === "/state.json") {
    res.setHeader("Content-Type", "application/json; charset=utf-8")
    res.statusCode = 200
    let json = JSON.stringify(state, null, 2)
    state.partyGuests = []
    return res.end(json)
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
