import type {ComponentDefinition} from 'aframe'

declare const XRExtras: any
declare const XR8: any

interface AFrameElement extends HTMLElement {
  object3D: THREE.Object3D
}

// Show or hide sub-elements if the user has an opaque background session.
const opaqueBackgroundComponent: ComponentDefinition = {
  schema: {
    'remove': {default: false},
  },
  init() {
    const obj = this.el.object3D
    const {remove} = this.data
    const onAttach = ({rendersOpaque}) => {
      // rendersOpaque = 1 | remove = 1 | visible = 0
      // rendersOpaque = 1 | remove = 0 | visible = 1
      // rendersOpaque = 0 | remove = 1 | visible = 1
      // rendersOpaque = 0 | remove = 0 | visible = 0
      obj.visible = !!rendersOpaque !== !!remove  // cast to bool, !==
    }
    XRExtras.Lifecycle.attachListener.add(onAttach)
    this.onAttach = onAttach
  },
  remove() {
    XRExtras.Lifecycle.attachListener.delete(this.onAttach)
  },
}

const attachComponent: ComponentDefinition = {
  schema: {
    target: {default: ''},
    offset: {default: '0 0 0'},
  },
  update() {
    const targetElement = document.getElementById(this.data.target) as AFrameElement
    if (!targetElement) {
      return
    }
    this.target = targetElement.object3D
    this.offset = this.data.offset.split(' ').map(n => Number(n))
  },
  tick() {
    if (!this.target) {
      return
    }
    const [x, y, z] = this.offset
    this.el.object3D.position.set(
      this.target.position.x + x, this.target.position.y + y, this.target.position.z + z
    )
  },
}

type PromptConfig = {
  delayAfterDismissalMillis?: number
  minNumVisits?: number
}

type DisplayConfig = {
  name?: string
  iconSrc?: string
  installTitle?: string
  installSubtitle?: string
  installButtonText?: string
  iosInstallText?: string
}

type PWAConfig = {
  promptConfig: PromptConfig
  displayConfig: DisplayConfig
}

const pwaInstallerComponent: ComponentDefinition = {
  schema: {
    name: {default: ''},
    iconSrc: {default: ''},
    installTitle: {default: ''},
    installSubtitle: {default: ''},
    installButtonText: {default: ''},
    iosInstallText: {default: ''},
    delayAfterDismissalMillis: {default: -1, type: 'int'},
    minNumVisits: {default: -1, type: 'int'},
  },
  init() {
    const load = () => {
      const {
        name,
        iconSrc,
        installTitle,
        installSubtitle,
        installButtonText,
        iosInstallText,
        delayAfterDismissalMillis,
        minNumVisits,
      } = this.data
      const config: PWAConfig = {
        promptConfig: {},
        displayConfig: {},
      }
      if (name) {
        config.displayConfig.name = name
      }
      if (iconSrc) {
        config.displayConfig.iconSrc = iconSrc
      }
      if (installTitle) {
        config.displayConfig.installTitle = installTitle
      }
      if (installSubtitle) {
        config.displayConfig.installSubtitle = installSubtitle
      }
      if (installButtonText) {
        config.displayConfig.installButtonText = installButtonText
      }
      if (iosInstallText) {
        config.displayConfig.iosInstallText = iosInstallText
      }
      if (delayAfterDismissalMillis >= 0) {
        config.promptConfig.delayAfterDismissalMillis = delayAfterDismissalMillis
      }
      if (minNumVisits >= 0) {
        config.promptConfig.minNumVisits = minNumVisits
      }

      if (Object.keys(config.promptConfig).length || Object.keys(config.displayConfig).length) {
        XRExtras.PwaInstaller.configure(config)
      }
      XR8.addCameraPipelineModule(XRExtras.PwaInstaller.pipelineModule())
    }

    window.XRExtras && window.XR8
      ? load()
      : window.addEventListener('xrandextrasloaded', load, {once: true})
  },
  remove() {
    XR8.removeCameraPipelineModule('pwa-installer')
  },
}

const pauseOnBlurComponent: ComponentDefinition = {
  init() {
    const scene = this.el.sceneEl
    const blur = () => scene.pause()
    const focus = () => scene.play()
    XR8.addCameraPipelineModule({
      name: 'pauseonbluraframe',
      onAttach: () => {
        window.addEventListener('blur', blur)
        window.addEventListener('focus', focus)
      },
      onDetach: () => {
        window.removeEventListener('blur', blur)
        window.removeEventListener('focus', focus)
      },
    })
  },
  remove() {
    XR8.removeCameraPipelineModule('pauseonbluraframe')
  },
}

