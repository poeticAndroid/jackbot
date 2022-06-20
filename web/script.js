let state

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
}, 1024)

function tick(_state) {
  document.querySelector("#debug").textContent = JSON.stringify(_state, null, 2)
  if (state && (_state.state !== state.state)) {
    document.querySelector("html").classList.remove(state.state + "-state")
  }
  state = _state
  document.querySelector("html").classList.add(state.state + "-state")

  updateQuitVotes(state.quitVotes, state.state === "quitting")
  updateGameVotes(state.gameVotes, state.state === "voting")
}

function updateQuitVotes(votes, count) {
  if (count) {
    document.querySelector("#quit-voting meter").value++
  } else {
    document.querySelector("#quit-voting meter").value = 0
    return
  }
  document.querySelector("#quit-votes .count").textContent = votes.quit || 0
  document.querySelector("#restart-votes .count").textContent = votes.restart || 0
  document.querySelector("#continue-votes .count").textContent = votes.continue || 0
}
function updateGameVotes(votes, count) {
  if (count) {
    document.querySelector("#game-voting meter").value++
  } else {
    document.querySelector("#game-voting meter").value = 0
    document.querySelector("#game-voting tbody").innerHTML = ""
    return
  }
  for (let game in votes) {
    let el = document.getElementById(game + "-gamevote")
    if (el) {
      el.dataset.count = votes[game] || 0
      el.querySelector(".count").textContent = el.dataset.count
    } else {
      el = document.createElement("tr")
      el.id = game + "-gamevote"
      el.innerHTML = `<td>${games[game].title}</td><td class="count">?</td>`
      document.querySelector("#game-voting tbody").appendChild(el)
    }
  }
  let lastEl
  for (let el of document.querySelectorAll("#game-voting tbody")) {
    if (lastEl && (parseFloat(lastEl.dataset.count) < parseFloat(el.dataset.count))) {
      el.insertBefore(lastEl)
    }
    lastEl = el
  }

}
