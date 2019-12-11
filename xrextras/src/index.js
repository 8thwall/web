const xrextras = require('./xrextras')

const onxr = () => {
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent("xrandextrasloaded"))
  }, 1)
}

const onearly = () => {
  // The XR device API conflicts with deprecated usage of the XR library. To avoid this conflict,
  // XR8 should be used for the 8th Wall XR API. This renames the device api if present to help keep
  // compatibility for legacy callers.
  if (!window.XR8 && window.XR && typeof(window.XR) === 'function') {
    window.nativeXR = window.XR
    window.XR = undefined
  }

  window.XRExtras = xrextras.XRExtras
  setTimeout(() => window.dispatchEvent(new CustomEvent("xrextrasloaded")), 1)
  window.XR8 ? onxr() : window.addEventListener('xrloaded', onxr)
}

onearly()
