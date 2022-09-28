let state
let hands = ["✊", "👍", "🤘", "🤟", "✋", "🖐", "🖖", "👏", "🙏", "🙌"]

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

function tick(_state) {
  document.querySelector("#debug").textContent = JSON.stringify(_state, null, 2)
  if (state && (_state.state !== state.state)) {
    document.querySelector("html").classList.remove(state.state + "-state")
  }
  state = _state
  document.querySelector("html").classList.add(state.state + "-state")

  updateQuitVotes(state.quitVotes, state.state === "quitting", state.quitVoteTime)
  updateGameVotes(state.gameVotes, state.state === "voting", state.gameVoteTime)
  updatePartyTicker(state.parties)
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
  let hour = now.getHours() + 1
  if (hour > 23) hour = 0
  let nextParty = markupNames(state.parties[hour] || [])

  let el = document.querySelector("#partyTicker")
  if (minutesLeft > 59) {
    el.innerHTML = `🎉🎉🎉 It's party time! 🎉🎉🎉`
    el.classList.add("partyTime")
  } else if (minutesLeft < 2) {
    el.innerHTML = `The <code>!party</code> is about to start! 😲`
    el.classList.remove("partyTime")
  } else if (nextParty.length > 1) {
    el.innerHTML = `Next <code>!party</code> starts in ${minutesLeft} minutes! ${listify(nextParty)} are coming!`
    el.classList.remove("partyTime")
  } else if (nextParty.length) {
    el.innerHTML = `Next <code>!party</code> starts in ${minutesLeft} minutes! ${listify(nextParty)} is coming!`
    el.classList.remove("partyTime")
  } else {
    el.innerHTML = `Next <code>!party</code> starts in ${minutesLeft} minutes! Are you coming?`
    el.classList.remove("partyTime")
  }
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
