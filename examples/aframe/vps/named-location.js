/* globals AFRAME */
// Updates a single a-entity to track a VPS Location with the given name.
AFRAME.registerComponent('named-location', {
  schema: {
    name: {type: 'string'},
  },
  init() {
    const {object3D} = this.el
    const {name} = this.data
    this.el.sceneEl.addEventListener('realityready', () => {
      object3D.visible = false
    })

    const foundLocation = ({detail}) => {
      if (name !== detail.name) {
        return
      }
      object3D.position.copy(detail.position)
      object3D.quaternion.copy(detail.rotation)
      object3D.visible = true
    }

    const lostLocation = ({detail}) => {
      if (name !== detail.name) {
        return
      }
      object3D.visible = false
    }

    this.el.sceneEl.addEventListener('xrprojectwayspotfound', foundLocation)
    this.el.sceneEl.addEventListener('xrprojectwayspotlost', lostLocation)
  },
})
