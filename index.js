const
  tmi = require('tmi.js'),
  process = require("child_process"),
  games = require("./games.json")

process.exec(`start ./games/_shutdown.ahk`)

const state = {
  "state": "idle"
}
const client = new tmi.Client(require("./config.json"))

client.connect().catch(console.error)
client.on('message', (channel, tags, message, self) => {
  if (self) return
  if (message.slice(0, 1) === '!') {
    let cmd = message.split(" ")
    switch (cmd[0]) {
      case "!hello":
        client.say(channel, `@${tags.username} greetings! HeyGuys`)
        break

      case "!game":
        let game = games[cmd[1]]
        if (game) {
          if (state.state === "idle") {
            state.state = "voting"
            state.votes = {}
            state.voters = {}
            setTimeout(() => {
              let bestGames = ["draw"]
              let bestVotes = 0
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
              client.say(channel, `It's decided! We're playing ${games[bestGame].title}! PogChamp`)
              process.exec(`start ./games/${games[bestGame].name}.ahk`)
              state.state = "playing"
            }, 60000)
          }
          if (state.state !== "voting") {
            client.say(channel, `@${tags.username} type '!quit' if you want to play something else.. BibleThump`)
            return
          }
          if (state.voters[tags.username]) {
            state.votes[state.voters[tags.username]]--
          }
          state.voters[tags.username] = cmd[1]
          state.votes[state.voters[tags.username]] = state.votes[state.voters[tags.username]] || 0
          state.votes[state.voters[tags.username]]++
          client.say(channel, `@${tags.username} wants to play ${game.title}! SeemsGood`)
        } else {
          client.say(channel, `@${tags.username} I don't know the game ${cmd[1]}! BibleThump`)
        }
        break

      case "!quit":
        if (state.state === "playing") {
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
              process.exec(`start ./games/_shutdown.ahk`)
              state.state = "idle"
            } else {
              client.say(channel, `It's decided! We continue playing this game! SoonerLater`)
              process.exec(`start ./games/_enter.ahk`)
              state.state = "playing"
            }
          }, 60000)
        }
        if (state.state !== "quitting") {
          client.say(channel, `@${tags.username} type '!game' if you want to play something.. BibleThump`)
          return
        }
        if (state.voters[tags.username]) {
          state.votes[state.voters[tags.username]]--
        }
        state.voters[tags.username] = "quit"
        state.votes[state.voters[tags.username]] = state.votes[state.voters[tags.username]] || 0
        state.votes[state.voters[tags.username]]++
        client.say(channel, `@${tags.username} wants to play something else.. SeemsGood`)
        break

      case "!continue":
        if (state.state !== "quitting") {
          client.say(channel, `@${tags.username} type '!game' if you want to play something.. BibleThump`)
          return
        }
        if (state.voters[tags.username]) {
          state.votes[state.voters[tags.username]]--
        }
        state.voters[tags.username] = "continue"
        state.votes[state.voters[tags.username]] = state.votes[state.voters[tags.username]] || 0
        state.votes[state.voters[tags.username]]++
        client.say(channel, `@${tags.username} wants to keep playing this game.. SeemsGood`)
        break

      default:
        client.say(channel, `@${tags.username} I don't know how to ${cmd[0].slice(1)}! BibleThump`)
        break
    }
  }
})



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
