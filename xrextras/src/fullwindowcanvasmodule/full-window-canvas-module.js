let fullWindowCanvas = null

const FullWindowCanvasFactory = () => {
  if (fullWindowCanvas == null) {
    fullWindowCanvas = create()
  }

  return fullWindowCanvas
}

function create() {
  let canvas_ = null

  // Update the size of the camera feed canvas to fill the screen.
  const fillScreenWithCanvas = ({orientation}) => {
    const ww = window.innerWidth
    const wh = window.innerHeight

    // Wait for orientation change to take effect before handline resize.
    if (((orientation == 0 || orientation == 180) && ww > wh)
      || ((orientation == 90 || orientation == -90) && wh > ww)) {
      window.requestAnimationFrame(() => fillScreenWithCanvas({orientation}))
      return
    }

    // Set the canvas geometry to the new window size.
    canvas_.width = ww
    canvas_.height = wh
  }

  const onStart = ({canvas, orientation}) => {
    canvas_ = canvas
    const body = document.getElementsByTagName('body')[0]

    body.style.margin = '0px'
    body.style.width = '100%'
    body.style.height = '100%'

    body.appendChild(canvas_)
    fillScreenWithCanvas({orientation})
  }

  const onDeviceOrientationChange = ({orientation}) => {
    fillScreenWithCanvas({orientation})
  }

  const pipelineModule = () => {
    return {
      name: 'fullwindowcanvas',
      onStart,
      onDeviceOrientationChange,
    }
  }

  return {
    // Creates a camera pipeline module that, when installed, keeps the canvas specified on XR.run()
    // to cover the whole window.
    pipelineModule,
  }
}

module.exports = {
  FullWindowCanvasFactory,
}
