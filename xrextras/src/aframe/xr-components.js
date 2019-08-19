const xrComponents = () => {
  // Display 'almost there' flows.
  const almostThereComponent = {
    schema: {
      url: {default: ''},
    },
    init: function() {
      const load = () => {
        this.data.url && XRExtras.AlmostThere.configure({url: this.data.url})
        XR.addCameraPipelineModule(XRExtras.AlmostThere.pipelineModule())
      }
      window.XRExtras && window.XR
        ? load()
        : window.addEventListener('xrandextrasloaded', load, {once: true})
    }
  }

  // Display loading screen.
  const onxrloaded = () => { XR.addCameraPipelineModule(XRExtras.Loading.pipelineModule()) }
  const loadingComponent = {
    init: function() {
      let aframeLoaded = false
      this.el.addEventListener('loaded', () => {aframeLoaded = true})
      const aframeDidLoad = () => { return aframeLoaded }
      const load = () => {
        XRExtras.Loading.setAppLoadedProvider(aframeDidLoad)
        XRExtras.Loading.showLoading({onxrloaded})
      }
      window.XRExtras ? load() : window.addEventListener('xrextrasloaded', load, {once: true})
    }
  }

  // Show an error-handling scene on error.
  const runtimeErrorComponent = {
    init: function() {
      const load = () => { XR.addCameraPipelineModule(XRExtras.RuntimeError.pipelineModule()) }
      window.XRExtras && window.XR
        ? load()
        : window.addEventListener('xrandextrasloaded', load, {once: true})
    }
  }

  // Recenter the scene when the screen is tapped.
  const tapRecenterComponent = {
    init: function() {
      const scene = this.el.sceneEl
      scene.addEventListener('click', () => { scene.emit('recenter', {}) })
    }
  }

  // Materialize aframe primitives into the scene at detected image locations.
  //
  // Entities will have the fllowing attributes set:
  // - Name: The name of the image target.
  // - Rotated: Whether the image targes are stored rotated.
  // - Metadata: Metadata that was supplied in the xr console.
  const generateImageTargetsComponent = {
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
  }

  // Updates a single a-entity to track the image target with the given name (specified in 8th
  // wall console).
  const namedImageTargetComponent = {
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
  }

  // Component that detects and emits events for touch gestures
  const gestureDetectorComponent = {
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
  }

  const oneFingerRotateComponent = {
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
  }

  // Triggers video playback on tap.
  const playVideoComponent = {
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
  }

  // Log console messages over the scene.
  const logToScreenComponent = {
    init: function () {
      XRExtras.DebugWebViews.enableLogToScreen()
    }
  }

  return {
    'xrextras-almost-there': almostThereComponent,
    'xrextras-loading': loadingComponent,
    'xrextras-runtime-error': runtimeErrorComponent,
    'xrextras-tap-recenter': tapRecenterComponent,
    'xrextras-generate-image-targets': generateImageTargetsComponent,
    'xrextras-named-image-target': namedImageTargetComponent,
    'xrextras-gesture-detector': gestureDetectorComponent,
    'xrextras-one-finger-rotate': oneFingerRotateComponent,
    'xrextras-play-video': playVideoComponent,
    'xrextras-log-to-screen': logToScreenComponent,
  }
}

module.exports = {
  xrComponents,
}
