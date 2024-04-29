/* globals AFRAME THREE */
AFRAME.registerComponent('shadow-shader', {
  schema: {
    'opacity': {default: 0.4},
  },
  update() {
    if (typeof AFRAME === 'undefined') {
      throw new Error('Component attempted to register before AFRAME was available.')
    }

    const shadowMaterial = new THREE.ShadowMaterial()
    shadowMaterial.opacity = this.data.opacity
    shadowMaterial.transparent = true
    shadowMaterial.polygonOffset = true
    shadowMaterial.polygonOffsetFactor = -4

    const applyShadowMaterial = (mesh) => {
      if (!mesh) {
        return
      }
      if (mesh.material) {
        mesh.material = shadowMaterial
        mesh.material.needsUpdate = true
      }
      mesh.traverse((node) => {
        if (node.isMesh) {
          node.material = shadowMaterial
        }
      })
    }

    if (this.el.getObject3D('mesh')) {
      applyShadowMaterial(this.el.getObject3D('mesh'))
    } else {
      this.el.addEventListener('model-loaded', () => {
        applyShadowMaterial(this.el.getObject3D('mesh'))
        this.el.object3D.traverse((obj) => {
          obj.frustumCulled = false
        })
      })
    }
  },
})
