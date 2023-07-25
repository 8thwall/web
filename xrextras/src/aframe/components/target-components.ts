import type {ComponentDefinition} from 'aframe'

declare const THREE: any
declare const XRExtras: any

const targetMeshComponent: ComponentDefinition = {
  schema: {
    'material-resource': {type: 'string'},
    'geometry': {type: 'string'},
    'height': {type: 'number'},
    'width': {type: 'number'},
  },
  init() {
    this.curvedMesh = null

    const geometry = ['full', 'label'].includes(this.data.geometry) ? this.data.geometry : 'label'

    const updateMesh = ({detail}) => {
      let material

      if (this.el.getAttribute('material')) {
        material = this.el.components.material.material
      } else if (this.data['material-resource']) {
        material = this.el.sceneEl.querySelector(this.data['material-resource']).material
      } else {
        material = new THREE.MeshBasicMaterial(
          {color: '#7611B6', opacity: 0.5, transparent: true}
        )
      }

      const userHeight = this.data.height
      const userWidth = this.data.width

      const geo = XRExtras.ThreeExtras.createTargetGeometry(
        detail, geometry === 'full', userHeight, userWidth
      )

      this.curvedMesh = new THREE.Mesh(geo, material)
      this.el.setObject3D('mesh', this.curvedMesh)

      this.el.emit('model-loaded')
    }

    this.el.parentNode.addEventListener('xrextrasimagegeometry', updateMesh)
  },
  update() {
    if (!this.curvedMesh) {
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
    this.curvedMesh.material = material
  },
}

const curvedTargetContainerComponent: ComponentDefinition = {
  schema: {
    color: {type: 'string', default: '#464766'},
    height: {type: 'number'},
    width: {type: 'number'},
  },
  init() {
    const {object3D} = this.el

    let openingMesh = null
    let topMesh = null
    let bottomMesh = null
    let intTopMesh = null
    let intMesh = null
    let intBottomMesh = null

    // set interior container color
    const intColor = this.data.color

    // Similar to ThreeExtras.createTargetGeometry, except the cutout is inverse, and if the
    // geometry is not full, the cylinders are capped with meshes on top and bottom.
    const createCurvedContainerGeometry = (geometry, isFull, userHeight, userWidth) => {
      const length = (2 * Math.PI - geometry.arcLengthRadians) * (userWidth || 1)
      const open = isFull
      return new THREE.CylinderGeometry(
        geometry.radiusTop,
        geometry.radiusBottom,
        userHeight ? geometry.height * userHeight : geometry.height,
        50,
        1,
        open,
        (isFull ? 0.0 : (2 * Math.PI - length) / 2) + Math.PI,
        isFull ? 2 * Math.PI : length
      )
    }

    const createCircleGeometry = (geometry, top) => {
      const orientation = top ? geometry.radiusTop : geometry.radiusBottom
      return new THREE.CircleGeometry(orientation, 50)
    }

    const constructGeometry = ({detail}) => {
      // create hider CYLINDER - opening
      const userHeight = this.data.height
      const userWidth = this.data.width

      const openingEl = document.createElement('a-entity')
      const openingGeo = createCurvedContainerGeometry(detail, false, userHeight, userWidth)

      const material = new THREE.MeshBasicMaterial({colorWrite: false})
      openingMesh = new THREE.Mesh(openingGeo, material)
      openingMesh.rotation.set(0, Math.PI, 0)
      openingEl.setObject3D('mesh', openingMesh)
      this.el.appendChild(openingEl)

      const labelHeight = openingMesh.geometry.parameters.height

      // create hider CYLINDER - top
      const topEl = document.createElement('a-entity')
      const topGeo = createCurvedContainerGeometry(detail, true, userHeight, userWidth)
      topMesh = new THREE.Mesh(topGeo, material)
      topMesh.rotation.set(Math.PI, 0, 0)
      topEl.setObject3D('mesh', topMesh)
      topEl.object3D.position.set(0, labelHeight, 0)
      this.el.appendChild(topEl)

      // create hider CYLINDER - bottom
      const bottomEl = document.createElement('a-entity')
      const bottomGeo = createCurvedContainerGeometry(detail, true, userHeight, userWidth)
      bottomMesh = new THREE.Mesh(bottomGeo, material)
      bottomMesh.rotation.set(Math.PI, 0, 0)
      bottomEl.setObject3D('mesh', bottomMesh)
      bottomEl.object3D.position.set(0, -labelHeight, 0)
      this.el.appendChild(bottomEl)

      const intBackMat = new THREE.MeshStandardMaterial({color: intColor, side: THREE.BackSide})
      const intFrontMat = new THREE.MeshStandardMaterial({color: intColor, side: THREE.FrontSide})

      // create interior CIRCLE - top
      const intTopEl = document.createElement('a-entity')
      const intTopGeo = createCircleGeometry(detail, true)
      intTopMesh = new THREE.Mesh(intTopGeo, intFrontMat)
      intTopMesh.rotation.set(Math.PI / 2, 0, 0)
      intTopEl.setObject3D('mesh', intTopMesh)
      intTopEl.object3D.position.set(0, labelHeight / 2, 0)
      this.el.appendChild(intTopEl)

      // create interior CYLINDER
      const intEl = document.createElement('a-entity')
      const intGeo = createCurvedContainerGeometry(detail, true, userHeight, userWidth)
      intMesh = new THREE.Mesh(intGeo, intBackMat)
      intMesh.rotation.set(0, Math.PI, 0)
      intEl.setObject3D('mesh', intMesh)
      intEl.object3D.position.set(0, 0, 0)
      intEl.object3D.scale.set(1, 1, 1)
      this.el.appendChild(intEl)

      // create interior CIRCLE - bottom
      const intBottomEl = document.createElement('a-entity')
      const intBottomGeo = createCircleGeometry(detail, false)
      intBottomMesh = new THREE.Mesh(intBottomGeo, intBackMat)
      intBottomMesh.rotation.set(Math.PI / 2, 0, 0)
      intBottomEl.setObject3D('mesh', intBottomMesh)
      intBottomEl.object3D.position.set(0, -labelHeight / 2, 0)
      this.el.appendChild(intBottomEl)
    }

    this.el.parentNode.addEventListener('xrextrasimagegeometry', constructGeometry)
  },
}

const targetVideoFadeComponent: ComponentDefinition = {
  schema: {
    video: {type: 'string'},
    height: {type: 'number'},
    width: {type: 'number'},
  },
  init() {
    const {object3D} = this.el
    // TODO(nathan): figure out how to go from Element to HTMLVideoElement without unknown.
    const v = document.querySelector(this.data.video) as unknown as HTMLVideoElement

    let geomMesh = null

    const constructGeometry = ({detail}) => {
      const geo = XRExtras.ThreeExtras.createTargetGeometry(
        detail, false, this.data.height, this.data.width
      )
      geomMesh = new THREE.Mesh(geo)
      this.el.setObject3D('mesh', geomMesh)
      this.el.setAttribute('material', 'opacity', 0)
      this.el.setAttribute('material', 'src', v)
    }

    const foundTarget = () => {
      v.play()
      this.el.setAttribute('animation', {
        property: 'components.material.material.opacity',
        dur: 800,
        isRawProperty: true,
        easing: 'easeInOutQuad',
        loop: false,
        to: '1',
      })
    }

    const lostTarget = () => {
      v.pause()
      v.currentTime = 0
      this.el.components.material.material.opacity = 0
      this.el.removeAttribute('animation')
    }

    this.el.parentNode.addEventListener('xrextrasimagegeometry', constructGeometry)
    this.el.parentNode.addEventListener('xrextrasfound', foundTarget)
    this.el.parentNode.addEventListener('xrextraslost', lostTarget)
  },
}

const targetVideoSoundComponent: ComponentDefinition = {
  schema: {
    video: {type: 'string'},
    thumb: {type: 'string'},
    height: {type: 'number'},
    width: {type: 'number'},
  },
  init() {
    const {object3D} = this.el
    const v = document.querySelector(this.data.video)
    const p = this.data.thumb && document.querySelector(this.data.thumb)
    let tapped = false
    let geomMesh = null

    const constructGeometry = ({detail}) => {
      const geo = XRExtras.ThreeExtras.createTargetGeometry(
        detail, false, this.data.height, this.data.width
      )
      geomMesh = new THREE.Mesh(geo)
      this.el.setObject3D('mesh', geomMesh)

      this.el.setAttribute('class', 'cantap')
      this.el.setAttribute('material', 'src', p || v)
    }

    this.el.addEventListener('click', () => {
      if (!tapped) {
        this.el.setAttribute('material', 'src', v)
        v.play()
        tapped = true
      }
    })

    const foundTarget = () => {
      if (tapped) {
        v.play()
      }
    }

    const lostTarget = () => {
      if (tapped) {
        v.pause()
      }
    }

    this.el.parentNode.addEventListener('xrextrasimagegeometry', constructGeometry)
    this.el.parentNode.addEventListener('xrextrasfound', foundTarget)
    this.el.parentNode.addEventListener('xrextraslost', lostTarget)
  },
}

// Materialize aframe primitives into the scene at detected image locations.
//
// Entities will have the fllowing attributes set:
// - Name: The name of the image target.
// - Rotated: Whether the image targes are stored rotated.
// - Metadata: Metadata that was supplied in the xr console.
const generateImageTargetsComponent: ComponentDefinition = {
  schema: {
    primitive: {type: 'string'},
  },
  init() {
    const componentMap = {}

    const addComponents = ({detail}) => {
      detail.imageTargets.forEach(({name, type, metadata, properties}) => {
        const el = document.createElement(this.data.primitive)
        el.setAttribute('id', `xrextras-imagetargets-${name}`)
        el.setAttribute('name', name)
        el.setAttribute('type', type)
        el.setAttribute('rotated', (properties && properties.isRotated) ? 'true' : 'false')
        el.setAttribute(
          'metadata', (typeof metadata === 'string') ? metadata : JSON.stringify(metadata)
        )
        document.querySelector('a-scene').appendChild(el)
        componentMap[name] = el
      })
    }

    const forwardEvent = (event) => {
      const component = componentMap[event.detail.name]
      if (!component) {
        return
      }
      component.emit(event.type, event.detail, false)
    }

    this.el.sceneEl.addEventListener('xrimageloading', addComponents)
    this.el.sceneEl.addEventListener('xrimagefound', forwardEvent)
    this.el.sceneEl.addEventListener('xrimageupdated', forwardEvent)
    this.el.sceneEl.addEventListener('xrimagelost', forwardEvent)
  },
}

// Updates a single a-entity to track the image target with the given name (specified in 8th wall
// console).
const namedImageTargetComponent: ComponentDefinition = {
  schema: {
    name: {type: 'string'},
  },
  init() {
    const {object3D} = this.el
    const {name} = this.data
    const geometry = {}

    const onready = () => {
      this.el.sceneEl.removeEventListener('realityready', onready)
      object3D.visible = false
    }

    this.el.sceneEl.addEventListener('realityready', onready)

    const checkGeometry = (newGeometry) => {
      let needsUpdate = false

      const fields = [
        'type',
        'height',
        'radiusTop',
        'radiusBottom',
        'arcLengthRadians',
        'arcStartRadians',
        'scaledWidth',
        'scaledHeight',
      ]
      fields.forEach((f) => {
        if (geometry[f] !== newGeometry[f]) {
          geometry[f] = newGeometry[f]
          needsUpdate = true
        }
      })

      if (needsUpdate) {
        this.el.emit('xrextrasimagegeometry', geometry, false)
      }
    }

    const imageScanning = ({detail}) => {
      detail.imageTargets.forEach((t) => {
        if (name !== t.name) {
          return
        }
        checkGeometry({type: t.type, ...t.geometry})
      })
    }

    const updateImage = ({detail}) => {
      if (name !== detail.name) {
        return
      }
      object3D.position.copy(detail.position)
      object3D.quaternion.copy(detail.rotation)
      object3D.scale.set(detail.scale, detail.scale, detail.scale)
      object3D.visible = true
    }

    const showImage = ({detail}) => {
      if (name !== detail.name) {
        return
      }
      checkGeometry(detail)
      updateImage({detail})
      this.el.emit('xrextrasfound', {}, false)
    }

    const hideImage = ({detail}) => {
      if (name !== detail.name) {
        return
      }
      this.el.emit('xrextraslost', {}, false)
      object3D.visible = false
    }

    this.el.sceneEl.addEventListener('xrimagescanning', imageScanning)
    this.el.sceneEl.addEventListener('xrimagefound', showImage)
    this.el.sceneEl.addEventListener('xrimageupdated', updateImage)
    this.el.sceneEl.addEventListener('xrimagelost', hideImage)
  },
}

const spinComponent: ComponentDefinition = {
  schema: {
    speed: {default: 2000},
    direction: {default: 'normal'},
  },
  init() {
    this.el.setAttribute('animation__spin', {
      property: 'object3D.rotation.y',
      from: 0,
      to: 360,
      dur: this.data.speed,
      dir: this.data.direction,
      loop: true,
      easing: 'linear',
    })
  },
  remove() {
    this.el.removeAttribute('animation__spin')
  },
}

export {
  targetMeshComponent,
  curvedTargetContainerComponent,
  targetVideoFadeComponent,
  targetVideoSoundComponent,
  generateImageTargetsComponent,
  namedImageTargetComponent,
  spinComponent,
}
