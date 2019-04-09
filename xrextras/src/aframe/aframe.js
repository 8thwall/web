let xrextrasAframe = null

const AFrameFactory = () => {
  if (!xrextrasAframe) {
    xrextrasAframe = create()
  }

  return xrextrasAframe
}

const onxrloaded = () => { XR.addCameraPipelineModule(XRExtras.Loading.pipelineModule()) }

function create() {
  let registered = false

  const registerXrExtrasComponents = () => {
    // If AFrame is not ready, or we already registered components, skip.
    if (registered || !window.AFRAME) {
      return
    }

    // Only register the components once.
    registered = true

    // Display 'almost there' flows.
    AFRAME.registerComponent('xrextras-almost-there', {
      schema: {
        url: {default: ''},
      },
      init: function() {
        const load = () => {
          this.data.url && XRExtras.AlmostThere.configure({url: this.data.url})
          XR.addCameraPipelineModule(XRExtras.AlmostThere.pipelineModule())
        }
        window.XRExtras && window.XR ? load() : window.addEventListener('xrandextrasloaded', load)
      }
    })

    // Display loading screen.
    AFRAME.registerComponent('xrextras-loading', {
      init: function() {
        let aframeLoaded = false
        this.el.addEventListener('loaded', () => {aframeLoaded = true})
        const aframeDidLoad = () => { return aframeLoaded }
        const load = () => {
          XRExtras.Loading.setAppLoadedProvider(aframeDidLoad)
          XRExtras.Loading.showLoading({onxrloaded})
        }
        window.XRExtras ? load() : window.addEventListener('xrextrasloaded', load)
      }
    })

    // Show an error-handling scene on error.
    AFRAME.registerComponent('xrextras-runtime-error', {
      init: function() {
        const load = () => { XR.addCameraPipelineModule(XRExtras.RuntimeError.pipelineModule()) }
        window.XRExtras && window.XR ? load() : window.addEventListener('xrandextrasloaded', load)
      }
    })

    // Recenter the scene when the screen is tapped.
    AFRAME.registerComponent('xrextras-tap-recenter', {
      init: function() {
        const scene = this.el.sceneEl
        scene.addEventListener('click', () => { scene.emit('recenter', {}) })
      }
    })

    // Materialize aframe primitives into the scene at detected image locations.
    //
    // Entities will have the fllowing attributes set:
    // - Name: The name of the image target.
    // - Rotated: Whether the image targes are stored rotated.
    // - Metadata: Metadata that was supplied in the xr console.
    AFRAME.registerComponent('xrextras-generate-image-targets', {
      schema: {
        primitive: {type: 'string'},
      },
      init: function() {
        const componentMap = {}

        const addComponents = ({detail}) => {
          detail.imageTargets.forEach(({name, metadata, properties}) => {
            const el = document.createElement(this.data.primitive)
            el.setAttribute('id', `xrextras-imagetargets-${name}`)
            el.setAttribute('name', name)
            el.setAttribute('rotated', properties.isRotated ? 'true' : 'false')
            el.setAttribute(
              'metadata', (typeof metadata === 'string') ? metadata : JSON.stringify(metadata))
            document.querySelector('a-scene').appendChild(el)
            componentMap[name] = el
          })
        }

        const forwardEvent = (event) => {
          const component = componentMap[event.detail.name]
          if (!component) {
            return
          }
          component.emit(event.type, event.detail, false)
        }

        this.el.sceneEl.addEventListener('xrimageloading', addComponents)
        this.el.sceneEl.addEventListener('xrimagefound', forwardEvent)
        this.el.sceneEl.addEventListener('xrimageupdated', forwardEvent)
        this.el.sceneEl.addEventListener('xrimagelost', forwardEvent)
      }
    })

    // Updates a single a-entity to track the image target with the given name (specified in 8th
    // wall console).
    AFRAME.registerComponent('xrextras-named-image-target', {
      schema: {
        name: { type: 'string' }
      },
      init: function () {
        const object3D = this.el.object3D
        const name = this.data.name
        object3D.visible = false

        const showImage = ({detail}) => {
          if (name != detail.name) {
            return
          }
          object3D.position.copy(detail.position)
          object3D.quaternion.copy(detail.rotation)
          object3D.scale.set(detail.scale, detail.scale, detail.scale)
          object3D.visible = true
        }

        const hideImage = ({detail}) => {
          if (name != detail.name) {
            return
          }
          object3D.visible = false
        }

        this.el.sceneEl.addEventListener('xrimagefound', showImage)
        this.el.sceneEl.addEventListener('xrimageupdated', showImage)
        this.el.sceneEl.addEventListener('xrimagelost', hideImage)
      }
    })

    // Component that detects and emits events for touch gestures
    AFRAME.registerComponent('xrextras-gesture-detector', {
      schema: {
        element: { default: '' },
      },
      init: function () {
        this.targetElement = this.data.element && document.querySelector(this.data.element)
        if (!this.targetElement) {
          this.targetElement = this.el
        }

        this.internalState = {
          previousState: null,
        }

        this.emitGestureEvent = this.emitGestureEvent.bind(this)

        this.targetElement.addEventListener('touchstart', this.emitGestureEvent)
        this.targetElement.addEventListener('touchend', this.emitGestureEvent)
        this.targetElement.addEventListener('touchmove', this.emitGestureEvent)
      },
      remove: function () {
        this.targetElement.removeEventListener('touchstart', this.emitGestureEvent)
        this.targetElement.removeEventListener('touchend', this.emitGestureEvent)
        this.targetElement.removeEventListener('touchmove', this.emitGestureEvent)
      },
      emitGestureEvent(event) {
        const currentState = this.getTouchState(event)
        const previousState = this.internalState.previousState

        const gestureContinues = previousState &&
          currentState &&
          currentState.touchCount == previousState.touchCount

        const gestureEnded = previousState && !gestureContinues
        const gestureStarted = currentState && !gestureContinues

        if (gestureEnded) {
          const eventName = this.getEventPrefix(previousState.touchCount) + 'fingerend'
          this.el.emit(eventName, previousState)
          this.internalState.previousState = null
        }

        if (gestureStarted) {
          currentState.startTime = performance.now()
          currentState.startPosition = currentState.position
          currentState.startSpread = currentState.spread
          const eventName = this.getEventPrefix(currentState.touchCount) + 'fingerstart'
          this.el.emit(eventName, currentState)
          this.internalState.previousState = currentState
        }

        if (gestureContinues) {
          const eventDetail = {
            positionChange: {
              x: currentState.position.x - previousState.position.x,
              y: currentState.position.y - previousState.position.y
            },
          }

          if (currentState.spread) {
            eventDetail.spreadChange = currentState.spread - previousState.spread
          }

          // Update state with new data
          Object.assign(previousState, currentState)

          // Add state data to event detail
          Object.assign(eventDetail, previousState)

          const eventName = this.getEventPrefix(currentState.touchCount) + 'fingermove'
          this.el.emit(eventName, eventDetail)
        }
      },
      getTouchState: function (event) {

        if (event.touches.length == 0) {
          return null
        }

        // Convert event.touches to an array so we can use reduce
        const touchList = []
        for (let i = 0; i < event.touches.length; i++) {
          touchList.push(event.touches[i])
        }

        const touchState = {
          touchCount: touchList.length,
        }

        // Calculate center of all current touches
        const centerPositionRawX = touchList.reduce((sum, touch) => sum + touch.clientX, 0) / touchList.length
        const centerPositionRawY = touchList.reduce((sum, touch) => sum + touch.clientY, 0) / touchList.length

        touchState.positionRaw = { x: centerPositionRawX, y: centerPositionRawY }

        // Scale touch position and spread by average of window dimensions
        const screenScale = 2 / (window.innerWidth + window.innerHeight)

        touchState.position = { x: centerPositionRawX * screenScale, y: centerPositionRawY * screenScale }

        // Calculate average spread of touches from the center point
        if (touchList.length >= 2) {
          const spread = touchList.reduce((sum, touch) => {
            return sum +
              Math.sqrt(
                Math.pow(centerPositionRawX - touch.clientX, 2) +
                Math.pow(centerPositionRawY - touch.clientY, 2))
          }, 0) / touchList.length

          touchState.spread = spread * screenScale
        }

        return touchState
      },
      getEventPrefix(touchCount) {
        const numberNames = ['one', 'two', 'three', 'many']
        return numberNames[Math.min(touchCount, 4) - 1]
      }
    })

    AFRAME.registerComponent('xrextras-one-finger-rotate', {
      init: function () {
        this.handleEvent = this.handleEvent.bind(this)
        this.el.sceneEl.addEventListener('onefingermove', this.handleEvent)
        this.el.setAttribute('class', 'cantap')
      },
      remove: function () {
        this.el.sceneEl.removeEventListener('onefingermove', this.handleEvent)
      },
      handleEvent: function (event) {
        this.el.object3D.rotation.y += event.detail.positionChange.x * 6
      }
    })

    // Triggers video playback on tap.
    AFRAME.registerComponent('xrextras-play-video', {
      schema: {
        video: {type: 'string' },
        thumb: {type: 'string' },
        canstop: {type: 'bool' },
      },
      init: function () {
        const v = document.querySelector(this.data.video)
        const p = this.data.thumb && document.querySelector(this.data.thumb)

        const el = this.el
        el.setAttribute('material', 'src', p || v)
        el.setAttribute('class', 'cantap')

        let playing = false

        el.addEventListener('click', () => {
          if (!playing) {
            el.setAttribute('material', 'src', v)
            v.play()
            playing = true
          } else if (this.data.canstop) {
            el.setAttribute('material', 'src', p || v)
            v.pause()
            playing = false
          }
        })
      }
    })

    // Log console messages over the scene.
    AFRAME.registerComponent('xrextras-log-to-screen', {
      init: function () {
        XRExtras.DebugWebViews.enableLogToScreen()
      }
    })
  }

  // Eagerly try to register the aframe components, if aframe has already loaded.
  registerXrExtrasComponents()

  return {
    // Register the XRExtras components. This should only be called after AFrame has loaded.
    registerXrExtrasComponents
  }
}

