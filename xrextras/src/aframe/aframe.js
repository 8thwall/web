const {xrComponents} = require('./xr-components.js')
const {xrPrimitives} = require('./xr-primitives.js')
const {ensureXrAndExtras} = require('./ensure')

let xrextrasAframe = null

const AFrameFactory = () => {
  if (!xrextrasAframe) {
    xrextrasAframe = create()
  }

  return xrextrasAframe
}

const onxrloaded = () => { XR8.addCameraPipelineModule(XRExtras.Loading.pipelineModule()) }

function create() {
  let registered = false

  // NOTE: new versions of 8frame should be added in descending order, so that the latest version
  // is always in position 1.
  const allowed8FrameVersions = ['latest', '0.9.0', '0.8.2']
  const LATEST_8FRAME = allowed8FrameVersions[1] // The 'latest' version of 8frame.

  // Check that the requested version of AFrame has a corresponding 8Frame implementation.
  const checkAllowed8FrameVersions = version => new Promise((resolve, reject) => (allowed8FrameVersions.includes(version)
    ? resolve(version === 'latest' ? LATEST_8FRAME : version)
    : reject(`${version} is an unsupported AFrame version: (${JSON.stringify(allowedVersions)})`)))

  // Load an external javascript resource in a promise that resolves when the javascript has loaded.
  const loadJsPromise = url => new Promise((resolve, reject) => document.head.appendChild(Object.assign(
    document.createElement('script'), {async: true, onload: resolve, onError: reject, src: url}
  )))

  // If XR or XRExtras load before AFrame, we need to manually register their AFrame components.
  const ensureAFrameComponents = () => {
    window.XR8 && window.AFRAME.registerComponent('xrweb', XR8.AFrame.xrwebComponent())
    window.XRExtras && window.XRExtras.AFrame.registerXrExtrasComponents()
  }

  // Register a map of component-name -> component, e.g.
  // {
  //   'component-1': component1,
  //   'component-2': component2,
  // }
  const registerComponents = components => Object.keys(components).map(k => AFRAME.registerComponent(k, components[k]))

  const registerPrimitives = primitives => Object.keys(primitives).map(k => AFRAME.registerPrimitive(k, primitives[k]))

  // Load the 8th Wall preferred version of AFrame at runtime ensuring that xr components are added.
  const loadAFrameForXr = (args) => {
    const {version = 'latest', components = {}} = args || {}
    return checkAllowed8FrameVersions(version)
      .then(ver => loadJsPromise(`//cdn.8thwall.com/web/aframe/8frame-${ver}.min.js`))
      .then(ensureAFrameComponents)
      .then(ensureXrAndExtras)
      .then(_ => registerComponents(components))
  }

  // Register XRExtras AFrame components.
  const registerXrExtrasComponents = () => {
    // If AFrame is not ready, or we already registered components, skip.
    if (registered || !window.AFRAME) {
      return
    }

    // Only register the components once.
    registered = true

    registerComponents(xrComponents())
    registerPrimitives(xrPrimitives())
  }

  // Eagerly try to register the aframe components, if aframe has already loaded.
  registerXrExtrasComponents()

  return {
    // Load the 8th Wall version of AFrame at runtime ensuring that xr components are added.
    loadAFrameForXr,
    // Register the XRExtras components. This should only be called after AFrame has loaded.
    registerXrExtrasComponents,
  }
}

// We want to start showing the loading screen eagerly (before AFRAME has loaded and parsed the
// scene and set up everything). We also need to work around a bug in the AFRAME loading in iOS
// Webviews for almost there.
const eagerload = () => {
  // Manually traverse the dom for an aframe scene and check its attributes.
  const scene = document.getElementsByTagName('a-scene')[0]
  if (!scene) {
    return
  }
  const attrs = scene.attributes

  let foundAlmostThere = false
  let foundLoading = false
  let redirectUrl = null
  let runConfig = null

  // Eagerly inspect the dom, and trigger loading or almost there modules early if appropriate.
  Object.keys(attrs).forEach((a) => {
    const attr = attrs.item(a).name
    if (attr == 'xrextras-almost-there') {
      foundAlmostThere = true
      const redirectMatch = new RegExp('url:([^;]*)').exec(attrs.item(a).value)
      if (redirectMatch) {
        redirectUrl = redirectMatch[1]
      }
    }

    if (attr == 'xrextras-loading') {
      foundLoading = true
    }

    if (attr === 'xrweb' || attr === 'xrface') {
      const allowedDevicesMatch = new RegExp('allowedDevices:([^;]*)').exec(attrs.item(a).value)
      if (allowedDevicesMatch) {
        runConfig = {allowedDevices: allowedDevicesMatch[1].trim()}
      }
    }
  })

  if (foundAlmostThere) {
    if (redirectUrl) {
      window.XRExtras.AlmostThere.configure({url: redirectUrl})
    }

    window.XR8
      ? window.XRExtras.AlmostThere.checkCompatibility(runConfig)
      : window.addEventListener(
        'xrloaded', () => window.XRExtras.AlmostThere.checkCompatibility(runConfig)
      )
  }

  if (foundLoading) {
    window.XRExtras.Loading.showLoading({onxrloaded})
  }
}

const oldonload = window.onload
const aframeonload = () => {
  if (oldonload) {
    oldonload()
  }
  window.XRExtras ? eagerload() : window.addEventListener('xrextrasloaded', eagerload, {once: true})
}
window.onload = aframeonload

module.exports = {
  AFrameFactory,
}
