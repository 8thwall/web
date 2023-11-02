import type {ComponentDefinition} from 'aframe'

import {memo} from '../../common/factory'

declare const THREE: any
declare const XRExtras: any

// Keep in sync with face-controller
const EAR_POINTS = new Set([
  'leftHelix',
  'leftCanal',
  'leftLobe',
  'rightHelix',
  'rightCanal',
  'rightLobe',
])
const FACE_POINTS = new Set([
  'forehead',
  'rightEyebrowInner',
  'rightEyebrowMiddle',
  'rightEyebrowOuter',
  'leftEyebrowInner',
  'leftEyebrowMiddle',
  'leftEyebrowOuter',
  'leftEar',
  'rightEar',
  'leftCheek',
  'rightCheek',
  'noseBridge',
  'noseTip',
  'leftEye',
  'rightEye',
  'leftEyeOuterCorner',
  'rightEyeOuterCorner',
  'upperLip',
  'lowerLip',
  'mouth',
  'mouthRightCorner',
  'mouthLeftCorner',
  'chin',
  'leftIris',
  'rightIris',
  'leftUpperEyelid',
  'rightUpperEyelid',
  'leftLowerEyelid',
  'rightLowerEyelid',
])

const faceAttachmentComponent: ComponentDefinition = {
  schema: {
    'point': {type: 'string', default: 'forehead'},
  },
  init() {
    // Checks the face-id of the parent face-anchor to apply attachments correctly.
    const parentId = parseInt(this.el.parentEl.getAttribute('face-id'), 10) || 0

    // Schema check cannot be done on init because sceneEl.components are not parsed
    // @return true if schema is valid
    const schemaCheck = memo(() => {
      const isEarEnabled = this.el.sceneEl.components.xrface?.data.enableEars
      if (isEarEnabled) {
        if (!FACE_POINTS.has(this.data.point) && !EAR_POINTS.has(this.data.point)) {
          /* eslint-disable-next-line no-console */
          console.error(`${this.data.point} is not a valid face/ear point.`)
          return false
        }
      } else {
        // only face, no ear
        /* eslint-disable-next-line no-lonely-if */
        if (!FACE_POINTS.has(this.data.point)) {
          /* eslint-disable-next-line no-console */
          console.error(`${this.data.point} is not a valid face point.`)
          return false
        }
      }
      return true
    })

    const show = ({detail}) => {
      if (!schemaCheck()) {
        // Schema failed the check, no need to do anything else.
        return
      }
      if (parentId && detail.id !== parentId) {
        return
      }
      const position = detail.attachmentPoints[this.data.point]?.position
      if (!position) {
        return
      }
      this.el.object3D.position.copy(position)
      this.el.object3D.visible = true
    }

    const hide = ({detail}) => {
      if (parentId && detail.id !== parentId) {
        return
      }
      this.el.object3D.visible = false
    }

    this.el.sceneEl.addEventListener('xrfacefound', show)
    this.el.sceneEl.addEventListener('xrfaceupdated', show)
    this.el.sceneEl.addEventListener('xrfacelost', hide)
  },
}

const faceMeshComponent: ComponentDefinition = {
  schema: {
    'material-resource': {type: 'string'},
  },
  init() {
    this.headMesh = null

    const beforeRun = ({detail}) => {
      let material

      if (this.el.getAttribute('material')) {
        material = this.el.components.material.material
      } else if (this.data['material-resource']) {
        material = this.el.sceneEl.querySelector(this.data['material-resource']).material
      } else {
        material = new THREE.MeshBasicMaterial({color: '#7611B6', opacity: 0.5, transparent: true})
      }

      this.headMesh = XRExtras.ThreeExtras.faceMesh(detail, material)
      this.el.setObject3D('mesh', this.headMesh.mesh)

      this.el.emit('model-loaded')
    }

    const show = (event) => {
      this.headMesh.show(event)
      this.el.object3D.visible = true
    }

    const hide = () => {
      this.headMesh.hide()
      this.el.object3D.visible = false
    }

    this.el.sceneEl.addEventListener('xrfaceloading', beforeRun)
    this.el.sceneEl.addEventListener('xrfacefound', show)
    this.el.sceneEl.addEventListener('xrfaceupdated', show)
    this.el.sceneEl.addEventListener('xrfacelost', hide)
  },
  update() {
    if (!this.headMesh) {
      return
    }

    let material
    if (this.el.getAttribute('material')) {
      material = this.el.components.material.material
    } else if (this.data['material-resource']) {
      material = this.el.sceneEl.querySelector(this.data['material-resource']).material
    } else {
      material = new THREE.MeshBasicMaterial({color: '#7611B6', opacity: 0.5, transparent: true})
    }
    this.headMesh.mesh.material = material
  },
}

const faceAnchorComponent: ComponentDefinition = {
  schema: {
    // By default, this will be 0. The actual faceIds returned from the engine are either 1, 2, or
    // 3.
    faceId: {type: 'int'},
  },
  init() {
    // Before we've seen the face, we should hide the face contents.
    this.el.object3D.visible = false

    const show = ({detail}) => {
      if (this.data.faceId && detail.id !== this.data.faceId) {
        return
      }
      const {position, rotation, scale} = detail.transform
      this.el.object3D.position.copy(position)
      this.el.object3D.quaternion.copy(rotation)
      this.el.object3D.scale.set(scale, scale, scale)
      this.el.object3D.visible = true
    }

    const hide = ({detail}) => {
      if (this.data.faceId && detail.id !== this.data.faceId) {
        return
      }
      this.el.object3D.visible = false
    }

    this.el.sceneEl.addEventListener('xrfacefound', show)
    this.el.sceneEl.addEventListener('xrfaceupdated', show)
    this.el.sceneEl.addEventListener('xrfacelost', hide)
  },
}

export {
  faceAttachmentComponent,
  faceMeshComponent,
  faceAnchorComponent,
}