// We want to start showing the loading screen eagerly (before AFRAME has loaded and parsed the
// scene and set up everything). We also need to work around a bug in the AFRAME loading in iOS
// Webviews for almost there.
const eagerload = () => {
  // Manually traverse the dom for an aframe scene and check its attributes.
  const scene = document.getElementsByTagName('a-scene')[0]
  if (!scene) {
    return
  }
  const attrs = scene.attributes

  // In some iOS webviews, AFRAME is never properly loaded. We need to recover from this by
  // expressly triggering a compatibility check (which will fail in these cases) regardless of
  // whether the camera framework is successfully run.
  Object.keys(attrs).forEach(a => {
    const attr = attrs.item(a).name
    if (attr == 'xrextras-almost-there') {
      const redirectMatch = new RegExp('url:([^;]*)').exec(attrs.item(a).value)
      redirectMatch && window.XRExtras.AlmostThere.configure({url: redirectMatch[1]})
      window.XR
        ? window.XRExtras.AlmostThere.checkCompatibility()
        : window.addEventListener('xrloaded', window.XRExtras.AlmostThere.checkCompatibility)
    }

    if (attr == 'xrextras-loading') {
      window.XRExtras.Loading.showLoading({onxrloaded})
    }
  })
}

const oldonload = window.onload
const aframeonload = () => {
  if (oldonload) {
    oldonload()
  }
  window.XRExtras ? eagerload() : window.addEventListener('xrextrasloaded', eagerload)
}
window.onload = aframeonload

module.exports = {
  AFrameFactory,
}
