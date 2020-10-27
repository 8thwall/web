/* globals XRExtras, XR8 */

const {ensureXrAndExtras} = require('./ensure')

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

  // Display stats.
  const statsComponent = {
    init: function() {
      this.loadModule = () => { XR8.addCameraPipelineModule(XRExtras.Stats.pipelineModule()) }
      if (window.XRExtras && window.XR8) {
        this.loadModule()
      } else {
        this.xrEventListenerAdded = true
        window.addEventListener('xrandextrasloaded', this.loadModule, {once: true})
      }
    },
    remove: function() {
      if (this.xrEventListenerAdded) {
        window.removeEventListener('xrandextrasloaded', this.loadModule, {once: true})
      }
      XR8.removeCameraPipelineModule('stats')
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
        detail.imageTargets.forEach(({name, type, metadata, properties}) => {
          const el = document.createElement(this.data.primitive)
          el.setAttribute('id', `xrextras-imagetargets-${name}`)
          el.setAttribute('name', name)
          el.setAttribute('type', type)
          el.setAttribute('rotated', (properties && properties.isRotated) ? 'true' : 'false')
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

  // Updates a single a-entity to track the image target with the given name (specified in 8th wall
  // console).
  const namedImageTargetComponent = {
    schema: {
      name: {type: 'string'},
    },
    init() {
      const {object3D} = this.el
      const {name} = this.data
      const geometry = {}
      object3D.visible = false

      const checkGeometry = (newGeometry) => {
        let needsUpdate = false

        const fields = [
          'type',
          'height',
          'radiusTop',
          'radiusBottom',
          'arcLengthRadians',
          'arcStartRadians',
          'scaledWidth',
          'scaledHeight',
        ]
        fields.forEach((f) => {
          if (geometry[f] !== newGeometry[f]) {
            geometry[f] = newGeometry[f]
            needsUpdate = true
          }
        })

        if (needsUpdate) {
          this.el.emit('xrextrasimagegeometry', geometry, false)
        }
      }

      const imageScanning = ({detail}) => {
        detail.imageTargets.forEach((t) => {
          if (name !== t.name) {
            return
          }
          checkGeometry(Object.assign({type: t.type}, t.geometry))
        })
      }

      const updateImage = ({detail}) => {
        if (name !== detail.name) {
          return
        }
        object3D.position.copy(detail.position)
        object3D.quaternion.copy(detail.rotation)
        object3D.scale.set(detail.scale, detail.scale, detail.scale)
        object3D.visible = true
      }

      const showImage = ({detail}) => {
        if (name !== detail.name) {
          return
        }
        checkGeometry(detail)
        updateImage({detail})
        this.el.emit('xrextrasfound', {}, false)
      }

      const hideImage = ({detail}) => {
        if (name !== detail.name) {
          return
        }
        this.el.emit('xrextraslost', {}, false)
        object3D.visible = false
      }

      this.el.sceneEl.addEventListener('xrimagescanning', imageScanning)
      this.el.sceneEl.addEventListener('xrimagefound', showImage)
      this.el.sceneEl.addEventListener('xrimageupdated', updateImage)
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
      name: {default: ''},
      iconSrc: {default: ''},
      installTitle: {default: ''},
      installSubtitle: {default: ''},
      installButtonText: {default: ''},
      iosInstallText: {default: ''},
      delayAfterDismissalMillis: {default: -1, type: 'int'},
      minNumVisits: {default: -1, type: 'int'},
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
          minNumVisits,
        } = this.data
        const config = {
          promptConfig: {},
          displayConfig: {},
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
        if (delayAfterDismissalMillis >= 0) {
          config.promptConfig.delayAfterDismissalMillis = delayAfterDismissalMillis
        }
        if (minNumVisits >= 0) {
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

  const pauseOnBlurComponent = {
    init() {
      const scene = this.el.sceneEl
      const blur = () => scene.pause()
      const focus = () => scene.play()
      XR8.addCameraPipelineModule({
        name: 'pauseonbluraframe',
        onAttach: () => {
          window.addEventListener('blur', blur)
          window.addEventListener('focus', focus)
        },
        onDetach: () => {
          window.removeEventListener('blur', blur)
          window.removeEventListener('focus', focus)
        },
      })
    },
    remove() {
      XR8.removeCameraPipelineModule('pauseonbluraframe')
    },
  }

  const pauseOnHiddenComponent = {
    init() {
      const scene = this.el.sceneEl
      const onVisChange = () => {
        if (document.visibilityState === 'visible') {
          scene.play()
        } else {
          scene.pause()
        }
      }
      XR8.addCameraPipelineModule({
        name: 'pauseonhiddenaframe',
        onAttach: () => {
          document.addEventListener('visibilitychange', onVisChange)
        },
        onDetach: () => {
          document.removeEventListener('visibilitychange', onVisChange)
        },
      })
    },
    remove() {
      XR8.removeCameraPipelineModule('pauseonhiddenaframe')
    },
  }

  const faceAnchorComponent = {
    init() {
      let id_ = null
      this.el.object3D.visible = false

      const show = ({detail}) => {
        if (id_ && detail.id != id_) {
          return
        }
        id_ = detail.id
        const {position, rotation, scale} = detail.transform
        this.el.object3D.position.copy(position)
        this.el.object3D.quaternion.copy(rotation)
        this.el.object3D.scale.set(scale, scale, scale)
        this.el.object3D.visible = true
      }

      const hide = ({detail}) => {
        this.el.object3D.visible = false
        id_ = null
      }

      this.el.sceneEl.addEventListener('xrfacefound', show)
      this.el.sceneEl.addEventListener('xrfaceupdated', show)
      this.el.sceneEl.addEventListener('xrfacelost', hide)
    },
  }

  const resourceComponent = {
    schema: {
      src: {type: 'string'},
    },
  }

  const srcFromAttr = (scene, v) => {
    if (!v) {
      return v
    }
    const el = scene.querySelector(v)
    if (!el) {
      return v
    }
    return el.getAttribute('src') || v
  }

  const pbrMaterialComponent = {
    schema: {
      tex: {type: 'string'},
      metalness: {type: 'string'},
      normals: {type: 'string'},
      roughness: {type: 'string'},
      alpha: {type: 'string'},
      opacity: {default: 1.0},
    },
    init() {
      this.el.object3D.visible = false
      this.el.material = XRExtras.ThreeExtras.pbrMaterial({
        tex: srcFromAttr(this.el.sceneEl, this.data.tex),
        metalness: srcFromAttr(this.el.sceneEl, this.data.metalness),
        normals: srcFromAttr(this.el.sceneEl, this.data.normals),
        roughness: srcFromAttr(this.el.sceneEl, this.data.roughness),
        alpha: srcFromAttr(this.el.sceneEl, this.data.alpha),
        opacity: this.data.opacity,
      })
    },
  }

  const basicMaterialComponent = {
    schema: {
      tex: {type: 'string'},
      alpha: {type: 'string'},
      opacity: {default: 1.0},
    },
    init() {
      this.el.object3D.visible = false
      this.el.material = XRExtras.ThreeExtras.basicMaterial({
        tex: srcFromAttr(this.el.sceneEl, this.data.tex),
        alpha: srcFromAttr(this.el.sceneEl, this.data.alpha),
        opacity: this.data.opacity,
      })
    },
  }

  const videoMaterialComponent = {
    schema: {
      video: {type: 'string'},
      alpha: {type: 'string'},
      autoplay: {type: 'bool', default: true},
      opacity: {default: 1.0},
    },
    init() {
      const video = document.querySelector(this.data.video)
      this.el.object3D.visible = false
      this.el.material = XRExtras.ThreeExtras.videoMaterial({
        video,
        alpha: srcFromAttr(this.el.sceneEl, this.data.alpha),
        opacity: this.data.opacity,
      })

      if (this.data.autoplay) {
        video.play()
      }
    },
  }

  const faceMeshComponent = {
    schema: {
      'material-resource': {type: 'string'},
    },
    init() {
      this.headMesh = null
      this.el.object3D.visible = false

      const beforeRun = ({detail}) => {
        let material

        if (this.el.getAttribute('material')) {
          material = this.el.components.material.material
        } else if (this.data['material-resource']) {
          material = this.el.sceneEl.querySelector(this.data['material-resource']).material
        } else {
          material = new THREE.MeshBasicMaterial({color: '#7611B6', opacity: 0.5, transparent: true})
        }

        this.headMesh = XRExtras.ThreeExtras.faceMesh(detail, material)
        this.el.setObject3D('mesh', this.headMesh.mesh)

        this.el.emit('model-loaded')
      }

      const show = (event) => {
        this.headMesh.show(event)
        this.el.object3D.visible = true
      }

      const hide = () => {
        this.headMesh.hide()
        this.el.object3D.visible = false
      }

      this.el.sceneEl.addEventListener('xrfaceloading', beforeRun)
      this.el.sceneEl.addEventListener('xrfacefound', show)
      this.el.sceneEl.addEventListener('xrfaceupdated', show)
      this.el.sceneEl.addEventListener('xrfacelost', hide)
    },
    update() {
      if (!this.headMesh) {
        return
      }

      let material
      if (this.el.getAttribute('material')) {
        material = this.el.components.material.material
      } else if (this.data['material-resource']) {
        material = this.el.sceneEl.querySelector(this.data['material-resource']).material
      } else {
        material = new THREE.MeshBasicMaterial({color: '#7611B6', opacity: 0.5, transparent: true})
      }
      this.headMesh.mesh.material = material
    },
  }

  const faceAttachmentComponent = {
    schema: {
      'point': {type: 'string', default: 'forehead'},
    },
    init() {
      let id_ = null
      this.el.object3D.visible = false

      const show = ({detail}) => {
        if (id_ && detail.id != id_) {
          return
        }
        id_ = detail.id
        const apt = detail.attachmentPoints[this.data.point]
        if (!apt) {
          return
        }
        const {position, rotation} = apt
        this.el.object3D.position.copy(position)
        this.el.object3D.visible = true
      }

      const hide = ({detail}) => {
        this.el.object3D.visible = false
        id_ = null
      }

      this.el.sceneEl.addEventListener('xrfacefound', show)
      this.el.sceneEl.addEventListener('xrfaceupdated', show)
      this.el.sceneEl.addEventListener('xrfacelost', hide)
    },
  }

  const hideCameraFeedComponent = {
    schema: {
      color: {type: 'string', default: '#2D2E43'},
    },
    init() {
      this.el.sceneEl.emit('hidecamerafeed')
      this.firstTick = true
      // If there is not a skybox in the scene, add one with the specified color.
      if (!document.querySelector('a-sky')) {
        this.skyEl = document.createElement('a-sky')
        this.skyEl.setAttribute('color', this.data.color)
        this.el.sceneEl.appendChild(this.skyEl)
      }
    },
    tick() {
      if (!this.firstTick) {
        return
      }
      // If xrextras-hide-camera-feed is added to the dom before xrweb or xrface, those components
      // won't intialize in time to receive the hidecamerafeed message, so we need to send it
      // again.
      this.firstTick = false
      this.el.sceneEl.emit('hidecamerafeed')
    },
    remove() {
      this.el.sceneEl.emit('showcamerafeed')
      // Remove the skybox if we added one.
      if (this.skyEl) {
        this.el.sceneEl.removeChild(this.skyEl)
      }
    },
  }

  const hiderMaterialComponent = {
    init() {
      const hiderMaterial = new THREE.MeshStandardMaterial()
      hiderMaterial.colorWrite = false

      const applyHiderMaterial = (mesh) => {
        if (!mesh) { return }
        if (mesh.material) {
          mesh.material = hiderMaterial
        }
        mesh.traverse((node) => {
          if (node.isMesh) {
            node.material = hiderMaterial
          }
        })
      }

      applyHiderMaterial(this.el.getObject3D('mesh'))
      this.el.addEventListener(
        'model-loaded', () => applyHiderMaterial(this.el.getObject3D('mesh'))
      )
    },
  }

  const captureButtonComponent = {
    schema: {
      captureMode: {default: 'standard'},
    },
    init() {
      ensureXrAndExtras().then(() => {
        if (this.removed) {
          return
        }
        this.added = true
        XRExtras.MediaRecorder.initRecordButton()
        XRExtras.MediaRecorder.setCaptureMode(this.data.captureMode)
      })
    },
    update() {
      if (this.added) {
        XRExtras.MediaRecorder.setCaptureMode(this.data.captureMode)
      }
    },
    remove() {
      this.removed = true
      if (this.added) {
        XRExtras.MediaRecorder.removeRecordButton()
      }
    },
  }

  const capturePreviewComponent = {
    // This schema must be duplicated to mappings xr-primitives.js
    schema: {
      actionButtonShareText: {default: ''},
      actionButtonViewText: {default: ''},
    },
    init() {
      ensureXrAndExtras().then(() => {
        if (!this.removed) {
          this.added = true
          XRExtras.MediaRecorder.initMediaPreview(this.data)
        }
      })
    },
    remove() {
      this.removed = true
      if (this.added) {
        XRExtras.MediaRecorder.removeMediaPreview()
      }
    },
  }

  const captureConfigComponent = {
    // This schema must be duplicated to mappings xr-primitives.js
    schema: {
      enableEndCard: {type: 'boolean'},
      shortLink: {type: 'string'},
      coverImageUrl: {type: 'string'},
      footerImageUrl: {type: 'string'},
      maxDurationMs: {type: 'int'},
      endCardCallToAction: {type: 'string'},
      maxDimension: {type: 'int'},
      watermarkImageUrl: {type: 'string'},
      watermarkMaxWidth: {type: 'number'},
      watermarkMaxHeight: {type: 'number'},
      watermarkLocation: {type: 'string'},
      fileNamePrefix: {type: 'string'},
      requestMic: {type: 'string'},
      includeSceneAudio: {type: 'boolean', default: true},
      excludeSceneAudio: {type: 'boolean', default: false}, // deprecated
    },
    init() {
      this.includeSceneAudio = this.includeSceneAudio.bind(this)
    },
    update() {
      const config = {
        audioContext: THREE.AudioContext.getContext(),
      }

      if (this.attrValue.excludeSceneAudio !== undefined) {
        console.warn('"exclude-scene-audio" has been deprecated in favor of "include-scene-audio"')
        config.configureAudioOutput = this.data.excludeSceneAudio ? null : this.includeSceneAudio
      } else {
        config.configureAudioOutput = this.data.includeSceneAudio ? this.includeSceneAudio : null
      }

      Object.keys(this.data).forEach((key) => {
        // Ignore value if not specified
        if (this.attrValue[key] !== undefined &&
            !['includeSceneAudio', 'excludeSceneAudio'].includes(key)) {
          config[key] = this.data[key]
        }
      })

      XRExtras.MediaRecorder.configure(config)
    },
    includeSceneAudio({microphoneInput, audioProcessor}) {
      const audioContext = audioProcessor.context

      // if the scene doesn't have any audio, then we'll create the listener for the scene.
      // That way, if they add sounds later, it will still connect without the user having to
      // re-call this function.
      if (!this.el.sceneEl.audioListener) {
        this.el.sceneEl.audioListener = new THREE.AudioListener()
      }

      // This connects the A-Frame audio to the audioProcessor so that all sound effects initialized
      // are part of the recorded video's audio.
      this.el.sceneEl.audioListener.gain.connect(audioProcessor)
      // This connects the A-Frame audio to the hardware output.  That way, the user can also hear
      // the sound effects during the experience
      this.el.sceneEl.audioListener.gain.connect(audioContext.destination)

      // you must return a node at the end.  This node is connected to the audioProcessor
      // automatically inside MediaRecorder
      return microphoneInput
    },
  }

  const targetMeshComponent = {
    schema: {
      'material-resource': {type: 'string'},
      'geometry': {type: 'string'},
      'height': {type: 'number'},
      'width': {type: 'number'},
    },
    init() {
      this.curvedMesh = null

      const geometry = ['full', 'label'].includes(this.data.geometry) ? this.data.geometry : 'label'

      const updateMesh = ({detail}) => {
        let material

        if (this.el.getAttribute('material')) {
          material = this.el.components.material.material
        } else if (this.data['material-resource']) {
          material = this.el.sceneEl.querySelector(this.data['material-resource']).material
        } else {
          material = new THREE.MeshBasicMaterial(
            {color: '#7611B6', opacity: 0.5, transparent: true}
          )
        }

        const userHeight = this.data.height
        const userWidth = this.data.width

        const geo = XRExtras.ThreeExtras.createTargetGeometry(
          detail, geometry === 'full', userHeight, userWidth
        )

        this.curvedMesh = new THREE.Mesh(geo, material)
        this.el.setObject3D('mesh', this.curvedMesh)

        this.el.emit('model-loaded')
      }

      this.el.parentNode.addEventListener('xrextrasimagegeometry', updateMesh)
    },
    update() {
      if (!this.curvedMesh) {
        return
      }

      let material
      if (this.el.getAttribute('material')) {
        material = this.el.components.material.material
      } else if (this.data['material-resource']) {
        material = this.el.sceneEl.querySelector(this.data['material-resource']).material
      } else {
        material = new THREE.MeshBasicMaterial({color: '#7611B6', opacity: 0.5, transparent: true})
      }
      this.curvedMesh.material = material
    },
  }

  const curvedTargetContainerComponent = {
    schema: {
      color: {type: 'string', default: '#464766'},
      height: {type: 'number'},
      width: {type: 'number'},
    },
    init() {
      const {object3D} = this.el

      let openingMesh = null
      let topMesh = null
      let bottomMesh = null
      let intTopMesh = null
      let intMesh = null
      let intBottomMesh = null

      // set interior container color
      const intColor = this.data.color

      // Similar to ThreeExtras.createTargetGeometry, except the cutout is inverse, and if the
      // geometry is not full, the cylinders are capped with meshes on top and bottom.
      const createCurvedContainerGeometry = (geometry, isFull, userHeight, userWidth) => {
        const length = (2 * Math.PI - geometry.arcLengthRadians) * (userWidth || 1)
        const open = isFull
        return new THREE.CylinderGeometry(
          geometry.radiusTop,
          geometry.radiusBottom,
          userHeight ? geometry.height * userHeight : geometry.height,
          50,
          1,
          open,
          (isFull ? 0.0 : (2 * Math.PI - length) / 2) + Math.PI,
          isFull ? 2 * Math.PI : length
        )
      }

      const createCircleGeometry = (geometry, top) => {
        const orientation = top ? geometry.radiusTop : geometry.radiusBottom
        return new THREE.CircleGeometry(orientation, 50)
      }

      const constructGeometry = ({detail}) => {
        // create hider CYLINDER - opening
        const userHeight = this.data.height
        const userWidth = this.data.width

        const openingEl = document.createElement('a-entity')
        const openingGeo = createCurvedContainerGeometry(detail, false, userHeight, userWidth)

        const material = new THREE.MeshBasicMaterial({colorWrite: false})
        openingMesh = new THREE.Mesh(openingGeo, material)
        openingMesh.rotation.set(0, Math.PI, 0)
        openingEl.setObject3D('mesh', openingMesh)
        this.el.appendChild(openingEl)

        const labelHeight = openingMesh.geometry.parameters.height

        // create hider CYLINDER - top
        const topEl = document.createElement('a-entity')
        const topGeo = createCurvedContainerGeometry(detail, true, userHeight, userWidth)
        topMesh = new THREE.Mesh(topGeo, material)
        topMesh.rotation.set(Math.PI, 0, 0)
        topEl.setObject3D('mesh', topMesh)
        topEl.object3D.position.set(0, labelHeight, 0)
        this.el.appendChild(topEl)

        // create hider CYLINDER - bottom
        const bottomEl = document.createElement('a-entity')
        const bottomGeo = createCurvedContainerGeometry(detail, true, userHeight, userWidth)
        bottomMesh = new THREE.Mesh(bottomGeo, material)
        bottomMesh.rotation.set(Math.PI, 0, 0)
        bottomEl.setObject3D('mesh', bottomMesh)
        bottomEl.object3D.position.set(0, -labelHeight, 0)
        this.el.appendChild(bottomEl)

        const intBackMat = new THREE.MeshStandardMaterial({color: intColor, side: THREE.BackSide})
        const intFrontMat = new THREE.MeshStandardMaterial({color: intColor, side: THREE.FrontSide})

        // create interior CIRCLE - top
        const intTopEl = document.createElement('a-entity')
        const intTopGeo = createCircleGeometry(detail, true)
        intTopMesh = new THREE.Mesh(intTopGeo, intFrontMat)
        intTopMesh.rotation.set(Math.PI / 2, 0, 0)
        intTopEl.setObject3D('mesh', intTopMesh)
        intTopEl.object3D.position.set(0, labelHeight / 2, 0)
        this.el.appendChild(intTopEl)

        // create interior CYLINDER
        const intEl = document.createElement('a-entity')
        const intGeo = createCurvedContainerGeometry(detail, true, userHeight, userWidth)
        intMesh = new THREE.Mesh(intGeo, intBackMat)
        intMesh.rotation.set(0, Math.PI, 0)
        intEl.setObject3D('mesh', intMesh)
        intEl.object3D.position.set(0, 0, 0)
        intEl.object3D.scale.set(1, 1, 1)
        this.el.appendChild(intEl)

        // create interior CIRCLE - bottom
        const intBottomEl = document.createElement('a-entity')
        const intBottomGeo = createCircleGeometry(detail, false)
        intBottomMesh = new THREE.Mesh(intBottomGeo, intBackMat)
        intBottomMesh.rotation.set(Math.PI / 2, 0, 0)
        intBottomEl.setObject3D('mesh', intBottomMesh)
        intBottomEl.object3D.position.set(0, -labelHeight / 2, 0)
        this.el.appendChild(intBottomEl)
      }

      this.el.parentNode.addEventListener('xrextrasimagegeometry', constructGeometry)
    },
  }

  const spinComponent = {
    schema: {
      speed: {default: 2000},
      direction: {default: 'normal'},
    },
    init() {
      const {el} = this
      el.setAttribute('animation__spin', {
        property: 'object3D.rotation.y',
        from: 0,
        to: 360,
        dur: this.data.speed,
        dir: this.data.direction,
        loop: true,
        easing: 'linear',
      })
    },
  }

  const targetVideoFadeComponent = {
    schema: {
      video: {type: 'string'},
      height: {type: 'number'},
      width: {type: 'number'},
    },
    init() {
      const {object3D} = this.el
      const v = document.querySelector(this.data.video)

      let geomMesh = null

      const constructGeometry = ({detail}) => {
        const geo = XRExtras.ThreeExtras.createTargetGeometry(
          detail, false, this.data.height, this.data.width
        )
        geomMesh = new THREE.Mesh(geo)
        this.el.setObject3D('mesh', geomMesh)
        this.el.setAttribute('material', 'opacity', 0)
        this.el.setAttribute('material', 'src', v)
      }

      const foundTarget = () => {
        v.play()
        this.el.setAttribute('animation', {
          property: 'components.material.material.opacity',
          dur: 800,
          isRawProperty: true,
          easing: 'easeInOutQuad',
          loop: false,
          to: '1',
        })
      }

      const lostTarget = () => {
        v.pause()
        v.currentTime = 0
        this.el.components.material.material.opacity = 0
        this.el.removeAttribute('animation')
      }

      this.el.parentNode.addEventListener('xrextrasimagegeometry', constructGeometry)
      this.el.parentNode.addEventListener('xrextrasfound', foundTarget)
      this.el.parentNode.addEventListener('xrextraslost', lostTarget)
    },
  }

  const targetVideoSoundComponent = {
    schema: {
      video: {type: 'string'},
      thumb: {type: 'string'},
      height: {type: 'number'},
      width: {type: 'number'},
    },
    init() {
      const {object3D} = this.el
      const v = document.querySelector(this.data.video)
      const p = this.data.thumb && document.querySelector(this.data.thumb)
      let tapped = false
      let geomMesh = null

      const constructGeometry = ({detail}) => {
        const geo = XRExtras.ThreeExtras.createTargetGeometry(
          detail, false, this.data.height, this.data.width
        )
        geomMesh = new THREE.Mesh(geo)
        this.el.setObject3D('mesh', geomMesh)

        this.el.setAttribute('class', 'cantap')
        this.el.setAttribute('material', 'src', p || v)
      }

      this.el.addEventListener('click', () => {
        if (!tapped) {
          this.el.setAttribute('material', 'src', v)
          v.play()
          tapped = true
        }
      })

      const foundTarget = () => {
        if (tapped) {
          v.play()
        }
      }

      const lostTarget = () => {
        if (tapped) {
          v.pause()
        }
      }

      this.el.parentNode.addEventListener('xrextrasimagegeometry', constructGeometry)
      this.el.parentNode.addEventListener('xrextrasfound', foundTarget)
      this.el.parentNode.addEventListener('xrextraslost', lostTarget)
    },
  }

  return {
    'xrextras-almost-there': almostThereComponent,
    'xrextras-loading': loadingComponent,
    'xrextras-runtime-error': runtimeErrorComponent,
    'xrextras-stats': statsComponent,
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
    'xrextras-pause-on-blur': pauseOnBlurComponent,
    'xrextras-pause-on-hidden': pauseOnHiddenComponent,
    'xrextras-faceanchor': faceAnchorComponent,
    'xrextras-resource': resourceComponent,
    'xrextras-pbr-material': pbrMaterialComponent,
    'xrextras-basic-material': basicMaterialComponent,
    'xrextras-video-material': videoMaterialComponent,
    'xrextras-face-mesh': faceMeshComponent,
    'xrextras-face-attachment': faceAttachmentComponent,
    'xrextras-hide-camera-feed': hideCameraFeedComponent,
    'xrextras-hider-material': hiderMaterialComponent,
    'xrextras-capture-button': captureButtonComponent,
    'xrextras-capture-preview': capturePreviewComponent,
    'xrextras-capture-config': captureConfigComponent,
    'xrextras-curved-target-container': curvedTargetContainerComponent,
    'xrextras-target-mesh': targetMeshComponent,
    'xrextras-target-video-fade': targetVideoFadeComponent,
    'xrextras-target-video-sound': targetVideoSoundComponent,
    'xrextras-spin': spinComponent,
  }
}

module.exports = {
  xrComponents,
}
