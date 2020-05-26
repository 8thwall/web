let pauseOnBlur = null

const PauseOnBlurFactory = () => {
  if (pauseOnBlur == null) {
    pauseOnBlur = create()
  }

  return pauseOnBlur
}

function create() {
  const blur = () => {
    XR8.pause()
  }

  const focus = () => {
    XR8.resume()
  }

  const pipelineModule = () => {
    return {
      name: 'pauseonblur',
      onAttach: () => {
        window.addEventListener('blur', blur)
        window.addEventListener('focus', focus)
      },
      onDetach: () => {
        window.removeEventListener('blur', blur)
        window.removeEventListener('focus', focus)
      }
    }
  }

  return {
    // Creates a camera pipeline module that, when installed, pauses the camera feed and processing
    // when the window is blurred and restarts again when it's focused.
    pipelineModule,
  }
}

module.exports = {
  PauseOnBlurFactory,
}
