import type {ComponentDefinition} from 'aframe'

declare const XRExtras: any

const resourceComponent: ComponentDefinition = {
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

const pbrMaterialComponent: ComponentDefinition = {
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

const basicMaterialComponent: ComponentDefinition = {
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

const videoMaterialComponent: ComponentDefinition = {
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

const hiderMaterialComponent: ComponentDefinition = {
  init() {
    const hiderMaterial = new window.THREE.MeshStandardMaterial()
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

export {
  resourceComponent,
  pbrMaterialComponent,
  basicMaterialComponent,
  videoMaterialComponent,
  hiderMaterialComponent,
}
