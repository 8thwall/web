/* globals XR8 */

// This pauses XR8 when the tab is hidden and calls resumes XR8 once the tab is visible again.
// Useful for when you want your camera feed and MediaRecorder audio to continue even if your
// desktop browser tab isn't focused.  It has nearly identical functionality to PauseOnBlur for
// mobile.
// https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event
let pauseOnHidden = null

function create() {
  const onVisChange = () => {
    if (document.visibilityState === 'visible') {
      XR8.resume()
    } else {
      XR8.pause()
    }
  }

  const pipelineModule = () => ({
    name: 'pauseonhidden',
    onAttach: () => {
      document.addEventListener('visibilitychange', onVisChange)
    },
    onDetach: () => {
      document.removeEventListener('visibilitychange', onVisChange)
    },
  })

  return {
    // Creates a camera pipeline module that, when installed, pauses the camera feed and processing
    // when the tab is hidden and restarts again when it's visible
    pipelineModule,
  }
}

const PauseOnHiddenFactory = () => {
  if (pauseOnHidden == null) {
    pauseOnHidden = create()
  }

  return pauseOnHidden
}

module.exports = {
  PauseOnHiddenFactory,
}
