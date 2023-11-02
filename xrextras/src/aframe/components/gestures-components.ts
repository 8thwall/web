import type {ComponentDefinition} from 'aframe'

declare const THREE: any

// Recenter the scene when the screen is tapped.
const tapRecenterComponent: ComponentDefinition = {
  init() {
    const scene = this.el.sceneEl
    scene.addEventListener('click', () => { scene.emit('recenter', {}) })
  },
}

type FingerMoveEvent = {
  positionChange: {
    x: number
    y: number
  },
  touchCount: number
  startTime: number
  startSpread: number
  spreadChange: number
  startPosition: {
    x: number
    y: number
  }
  positionRaw: {
    x: number
    y: number
  }
}

interface GestureDetectorComponentDefinition extends ComponentDefinition {
  emitGestureEvent: (event: TouchEvent) => void
  getTouchState: (event: TouchEvent) => FingerMoveEvent
  getEventPrefix: (event: number) => string
}

// Component that detects and emits events for touch gestures
const gestureDetectorComponent: GestureDetectorComponentDefinition = {
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
      const eventDetail: any = {
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

    const touchState: any = {
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

type DragCallback = ({detail}: {detail: FingerMoveEvent}) => void

interface FingerMoveComponentDefinition extends ComponentDefinition {
  handleEvent: DragCallback
}

const oneFingerRotateComponent: FingerMoveComponentDefinition = {
  schema: {
    factor: {default: 6},
  },
  init() {
    this.handleEvent = this.handleEvent.bind(this)
    this.el.sceneEl.addEventListener('onefingermove', this.handleEvent)
    this.el.classList.add('cantap')  // Needs "objects: .cantap" attribute on raycaster.
  },
  remove() {
    this.el.sceneEl.removeEventListener('onefingermove', this.handleEvent)
  },
  handleEvent(event) {
    this.el.object3D.rotation.y += event.detail.positionChange.x * this.data.factor
  },
}

const twoFingerRotateComponent: FingerMoveComponentDefinition = {
  schema: {
    factor: {default: 5},
  },
  init() {
    this.handleEvent = this.handleEvent.bind(this)
    this.el.sceneEl.addEventListener('twofingermove', this.handleEvent)
    this.el.classList.add('cantap')  // Needs "objects: .cantap" attribute on raycaster.
  },
  remove() {
    this.el.sceneEl.removeEventListener('twofingermove', this.handleEvent)
  },
  handleEvent(event) {
    this.el.object3D.rotation.y += event.detail.positionChange.x * this.data.factor
  },
}

const pinchScaleComponent: FingerMoveComponentDefinition = {
  schema: {
    min: {default: 0.33},
    max: {default: 3},
    scale: {default: 0},  // If scale is set to zero here, the object's initial scale is used.
  },
  init() {
    const s = this.data.scale
    this.initialScale = (s && {x: s, y: s, z: s}) || this.el.object3D.scale.clone()
    this.scaleFactor = 1
    this.handleEvent = this.handleEvent.bind(this)
    this.el.sceneEl.addEventListener('twofingermove', this.handleEvent)
    this.el.classList.add('cantap')  // Needs "objects: .cantap" attribute on raycaster.
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

interface HoldDragComponentDefinition extends ComponentDefinition {
  fingerDown: DragCallback
  startDrag: DragCallback
  fingerMove: DragCallback
  fingerUp: DragCallback
}

const holdDragComponent: HoldDragComponentDefinition = {
  schema: {
    cameraId: {default: 'camera'},
    groundId: {default: 'ground'},
    dragDelay: {default: 300},
    riseHeight: {default: 1},
  },
  init() {
    this.camera = document.getElementById(this.data.cameraId)
    if (!this.camera) {
      throw new Error(`[xrextras-hold-drag] Couldn't find camera with id '${this.data.cameraId}'`)
    }
    this.threeCamera = this.camera.getObject3D('camera')
    this.ground = document.getElementById(this.data.groundId)
    if (!this.ground) {
      throw new Error(`[xrextras-hold-drag] Couldn't find ground with id '${this.data.groundId}'`)
    }

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
    this.el.classList.add('cantap')  // Needs "objects: .cantap" attribute on raycaster.
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

      desiredPosition.y = this.data.riseHeight
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

// Triggers video playback on tap.
const playVideoComponent: ComponentDefinition = {
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

export {
  tapRecenterComponent,
  gestureDetectorComponent,
  oneFingerRotateComponent,
  twoFingerRotateComponent,
  pinchScaleComponent,
  holdDragComponent,
  playVideoComponent,
  FingerMoveComponentDefinition,
  GestureDetectorComponentDefinition,
  HoldDragComponentDefinition,
}
