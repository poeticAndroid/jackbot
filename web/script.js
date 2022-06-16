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
  if (state && (_state.state !== state.state)) {
    document.querySelector("html").classList.remove(state.state)
  }
  state = _state
  document.querySelector("html").classList.add(state.state)
}