const pauseOnHiddenComponent: ComponentDefinition = {
  init() {
    const scene = this.el.sceneEl
    const onVisChange = () => {
      if (document.visibilityState === 'visible') {
        scene.play()
      } else {
        scene.pause()
      }
    }
    XR8.addCameraPipelineModule({
      name: 'pauseonhiddenaframe',
      onAttach: () => {
        document.addEventListener('visibilitychange', onVisChange)
      },
      onDetach: () => {
        document.removeEventListener('visibilitychange', onVisChange)
      },
    })
  },
  remove() {
    XR8.removeCameraPipelineModule('pauseonhiddenaframe')
  },
}

const hideCameraFeedComponent: ComponentDefinition = {
  schema: {
    color: {type: 'string', default: '#2D2E43'},
  },
  init() {
    this.el.sceneEl.emit('hidecamerafeed')
    this.firstTick = true
    // If there is not a skybox in the scene, add one with the specified color.
    if (!document.querySelector('a-sky')) {
      this.skyEl = document.createElement('a-sky')
      this.skyEl.setAttribute('color', this.data.color)
      this.el.sceneEl.appendChild(this.skyEl)
    }
  },
  tick() {
    if (!this.firstTick) {
      return
    }
    // If xrextras-hide-camera-feed is added to the dom before xrweb or xrface, those components
    // won't intialize in time to receive the hidecamerafeed message, so we need to send it
    // again.
    this.firstTick = false
    this.el.sceneEl.emit('hidecamerafeed')
  },
  remove() {
    this.el.sceneEl.emit('showcamerafeed')
    // Remove the skybox if we added one.
    if (this.skyEl) {
      this.el.sceneEl.removeChild(this.skyEl)
    }
  },
}

// Display 'almost there' flows.
const almostThereComponent: ComponentDefinition = {
  schema: {
    url: {default: ''},
  },
  init() {
    const load = () => {
      this.data.url && XRExtras.AlmostThere.configure({url: this.data.url})
      XR8.addCameraPipelineModule(XRExtras.AlmostThere.pipelineModule())
    }
    window.XRExtras && window.XR8
      ? load()
      : window.addEventListener('xrandextrasloaded', load, {once: true})
  },
  remove() {
    XRExtras.AlmostThere.hideAlmostThere()
    XR8.removeCameraPipelineModule('almostthere')
  },
}

// Display loading screen.
const onxrloaded = () => { XR8.addCameraPipelineModule(XRExtras.Loading.pipelineModule()) }
const loadingComponent: ComponentDefinition = {
  schema: {
    loadBackgroundColor: {default: ''},
    cameraBackgroundColor: {default: ''},
    loadImage: {default: ''},
    loadAnimation: {default: ''},
  },
  init() {
    let aframeLoaded = false
    this.el.addEventListener('loaded', () => { aframeLoaded = true })
    const aframeDidLoad = () => aframeLoaded
    const load = () => {
      XRExtras.Loading.setAppLoadedProvider(aframeDidLoad)
      const waitForRealityTexture =
        !!(this.el.sceneEl.attributes.xrweb ||
          this.el.sceneEl.attributes.xrface ||
          this.el.sceneEl.attributes.xrlayers)
      XRExtras.Loading.showLoading({onxrloaded, waitForRealityTexture})
    }
    window.XRExtras ? load() : window.addEventListener('xrextrasloaded', load, {once: true})

    const loadImg = document.querySelector('#loadImage') as any

    if (loadImg) {
      if (this.data.loadImage !== '') {
        const imgElement = document.querySelector(this.data.loadImage) as any
        if (imgElement) {  // Added null check
          loadImg.src = imgElement.src
        }
      }

      if (this.data.loadAnimation !== '') {
        loadImg.classList.remove('spin')
        if (this.data.loadAnimation !== 'none') {
          loadImg.classList.add(this.data.loadAnimation)
        }
      }
    }

    const loadBackground = document.querySelector('#loadBackground')

    if (loadBackground) {
      loadBackground.style.backgroundColor = this.data.loadBackgroundColor
    }

    const requestingCameraPermissions = document.querySelector('#requestingCameraPermissions')

    if (requestingCameraPermissions) {
      requestingCameraPermissions.style.backgroundColor = this.data.cameraBackgroundColor
    }
  },
  remove() {
    XR8.removeCameraPipelineModule('loading')
  },
}

export {
  opaqueBackgroundComponent,
  attachComponent,
  pwaInstallerComponent,
  pauseOnBlurComponent,
  pauseOnHiddenComponent,
  hideCameraFeedComponent,
  almostThereComponent,
  loadingComponent,
}
