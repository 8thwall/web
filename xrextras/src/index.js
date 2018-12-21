const xrextras = require('./xrextras')

const onxr = () => {
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent("xrandextrasloaded"))
  }, 1)
}

const onearly = () => {
  window.XRExtras = xrextras.XRExtras
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent("xrextrasloaded"))
  }, 1)
  window.XR ? onxr() : window.addEventListener('xrloaded', onxr)
}

onearly()
