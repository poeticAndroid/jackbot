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
