let state
let hands = ["✊", "👍", "🤘", "🤟", "✋", "🖐", "🖖", "👏", "🙏", "🙌"]
let music = [
  "./music/AuditoryCheesecake_DressForIt.mp3",
  "./music/AuditoryCheesecake_Fresh.mp3",
  "./music/AuditoryCheesecake_Greystone.mp3",
  "./music/AuditoryCheesecake_Mathias.mp3",
  "./music/AuditoryCheesecake_Paradox.mp3",
  "./music/AuditoryCheesecake_Rotary.mp3",
  "./music/AuditoryCheesecake_Salida.mp3",
  "./music/AuditoryCheesecake_Twentyone.mp3",
  "./music/AuditoryCheesecake_Vines.mp3",
]
document.querySelector("#radioSnd").src = music.shift()
let giphyKey = "I7yGdZNsyPKmrAIfougyqHo1BazGilF8"
let partyGifs = []
refillGifs()

setInterval(() => {
  fetch("./state.json").then(resp => {
    if (resp.status !== 200) {
      history.back()
      setTimeout(() => {
        location.reload(true)
      }, 4096)
    }
    resp.json().then(state => {
      tick(state)
    })
  }).catch(err => {
    history.back()
    setTimeout(() => {
      location.reload(true)
    }, 4096)
  })
}, 1000)
setInterval(updatePartyGuest, 8192)
addEventListener("click", e => {
  document.querySelector("#guestSnd").play()
})

function tick(_state) {
  document.querySelector("#debug").textContent = JSON.stringify(_state, null, 2)
  if (state && (_state.state !== state.state)) {
    document.querySelector("html").classList.remove(state.state + "-state")
  }
  while (state?.partyGuests.length) _state.partyGuests.push(state.partyGuests.pop())
  state = _state
  document.querySelector("html").classList.add(state.state + "-state")

  updateQuitVotes(state.quitVotes, state.state === "quitting", state.quitVoteTime)
  updateGameVotes(state.gameVotes, state.state === "voting", state.gameVoteTime)
  updatePartyTicker(state.parties)

  let radio = document.querySelector("#radioSnd")
  if (state.state === "voting") {
    if (radio.ended) {
      music.push(radio.src)
      radio.src = music.shift()
    } else {
      radio.play()
      if (radio.volume < 0.5) {
        radio.volume += 0.0625
      }
    }
  } else {
    if (radio.volume > 0) {
      radio.volume -= 0.0625
    } else {
      radio.pause()
    }
  }
}

function updateQuitVotes(votes, count, max) {
  if (count) {
    document.querySelector("#quit-voting meter").value++
  } else {
    document.querySelector("#quit-voting meter").value = 0
    document.querySelector("#quit-voting meter").max = max
    return
  }
  let highest = -1
  for (let opt of ["quit", "restart", "continue"]) {
    let el = document.getElementById(opt + "-votes")
    if (!el) {
      el = document.createElement("tr")
      el.id = opt + "-votes"
      el.innerHTML = `<td><code>!${opt}</code></td><td class="count">?</td>`
      document.querySelector("#quit-voting tbody").appendChild(el)
    }
    el.dataset.count = votes[opt] || 0
    el.querySelector(".count").textContent = (parseFloat(el.dataset.count) ? hands[parseInt(el.dataset.count)] : "") + el.dataset.count
    if (highest < parseFloat(el.dataset.count)) highest = parseFloat(el.dataset.count)
  }
  if (highest === 0) {
    document.getElementById("quit-votes").dataset.count = 1
    highest++
  }
  let els = [].concat(...document.querySelectorAll("#quit-voting tbody tr"))
  els.sort((a, b) => { return parseFloat(b.dataset.count) - parseFloat(a.dataset.count) + Math.random() - .5 })
  for (let el of els) {
    if (highest === parseFloat(el.dataset.count)) el.classList.add("top")
    else el.classList.remove("top")
    document.querySelector("#quit-voting tbody").removeChild(el)
    document.querySelector("#quit-voting tbody").appendChild(el)
  }
}
function updateGameVotes(votes, count, max) {
  if (count) {
    document.querySelector("#game-voting meter").value++
  } else {
    document.querySelector("#game-voting meter").value = 0
    document.querySelector("#game-voting meter").max = max
    document.querySelector("#game-voting tbody").innerHTML = ""
    // return
  }
  let highest = -1
  for (let game in votes) {
    let el = document.getElementById(game + "-gamevotes")
    if (!el) {
      el = document.createElement("tr")
      el.id = game + "-gamevotes"
      el.innerHTML = `<td>${games[game].title}</td><td class="count">?</td>`
      document.querySelector("#game-voting tbody").appendChild(el)
    }
    el.dataset.count = votes[game] || 0
    el.querySelector(".count").textContent = (parseFloat(el.dataset.count) ? hands[parseInt(el.dataset.count)] : "") + el.dataset.count
    if (highest < parseFloat(el.dataset.count)) highest = parseFloat(el.dataset.count)
  }
  if (highest === 0) highest--
  let els = [].concat(...document.querySelectorAll("#game-voting tbody tr"))
  els.sort((a, b) => { return parseFloat(b.dataset.count) - parseFloat(a.dataset.count) + Math.random() - .5 })
  for (let el of els) {
    if (highest === parseFloat(el.dataset.count)) el.classList.add("top")
    else el.classList.remove("top")
    document.querySelector("#game-voting tbody").removeChild(el)
    document.querySelector("#game-voting tbody").appendChild(el)
  }
}

