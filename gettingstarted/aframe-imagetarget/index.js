// Manages the position of the image target.
AFRAME.registerComponent('image-target', {
  init: function () {
    const {object3D, sceneEl} = this.el
    object3D.visible = false

    // Sets the position of the frame to match the image target.
    const showImage = ({detail}) => {
      object3D.position.copy(detail.position)
      object3D.quaternion.copy(detail.rotation)
      object3D.scale.set(detail.scale, detail.scale, detail.scale)
      object3D.visible = true
    }

    // Update the position of the frame when the image target is found or updated.
    sceneEl.addEventListener('xrimagefound', showImage)
    sceneEl.addEventListener('xrimageupdated', showImage)

    // Hide the image target when tracking is lost.
    sceneEl.addEventListener('xrimagelost', () => {object3D.visible = false})
  }
})

// Displays the name of the image target as it was set in the 8th Wall console.
AFRAME.registerComponent('targetname', {
  init: function () {
    const el = this.el
    el.sceneEl.addEventListener('xrimagefound', ({detail}) => {
      el.setAttribute(
        'value', detail.name.length > 20 ? `${detail.name.substring(0, 17)}...` : detail.name)
    })
  }
})
