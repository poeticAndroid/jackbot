setInterval(() => {
  fetch("./state.json").then(resp => {
    if (resp.status !== 200) {
      history.back()
      setTimeout(() => {
        location.reload(true)
      }, 4096)
    }
    resp.json().then(state => {
      console.log(state)
    })
  }).catch(err => {
    history.back()
    setTimeout(() => {
      location.reload(true)
    }, 4096)
  })
}, 1024)
