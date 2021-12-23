const attachListenerGen = () => {
  const callbacks = new Set()
  let attached_ = false
  let attachState_ = null
  let {XR8} = window

  const pipelineModule = () => ({
    name: 'xrextraslifecycle',
    onAttach: (attachState) => {
      attachState_ = attachState
      attached_ = true
      callbacks.forEach(callback => callback(attachState_))
    },
    onDetach: () => {
      attached_ = false
      attachState_ = null
    },
  })

  const add = (callback) => {
    if (!callbacks.size && XR8) {
      XR8.addCameraPipelineModule(pipelineModule())
    }
    callbacks.add(callback)
    if (attached_) {
      callback(attachState_)
    }
  }

  const remove = (callback) => {
    if (callbacks.delete(callback) && XR8 && !callbacks.size) {
      XR8.removeCameraPipelineModule('xrextraslifecycle')
    }
  }

  if (!XR8) {
    window.addEventListener(
      'xrloaded',
      () => {
        XR8 = window.XR8
        if (callbacks.size) {
          XR8.addCameraPipelineModule(pipelineModule())
        }
      },
      {once: true}
    )
  }

  return {
    add,
    delete: remove,
  }
}

let attachListenerSingleton = null
const getAttachListenerSingleton = () => {
  if (!attachListenerSingleton) {
    attachListenerSingleton = attachListenerGen()
  }
  return attachListenerSingleton
}

const LifecycleFactory = () => ({
  attachListener: {
    add: callback => getAttachListenerSingleton().add(callback),
    delete: callback => getAttachListenerSingleton().delete(callback),
  },
})

module.exports = {
  LifecycleFactory,
}
