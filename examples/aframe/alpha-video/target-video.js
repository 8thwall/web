// Copyright (c) 2021 8th Wall, Inc.
/* globals AFRAME */

AFRAME.registerComponent('target-video', {
  schema: {
    name: {type: 'string'},
    video: {type: 'string'},
  },
  init() {
    const {object3D} = this.el
    const {name} = this.data
    object3D.visible = false
    const v = document.querySelector(this.data.video)
    const {el} = this

    const showImage = ({detail}) => {
      if (name !== detail.name) {
        return
      }
      v.play()
      object3D.position.copy(detail.position)
      object3D.quaternion.copy(detail.rotation)
      object3D.scale.set(detail.scale, detail.scale, detail.scale)
      object3D.visible = true
    }

    const hideImage = ({detail}) => {
      if (name !== detail.name) {
        return
      }
      v.pause()
      object3D.visible = false
    }

    this.el.sceneEl.addEventListener('xrimagefound', showImage)
    this.el.sceneEl.addEventListener('xrimageupdated', showImage)
    this.el.sceneEl.addEventListener('xrimagelost', hideImage)
  },
})
