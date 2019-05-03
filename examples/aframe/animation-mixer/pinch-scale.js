AFRAME.registerComponent('pinch-scale', {
  schema: {
    min: {default: 0.3},
    max: {default: 8}
  },
  init: function() {
    this.initialScale = this.el.object3D.scale.clone()
    this.scaleFactor = 1
    this.handleEvent = this.handleEvent.bind(this)
    this.el.sceneEl.addEventListener('twofingermove', this.handleEvent)
  },
  remove: function() {
    this.el.sceneEl.removeEventListener('twofingermove', this.handleEvent)
  },
  handleEvent: function(event) {
    this.scaleFactor *= 1 + event.detail.spreadChange / event.detail.startSpread
    this.scaleFactor = Math.min(Math.max(this.scaleFactor, this.data.min), this.data.max)

    this.el.object3D.scale.x = this.scaleFactor * this.initialScale.x
    this.el.object3D.scale.y = this.scaleFactor * this.initialScale.y
    this.el.object3D.scale.z = this.scaleFactor * this.initialScale.z
  }
})
