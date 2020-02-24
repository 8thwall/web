const xrComponents = () => {
  // Display 'almost there' flows.
  const almostThereComponent = {
    schema: {
      url: {default: ''},
    },
    init() {
      const load = () => {
        this.data.url && XRExtras.AlmostThere.configure({url: this.data.url})
        XR8.addCameraPipelineModule(XRExtras.AlmostThere.pipelineModule())
      }
      window.XRExtras && window.XR8
        ? load()
        : window.addEventListener('xrandextrasloaded', load, {once: true})
    },
    remove() {
      XRExtras.AlmostThere.hideAlmostThere()
      XR8.removeCameraPipelineModule('almostthere')
    },
  }

  // Display loading screen.
  const onxrloaded = () => { XR8.addCameraPipelineModule(XRExtras.Loading.pipelineModule()) }
  const loadingComponent = {
    schema: {
      loadBackgroundColor: {default: ''},
      cameraBackgroundColor: {default: ''},
      loadImage: {default: ''},
      loadAnimation: {default: ''},
    },
    init() {
      let aframeLoaded = false
      this.el.addEventListener('loaded', () => { aframeLoaded = true })
      const aframeDidLoad = () => aframeLoaded
      const load = () => {
        XRExtras.Loading.setAppLoadedProvider(aframeDidLoad)
        XRExtras.Loading.showLoading({onxrloaded})
      }
      window.XRExtras ? load() : window.addEventListener('xrextrasloaded', load, {once: true})

      const loadImg = document.querySelector('#loadImage')

      if (loadImg) {
        if (this.data.loadImage !== '') {
          loadImg.src = document.querySelector(this.data.loadImage).src
        }

        if (this.data.loadAnimation !== '') {
          loadImg.classList.remove('spin')
          if (this.data.loadAnimation !== 'none') {
            loadImg.classList.add(this.data.loadAnimation)
          }
        }
      }

      const loadBackground = document.querySelector('#loadBackground')

      if (loadBackground) {
        loadBackground.style.backgroundColor = this.data.loadBackgroundColor
      }

      const requestingCameraPermissions = document.querySelector('#requestingCameraPermissions')

      if (requestingCameraPermissions) {
        requestingCameraPermissions.style.backgroundColor = this.data.cameraBackgroundColor
      }
    },
    remove() {
      XR8.removeCameraPipelineModule('loading')
    },
  }

  // Show an error-handling scene on error.
  const runtimeErrorComponent = {
    init() {
      const load = () => { XR8.addCameraPipelineModule(XRExtras.RuntimeError.pipelineModule()) }
      window.XRExtras && window.XR8
        ? load()
        : window.addEventListener('xrandextrasloaded', load, {once: true})
    },
    remove() {
      XRExtras.RuntimeError.hideRuntimeError()
      XR8.removeCameraPipelineModule('error')
    },
  }

  // Recenter the scene when the screen is tapped.
  const tapRecenterComponent = {
    init() {
      const scene = this.el.sceneEl
      scene.addEventListener('click', () => { scene.emit('recenter', {}) })
    },
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
    init() {
      const componentMap = {}

      const addComponents = ({detail}) => {
        detail.imageTargets.forEach(({name, metadata, properties}) => {
          const el = document.createElement(this.data.primitive)
          el.setAttribute('id', `xrextras-imagetargets-${name}`)
          el.setAttribute('name', name)
          el.setAttribute('rotated', properties.isRotated ? 'true' : 'false')
          el.setAttribute(
            'metadata', (typeof metadata === 'string') ? metadata : JSON.stringify(metadata)
          )
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
    },
  }

  // Updates a single a-entity to track the image target with the given name (specified in 8th
  // wall console).
  const namedImageTargetComponent = {
    schema: {
      name: {type: 'string'},
    },
    init() {
      const {object3D} = this.el
      const {name} = this.data
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
    },
  }

  // Component that detects and emits events for touch gestures
  const gestureDetectorComponent = {
    schema: {
      element: {default: ''},
    },
    init() {
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
    remove() {
      this.targetElement.removeEventListener('touchstart', this.emitGestureEvent)
      this.targetElement.removeEventListener('touchend', this.emitGestureEvent)
      this.targetElement.removeEventListener('touchmove', this.emitGestureEvent)
    },
    emitGestureEvent(event) {
      const currentState = this.getTouchState(event)
      const {previousState} = this.internalState

      const gestureContinues = previousState &&
        currentState &&
        currentState.touchCount == previousState.touchCount

      const gestureEnded = previousState && !gestureContinues
      const gestureStarted = currentState && !gestureContinues

      if (gestureEnded) {
        const eventName = `${this.getEventPrefix(previousState.touchCount)}fingerend`
        this.el.emit(eventName, previousState)
        this.internalState.previousState = null
      }

      if (gestureStarted) {
        currentState.startTime = performance.now()
        currentState.startPosition = currentState.position
        currentState.startSpread = currentState.spread
        const eventName = `${this.getEventPrefix(currentState.touchCount)}fingerstart`
        this.el.emit(eventName, currentState)
        this.internalState.previousState = currentState
      }

      if (gestureContinues) {
        const eventDetail = {
          positionChange: {
            x: currentState.position.x - previousState.position.x,
            y: currentState.position.y - previousState.position.y,
          },
        }

        if (currentState.spread) {
          eventDetail.spreadChange = currentState.spread - previousState.spread
        }

        // Update state with new data
        Object.assign(previousState, currentState)

        // Add state data to event detail
        Object.assign(eventDetail, previousState)

        const eventName = `${this.getEventPrefix(currentState.touchCount)}fingermove`
        this.el.emit(eventName, eventDetail)
      }
    },
    getTouchState(event) {
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

      touchState.positionRaw = {x: centerPositionRawX, y: centerPositionRawY}

      // Scale touch position and spread by average of window dimensions
      const screenScale = 2 / (window.innerWidth + window.innerHeight)

      touchState.position = {x: centerPositionRawX * screenScale, y: centerPositionRawY * screenScale}

      // Calculate average spread of touches from the center point
      if (touchList.length >= 2) {
        const spread = touchList.reduce((sum, touch) => sum +
            Math.sqrt(
              Math.pow(centerPositionRawX - touch.clientX, 2) +
              Math.pow(centerPositionRawY - touch.clientY, 2)
            ), 0) / touchList.length

        touchState.spread = spread * screenScale
      }

      return touchState
    },
    getEventPrefix(touchCount) {
      const numberNames = ['one', 'two', 'three', 'many']
      return numberNames[Math.min(touchCount, 4) - 1]
    },
  }

  const oneFingerRotateComponent = {
    schema: {
      factor: {default: 6},
    },
    init() {
      this.handleEvent = this.handleEvent.bind(this)
      this.el.sceneEl.addEventListener('onefingermove', this.handleEvent)
      this.el.classList.add('cantap') // Needs "objects: .cantap" attribute on raycaster.
    },
    remove() {
      this.el.sceneEl.removeEventListener('onefingermove', this.handleEvent)
    },
    handleEvent(event) {
      this.el.object3D.rotation.y += event.detail.positionChange.x * this.data.factor
    },
  }

  const twoFingerRotateComponent = {
    schema: {
      factor: {default: 5},
    },
    init() {
      this.handleEvent = this.handleEvent.bind(this)
      this.el.sceneEl.addEventListener('twofingermove', this.handleEvent)
      this.el.classList.add('cantap') // Needs "objects: .cantap" attribute on raycaster.
    },
    remove() {
      this.el.sceneEl.removeEventListener('twofingermove', this.handleEvent)
    },
    handleEvent(event) {
      this.el.object3D.rotation.y += event.detail.positionChange.x * this.data.factor
    },
  }

  const pinchScaleComponent = {
    schema: {
      min: {default: 0.33},
      max: {default: 3},
      scale: {default: 0}, // If scale is set to zero here, the object's initial scale is used.
    },
    init() {
      const s = this.data.scale
      this.initialScale = (s && {x: s, y: s, z: s}) || this.el.object3D.scale.clone()
      this.scaleFactor = 1
      this.handleEvent = this.handleEvent.bind(this)
      this.el.sceneEl.addEventListener('twofingermove', this.handleEvent)
      this.el.classList.add('cantap') // Needs "objects: .cantap" attribute on raycaster.
    },
    remove() {
      this.el.sceneEl.removeEventListener('twofingermove', this.handleEvent)
    },
    handleEvent(event) {
      this.scaleFactor *= 1 + event.detail.spreadChange / event.detail.startSpread
      this.scaleFactor = Math.min(Math.max(this.scaleFactor, this.data.min), this.data.max)

      this.el.object3D.scale.x = this.scaleFactor * this.initialScale.x
      this.el.object3D.scale.y = this.scaleFactor * this.initialScale.y
      this.el.object3D.scale.z = this.scaleFactor * this.initialScale.z
    },
  }

  const holdDragComponent = {
    schema: {
      cameraId: {default: 'camera'},
      groundId: {default: 'ground'},
      dragDelay: {default: 300},
    },
    init() {
      this.camera = document.getElementById(this.data.cameraId)
      this.threeCamera = this.camera.getObject3D('camera')
      this.ground = document.getElementById(this.data.groundId)

      this.internalState = {
        fingerDown: false,
        dragging: false,
        distance: 0,
        startDragTimeout: null,
        raycaster: new THREE.Raycaster(),
      }

      this.fingerDown = this.fingerDown.bind(this)
      this.startDrag = this.startDrag.bind(this)
      this.fingerMove = this.fingerMove.bind(this)
      this.fingerUp = this.fingerUp.bind(this)

      this.el.addEventListener('mousedown', this.fingerDown)
      this.el.sceneEl.addEventListener('onefingermove', this.fingerMove)
      this.el.sceneEl.addEventListener('onefingerend', this.fingerUp)
      this.el.classList.add('cantap') // Needs "objects: .cantap" attribute on raycaster.
    },
    tick() {
      if (this.internalState.dragging) {
        let desiredPosition = null
        if (this.internalState.positionRaw) {
          const screenPositionX = this.internalState.positionRaw.x / document.body.clientWidth * 2 - 1
          const screenPositionY = this.internalState.positionRaw.y / document.body.clientHeight * 2 - 1
          const screenPosition = new THREE.Vector2(screenPositionX, -screenPositionY)

          this.threeCamera = this.threeCamera || this.camera.getObject3D('camera')

          this.internalState.raycaster.setFromCamera(screenPosition, this.threeCamera)
          const intersects = this.internalState.raycaster.intersectObject(this.ground.object3D, true)

          if (intersects.length > 0) {
            const intersect = intersects[0]
            this.internalState.distance = intersect.distance
            desiredPosition = intersect.point
          }
        }

        if (!desiredPosition) {
          desiredPosition = this.camera.object3D.localToWorld(new THREE.Vector3(0, 0, -this.internalState.distance))
        }

        desiredPosition.y = 1
        this.el.object3D.position.lerp(desiredPosition, 0.2)
      }
    },
    remove() {
      this.el.removeEventListener('mousedown', this.fingerDown)
      this.el.sceneEl.removeEventListener('onefingermove', this.fingerMove)
      this.el.sceneEl.removeEventListener('onefingerend', this.fingerUp)
      if (this.internalState.fingerDown) {
        this.fingerUp()
      }
    },
    fingerDown(event) {
      this.internalState.fingerDown = true
      this.internalState.startDragTimeout = setTimeout(this.startDrag, this.data.dragDelay)
      this.internalState.positionRaw = event.detail.positionRaw
    },
    startDrag(event) {
      if (!this.internalState.fingerDown) {
        return
      }
      this.internalState.dragging = true
      this.internalState.distance = this.el.object3D.position.distanceTo(this.camera.object3D.position)
    },
    fingerMove(event) {
      this.internalState.positionRaw = event.detail.positionRaw
    },
    fingerUp(event) {
      this.internalState.fingerDown = false
      clearTimeout(this.internalState.startDragTimeout)

      this.internalState.positionRaw = null

      if (this.internalState.dragging) {
        const endPosition = this.el.object3D.position.clone()
        this.el.setAttribute('animation__drop', {
          property: 'position',
          to: `${endPosition.x} 0 ${endPosition.z}`,
          dur: 300,
          easing: 'easeOutQuad',
        })
      }
      this.internalState.dragging = false
    },
  }

  const attachComponent = {
    schema: {
      target: {default: ''},
      offset: {default: '0 0 0'},
    },
    update() {
      const targetElement = document.getElementById(this.data.target)
      if (!targetElement) {
        return
      }
      this.target = targetElement.object3D
      this.offset = this.data.offset.split(' ').map(n => Number(n))
    },
    tick() {
      if (!this.target) {
        return
      }
      const [x, y, z] = this.offset
      this.el.object3D.position.set(
        this.target.position.x + x, this.target.position.y + y, this.target.position.z + z
      )
    },
  }

  // Triggers video playback on tap.
  const playVideoComponent = {
    schema: {
      video: {type: 'string'},
      thumb: {type: 'string'},
      canstop: {type: 'bool'},
    },
    init() {
      const v = document.querySelector(this.data.video)
      const p = this.data.thumb && document.querySelector(this.data.thumb)

      const {el} = this
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
    },
  }

  // Log console messages over the scene.
  const logToScreenComponent = {
    init() {
      XRExtras.DebugWebViews.enableLogToScreen()
    },
  }

  const pwaInstallerComponent = {
    schema: {
      name: {default: null},
      iconSrc: {default: null},
      installTitle: {default: null},
      installSubtitle: {default: null},
      installButtonText: {default: null},
      iosInstallText: {default: null},
      delayAfterDismissalMillis: {default: null, type: 'int'},
      minNumVisits: {default: null, type: 'int'},
    },
    init() {
      const load = () => {
        const {
          name,
          iconSrc,
          installTitle,
          installSubtitle,
          installButtonText,
          iosInstallText,
          delayAfterDismissalMillis,
          minNumVisits
        } = this.data
        const config = {
          promptConfig: {},
          displayConfig: {}
        }
        if (name) {
          config.displayConfig.name = name
        }
        if (iconSrc) {
          config.displayConfig.iconSrc = iconSrc
        }
        if (installTitle) {
          config.displayConfig.installTitle = installTitle
        }
        if (installSubtitle) {
          config.displayConfig.installSubtitle = installSubtitle
        }
        if (installButtonText) {
          config.displayConfig.installButtonText = installButtonText
        }
        if (iosInstallText) {
          config.displayConfig.iosInstallText = iosInstallText
        }
        if (delayAfterDismissalMillis || delayAfterDismissalMillis === 0) {
          config.promptConfig.delayAfterDismissalMillis = delayAfterDismissalMillis
        }
        if (minNumVisits || minNumVisits === 0) {
          config.promptConfig.minNumVisits = minNumVisits
        }

        if (Object.keys(config.promptConfig).length || Object.keys(config.displayConfig).length) {
          XRExtras.PwaInstaller.configure(config)
        }
        XR8.addCameraPipelineModule(XRExtras.PwaInstaller.pipelineModule())
      }

      window.XRExtras && window.XR8
        ? load()
        : window.addEventListener('xrandextrasloaded', load, {once: true})
    },
    remove() {
      XR8.removeCameraPipelineModule('pwa-installer')
    },
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
    'xrextras-two-finger-rotate': twoFingerRotateComponent,
    'xrextras-pinch-scale': pinchScaleComponent,
    'xrextras-hold-drag': holdDragComponent,
    'xrextras-attach': attachComponent,
    'xrextras-play-video': playVideoComponent,
    'xrextras-log-to-screen': logToScreenComponent,
    'xrextras-pwa-installer': pwaInstallerComponent,
  }
}

module.exports = {
  xrComponents,
}
