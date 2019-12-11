const {xrComponents} = require('./xr-components.js')

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
  const LATEST_8FRAME = allowed8FrameVersions[1]  // The 'latest' version of 8frame.

  // Check that the requested version of AFrame has a corresponding 8Frame implementation.
  const checkAllowed8FrameVersions = (version) => new Promise((resolve, reject) =>
    allowed8FrameVersions.includes(version)
      ? resolve(version === 'latest' ? LATEST_8FRAME : version)
      : reject(`${version} is an unsupported AFrame version: (${JSON.stringify(allowedVersions)})`))

  // Load an external javascript resource in a promise that resolves when the javascript has loaded.
  const loadJsPromise = url => new Promise((resolve, reject) =>
    document.head.appendChild(Object.assign(
      document.createElement('script'), {async: true, onload: resolve, onError: reject, src: url})))

  // Get a promise that resolves when an event with the given name has been dispacted to the window.
  const waitEventPromise = eventname =>
    new Promise((resolve) => window.addEventListener(eventname, resolve, {once: true}))

  // If XR or XRExtras load before AFrame, we need to manually register their AFrame components.
  const ensureAFrameComponents = () => {
    window.XR8       && window.AFRAME.registerComponent('xrweb', XR8.AFrame.xrwebComponent())
    window.XRExtras && window.XRExtras.AFrame.registerXrExtrasComponents()
  }

  // If XR and XRExtras aren't loaded, wait for them.
  const ensureXrAndExtras = () => {
    const eventnames = []
    window.XR8       || eventnames.push('xrloaded')
    window.XRExtras || eventnames.push('xrextrasloaded')
    return Promise.all(eventnames.map(waitEventPromise))
  }

  // Register a map of component-name -> component, e.g.
  // {
  //   'component-1': component1,
  //   'component-2': component2,
  // }
  const registerComponents = (components) =>
    Object.keys(components).map(k => AFRAME.registerComponent(k, components[k]))

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

  // In some iOS webviews, AFRAME is never properly loaded. We need to recover from this by
  // expressly triggering a compatibility check (which will fail in these cases) regardless of
  // whether the camera framework is successfully run.
  Object.keys(attrs).forEach(a => {
    const attr = attrs.item(a).name
    if (attr == 'xrextras-almost-there') {
      const redirectMatch = new RegExp('url:([^;]*)').exec(attrs.item(a).value)
      redirectMatch && window.XRExtras.AlmostThere.configure({url: redirectMatch[1]})
      window.XR8
        ? window.XRExtras.AlmostThere.checkCompatibility()
        : window.addEventListener('xrloaded', window.XRExtras.AlmostThere.checkCompatibility)
    }

    if (attr == 'xrextras-loading') {
      window.XRExtras.Loading.showLoading({onxrloaded})
    }
  })
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
