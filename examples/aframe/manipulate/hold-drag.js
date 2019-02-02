// Component that uses the gesture-detector and raycaster to drag and drop an object
AFRAME.registerComponent('hold-drag', {
  schema: {
    cameraId: {default: 'camera'},
    groundId: {default: 'ground'},
    dragDelay: {default: 300 },

  },
  init: function() {
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

    const tapRingInner = document.createElement('a-ring')
    tapRingInner.setAttribute('color', '#0dd')
    tapRingInner.setAttribute('ring-inner', '0.5')
    tapRingInner.setAttribute('ring-outer', '0.75')
    tapRingInner.setAttribute('rotation', '-90 0 0')
    tapRingInner.setAttribute('position', '0 0.1 0')

    this.tapRing = document.createElement('a-entity')
    this.tapRing.id = 'tapRing'
    this.tapRing.setAttribute('visible', 'false')
    this.tapRing.appendChild(tapRingInner)
    this.el.sceneEl.appendChild(this.tapRing)

    this.fingerDown = this.fingerDown.bind(this)
    this.startDrag = this.startDrag.bind(this)
    this.fingerMove = this.fingerMove.bind(this)
    this.fingerUp = this.fingerUp.bind(this)

    this.el.addEventListener('mousedown', this.fingerDown)
    this.el.sceneEl.addEventListener('onefingermove', this.fingerMove)
    this.el.sceneEl.addEventListener('onefingerend', this.fingerUp)
  },
  tick: function() {
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

      desiredPosition.y = 2
      this.el.object3D.position.lerp(desiredPosition, 0.2)

      this.tapRing.object3D.position.x = this.el.object3D.position.x
      this.tapRing.object3D.position.z = this.el.object3D.position.z
    }
  },
  remove: function() {
    this.el.removeEventListener('mousedown', fingerDown)
    this.el.scene.removeEventListener('onefingermove', fingerMove)
    this.el.scene.removeEventListener('onefingerend', fingerUp)
    this.tapRing.parentNode.removeChild(this.tapRing)
  },
  fingerDown: function(event) {
    this.internalState.fingerDown = true
    this.internalState.startDragTimeout = setTimeout(this.startDrag, this.data.dragDelay)
    this.internalState.positionRaw = event.detail.positionRaw
  },
  startDrag: function(event) {
      if (!this.internalState.fingerDown ) {
        return
      }
      this.internalState.dragging = true
      this.internalState.distance = this.el.object3D.position.distanceTo(this.camera.object3D.position)
      this.tapRing.setAttribute('visible', 'true')
      this.tapRing.object3D.scale.copy({x: 0.001, y: 0.001, z: 0.001})
      this.tapRing.removeAttribute('animation__scale')
      this.tapRing.setAttribute('animation__scale', {
        property: 'scale',
        dur: 300,
        from: '0.001 0.001 0.001',
        to: '1 1 1',
        easing: 'easeOutQuad',
      })
    },
  fingerMove: function(event) {
    this.internalState.positionRaw = event.detail.positionRaw
  },
  fingerUp: function(event) {
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

      this.tapRing.removeAttribute('animation__scale')
      this.tapRing.setAttribute('animation__scale', {
          property: 'scale',
          dur: 300,
          to: '0.001 0.001 0.001',
          easing: 'easeInQuad',
      })
      setTimeout(() => this.tapRing.setAttribute('visible', 'false'), 300)
    }
    this.internalState.dragging = false
  }
})
