/* globals XR8:readonly */

let fullWindowCanvas = null

const FullWindowCanvasFactory = () => {
  if (fullWindowCanvas == null) {
    fullWindowCanvas = create()
  }

  return fullWindowCanvas
}

function create() {
  let canvas_ = null
  const vsize_ = {}
  let orientation_ = 0
  const originalBodyStyleSubset_ = {}
  const originalHtmlStyleSubset_ = {}

  const canvasStyle_ = {
    width: '100%',
    height: '100%',
    margin: '0px',
    padding: '0px',
    border: '0px',
    display: 'block',
  }

  const bodyStyle_ = {
    width: '100%',
    height: '100%',
    margin: '0px',
    padding: '0px',
    border: '0px',
  }

  const isCompatibleMobile = () =>
    // eslint-disable-next-line implicit-arrow-linebreak
    XR8.XrDevice.isDeviceBrowserCompatible({allowedDevices: XR8.XrConfig.device().MOBILE}) &&
    !XR8.XrDevice.deviceEstimate().model.toLowerCase().includes('ipad')

  // Update the size of the camera feed canvas to fill the screen.
  const fillScreenWithCanvas = () => {
    if (!canvas_) { return }

    // Get the pixels of the browser window.
    const uww = window.innerWidth
    const uwh = window.innerHeight
    const ww = uww * devicePixelRatio
    const wh = uwh * devicePixelRatio

    // Wait for orientation change to take effect before handling resize on mobile phones only.
    const displayOrientationMismatch = ((orientation_ == 0 || orientation_ == 180) && ww > wh) ||
    ((orientation_ == 90 || orientation_ == -90) && wh > ww)
    if (displayOrientationMismatch && isCompatibleMobile()) {
      window.requestAnimationFrame(fillScreenWithCanvas)
      return
    }

    // Compute the portrait-orientation aspect ratio of the browser window.
    const ph = Math.max(ww, wh)
    const pw = Math.min(ww, wh)
    const pa = ph / pw

    // Compute the portrait-orientation dimensions of the video.
    const pvh = Math.max(vsize_.w, vsize_.h)
    const pvw = Math.min(vsize_.w, vsize_.h)

    // Compute the cropped dimensions of a video that fills the screen, assuming that width is
    // cropped.
    let ch = pvh
    let cw = Math.round(pvh / pa)

    // Figure out if we should have cropped from the top, and if so, compute a new cropped video
    // dimension.
    if (cw > pvw) {
      cw = pvw
      ch = Math.round(pvw * pa)
    }

    // If the video has more pixels than the screen, set the canvas size to the screen pixel
    // resolution.
    if (cw > pw || ch > ph) {
      cw = pw
      ch = ph
    }

    // Switch back to a landscape aspect ratio if required.
    if (ww > wh) {
      const tmp = cw
      cw = ch
      ch = tmp
    }

    // Set the canvas geometry to the new window size.
    Object.assign(canvas_.style, canvasStyle_)
    canvas_.width = cw
    canvas_.height = ch

    // on iOS, rotating from portrait to landscape back to portrait can lead to a situation where
    // address bar is hidden and the content doesn't fill the screen. Scroll back up to the top in
    // this case. In chrome this has no effect. We need to scroll to something that's not our
    // scroll position, so scroll to 0 or 1 depending on the current position.
    setTimeout(() => window.scrollTo(0, (window.scrollY + 1) % 2), 300)
  }

  const updateVideoSize = ({videoWidth, videoHeight}) => {
    vsize_.w = videoWidth
    vsize_.h = videoHeight
  }

  const onWindowResize = () => {
    if (isCompatibleMobile()) {
      return
    }
    fillScreenWithCanvas()
  }

  const onVideoSizeChange = ({videoWidth, videoHeight}) => {
    updateVideoSize({videoWidth, videoHeight})
    fillScreenWithCanvas()
  }

  const onCameraStatusChange = ({status, video}) => {
    if (status !== 'hasVideo') {
      return
    }
    updateVideoSize(video)
  }

  const onCanvasSizeChange = () => {
    fillScreenWithCanvas()
  }

  const onUpdate = () => {
    if (canvas_.style.width === canvasStyle_.width &&
      canvas_.style.height === canvasStyle_.height) {
      return
    }
    fillScreenWithCanvas()
  }

  const onAttach = ({canvas, orientation, videoWidth, videoHeight}) => {
    canvas_ = canvas
    orientation_ = orientation

    if (XR8.XrDevice.deviceEstimate().os === 'iOS') {
      // Save styles that we modify in unusual ways so we can reset them to their original state.
      const computedBodyStyle = getComputedStyle(document.body)
      originalBodyStyleSubset_.backgroundColor =
        computedBodyStyle.getPropertyValue('background-color')
      originalBodyStyleSubset_.overflowY = computedBodyStyle.getPropertyValue('overflow-y')
      originalHtmlStyleSubset_.overflow =
        getComputedStyle(document.documentElement).getPropertyValue('overflow')

      // Set black / white background color on iOS devices depending on dark / light mode.
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        bodyStyle_.backgroundColor = 'black'
      } else {
        bodyStyle_.backgroundColor = 'white'
      }

      // Prevent address bar hiding on scroll on iOS (https://stackoverflow.com/a/33953987/4979029).
      bodyStyle_.overflowY = 'scroll'
      Object.assign(document.documentElement.style, {overflow: 'hidden'})
    }
    Object.assign(document.body.style, bodyStyle_)

    document.body.appendChild(canvas_)

    window.addEventListener('resize', onWindowResize)
    updateVideoSize({videoWidth, videoHeight})
    fillScreenWithCanvas()
  }

  const onDetach = () => {
    // Reset styles that we cached in `onAttach()`.
    Object.assign(document.body.style, originalBodyStyleSubset_)
    Object.assign(document.documentElement.style, originalHtmlStyleSubset_)
    canvas_ = null
    orientation_ = 0
    delete vsize_.w
    delete vsize_.h
    window.removeEventListener('resize', onWindowResize)
  }

  const onDeviceOrientationChange = ({orientation}) => {
    orientation_ = orientation
    fillScreenWithCanvas()
  }

  const pipelineModule = () => ({
    name: 'fullwindowcanvas',
    onAttach,
    onDetach,
    onCameraStatusChange,
    onDeviceOrientationChange,
    onVideoSizeChange,
    onCanvasSizeChange,
    onUpdate,
  })

  return {
    // Creates a camera pipeline module that, when installed, keeps the canvas specified on
    // XR8.run() to cover the whole window.
    pipelineModule,
  }
}

module.exports = {
  FullWindowCanvasFactory,
}