function updatePartyTicker(parties = []) {
  let now = new Date()
  let minutesLeft = 60 - now.getMinutes()
  let hour = now.getHours()
  let thisParty = markupNames(state.parties[hour] || [])
  hour++
  if (hour > 23) hour = 0
  let nextParty = markupNames(state.parties[hour] || [])

  let el = document.querySelector("#partyTicker")
  if (minutesLeft > 59) {
    if (!el.classList.contains("partyTime"))
      document.querySelector("#partySnd").play()
    el.classList.add("partyTime")
  } else {
    el.classList.remove("partyTime")
  }
  if (minutesLeft > 59) {
    el.innerHTML = ` 🎉 🎉 🎉 It's party time! 🎉 🎉 🎉 `
  } else if (minutesLeft < 2) {
    el.innerHTML = `The party is about to start! 😲`
  } else if (minutesLeft > 50 && thisParty.length) {
    el.innerHTML = `The party has begun! Waiting for ${listify(thisParty)} to appear in chat...`
  } else if (nextParty.length) {
    el.innerHTML = `The next party starts in ${minutesLeft} minutes! ${listify(nextParty)} will be here! Type <code>!party</code> if you're coming too!`
  } else {
    el.innerHTML = `The next party starts in ${minutesLeft} minutes! Type <code>!party</code> if you plan on coming!`
  }
}
function updatePartyGuest() {
  let el = document.querySelector(".partyGuest")
  if (state.partyGuests.length) {
    let name = state.partyGuests.pop()
    el.querySelector(".name").textContent = name
    el.classList.add("new")
    document.querySelector("#guestSnd").play()
    setTimeout(() => {
      el.classList.remove("new")
      if (partyGifs.length) el.querySelector("img").src = partyGifs.pop()
      if (!partyGifs.length) refillGifs()
    }, 8000)
  }
}

function refillGifs() {
  fetch("./giphy.json?q=party&api_key=" + giphyKey).then(resp => {
    if (resp.status !== 200) {
      return
    }
    resp.json().then(respJson => {
      while (respJson?.data?.length) {
        partyGifs.splice(Math.floor(Math.random() * partyGifs.length), 0, respJson.data.pop().images.downsized_medium.url)
      }
      if (partyGifs.length) el.querySelector("img").src = partyGifs.pop()
    })
  })
}

function markupNames(names) {
  for (let i = 0; i < names.length; i++) {
    names[i] = `<span class="name">` + names[i] + `</span>`
  }
  return names
}

function listify(list) {
  if (!list.length) return ""
  if (list.length === 1) return list[0]
  list = JSON.parse(JSON.stringify(list))
  let str = list.pop()
  let glue = " and "
  while (list.length) {
    str = list.pop() + glue + str
    glue = ", "
  }
  return str
}
