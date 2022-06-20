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
    document.querySelector("html").classList.remove(state.state)
  }
  state = _state
  document.querySelector("html").classList.add(state.state)

  updateQuitVotes(state.quitVotes, state.state === "quitting")
}

function updateQuitVotes(votes, count) {
  document.querySelector("#quit-votes .count").textContent = votes.quit || 0
  document.querySelector("#restart-votes .count").textContent = votes.restart || 0
  document.querySelector("#continue-votes .count").textContent = votes.continue || 0
  if (count) {
    document.querySelector("#quit-voting meter").value++
  } else {
    document.querySelector("#quit-voting meter").value = 0
  }
}