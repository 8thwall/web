// Copyright (c) 2021 8th Wall, Inc.
/* globals AFRAME */

// This component hides and shows certain elements as the camera moves
AFRAME.registerComponent('portal', {
  schema: {
    width: {default: 4},
    height: {default: 6},
    depth: {default: 1},
  },
  init() {
    this.camera = document.getElementById('camera')
    this.contents = document.getElementById('portal-contents')
    this.walls = document.getElementById('hider-walls')
    this.portalWall = document.getElementById('portal-wall')
    this.isInPortalSpace = false
    this.wasOutside = true
  },
  tick() {
    const {position} = this.camera.object3D

    const isOutside = position.z > this.data.depth / 2
    const withinPortalBounds =
      position.y < this.data.height && Math.abs(position.x) < this.data.width / 2

    if (this.wasOutside !== isOutside && withinPortalBounds) {
      this.isInPortalSpace = !isOutside
    }

    this.contents.object3D.visible = this.isInPortalSpace || isOutside
    this.walls.object3D.visible = !this.isInPortalSpace && isOutside
    this.portalWall.object3D.visible = this.isInPortalSpace && !isOutside

    this.wasOutside = isOutside
  },
})

AFRAME.registerComponent('bob', {
  schema: {
    distance: {default: 0.15},
    duration: {default: 1000},
  },
  init() {
    const {el} = this
    const {data} = this
    data.initialPosition = this.el.object3D.position.clone()
    data.downPosition = data.initialPosition.clone().setY(data.initialPosition.y - data.distance)
    data.upPosition = data.initialPosition.clone().setY(data.initialPosition.y + data.distance)

    const vectorToString = v => `${v.x} ${v.y} ${v.z}`
    data.initialPosition = vectorToString(data.initialPosition)
    data.downPosition = vectorToString(data.downPosition)
    data.upPosition = vectorToString(data.upPosition)

    data.timeout = null

    const animatePosition = position => el.setAttribute('animation__bob', {
      property: 'position',
      to: position,
      dur: data.duration,
      easing: 'easeInOutQuad',
      loop: false,
    })

    const bobDown = () => {
      if (data.shouldStop) {
        animatePosition(data.initialPosition)
        data.stopped = true
        return
      }
      animatePosition(data.downPosition)
      data.timeout = setTimeout(bobUp, data.duration)
    }

    const bobUp = () => {
      if (data.shouldStop) {
        animatePosition(data.initialPosition)
        data.stopped = true
        return
      }
      animatePosition(data.upPosition)
      data.timeout = setTimeout(bobDown, data.duration)
    }

    const bobStop = () => {
      data.shouldStop = true
    }
    const bobStart = () => {
      if (data.stopped) {
        data.shouldStop = false
        data.stopped = false
        bobUp()
      }
    }

    this.el.addEventListener('bobStart', bobStart)
    this.el.addEventListener('bobStop', bobStop)

    bobUp()
  },
})
