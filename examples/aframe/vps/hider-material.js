/* globals AFRAME THREE */
AFRAME.registerComponent('hider-material', {
  init() {
    const hiderMaterial = new THREE.MeshStandardMaterial()
    hiderMaterial.colorWrite = false

    const applyHiderMaterial = (mesh) => {
      if (!mesh) {
        return
      }
      if (mesh.material) {
        mesh.material = hiderMaterial
      }
      mesh.traverse((node) => {
        if (node.isMesh) {
          this.mat = node.material
          node.material = hiderMaterial
        }
      })
    }

    applyHiderMaterial(this.el.getObject3D('mesh'))
    this.el.addEventListener(
      'model-loaded', () => applyHiderMaterial(this.el.getObject3D('mesh'))
    )
  },
  remove() {
    const hiderMaterial = new THREE.MeshStandardMaterial()
    hiderMaterial.colorWrite = true

    const applyHiderMaterial = (mesh) => {
      if (!mesh) {
        return
      }
      if (mesh.material) {
        mesh.material = hiderMaterial
      }
      mesh.traverse((node) => {
        if (node.isMesh) {
          node.material = this.mat
        }
      })
    }

    applyHiderMaterial(this.el.getObject3D('mesh'))
    this.el.addEventListener(
      'model-loaded', () => applyHiderMaterial(this.el.getObject3D('mesh'))
    )
  },
})
