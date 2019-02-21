AFRAME.registerComponent('photo-mode', {
  init: function() {
    const container = document.getElementById('photoModeContainer')
    const image = document.getElementById('photoModeImage')
    const shutterButton = document.getElementById('shutterButton')
    const closeButton = document.getElementById('closeButton')

    // Container starts hidden so it isn't visible when the page is still loading
    container.style.display = 'block'

    closeButton.addEventListener('click', () => {
      container.classList.remove('photo')
    })

    shutterButton.addEventListener('click', () => {
      // Emit a screenshotrequest to the xrweb component
      this.el.sceneEl.emit('screenshotrequest')

      // Show the flash while the image is being taken
      container.classList.add('flash')
    })

    this.el.sceneEl.addEventListener('screenshotready', e => {
      // e.detail is the base64 representation of the JPEG screenshot
      image.src = 'data:image/jpeg;base64,' + e.detail

      // Switch classes on the container to control showing and hiding elements
      container.classList.remove('flash')
      container.classList.add('photo')
    })

    this.el.sceneEl.addEventListener('screenshoterror', e => {
      // If an error occurs while trying to take the screenshot, this event will be emitted.
      // We could either retry or return control to the user
      container.classList.remove('flash')
    })
  }
})
