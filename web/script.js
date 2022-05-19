setInterval(() => {
  fetch("./state.json").then(resp => {
    resp.json().then(state => {
      console.log(state)
    })
  })
}, 1024)
