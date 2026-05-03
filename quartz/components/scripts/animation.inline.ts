const onNav = () => {
  const container = document.getElementById("quartz-body")
  if (container) {
    container.style.animation = 'none'
    container.offsetHeight // Trigger reflow
    container.style.animation = ''
  }
}

document.addEventListener("nav", onNav)
