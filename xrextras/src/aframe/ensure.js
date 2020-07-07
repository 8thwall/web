// Get a promise that resolves when an event with the given name has been dispacted to the window.
const waitEventPromise = eventname => new Promise(resolve => window.addEventListener(eventname, resolve, {once: true}))

// If XR and XRExtras aren't loaded, wait for them.
const ensureXrAndExtras = () => {
  const eventnames = []
  window.XR8 || eventnames.push('xrloaded')
  window.XRExtras || eventnames.push('xrextrasloaded')
  return Promise.all(eventnames.map(waitEventPromise))
}

export {
  ensureXrAndExtras,
}
