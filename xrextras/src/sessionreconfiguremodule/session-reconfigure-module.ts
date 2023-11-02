declare const XR8: any
let runConfig

// data BeforeSessionInitializeInput: input for onBeforeSessionInitialize in camera pipeline
// a function that return false on session with attributes that match a certain filter
type SessionPreventer = (data: any) => boolean

const create = () => {
  let sessionPreventer: SessionPreventer

  const restartSession = () => {
    XR8.reconfigureSession(runConfig)
  }

  const enableAnyDirection = () => {
    XR8.reconfigureSession({
      ...runConfig,
      cameraConfig: {...runConfig.cameraConfig, direction: 'any'},
    })
  }

  const disableVoidSpace = () => {
    XR8.reconfigureSession({
      ...runConfig,
      sessionConfiguration: {
        ...runConfig.sessionConfiguration,
        defaultEnvironment: {
          ...runConfig.sessionConfiguration?.defaultEnvironment,
          disabled: true,
        },
      },
    })
  }

  const enableVoidSpace = () => {
    XR8.reconfigureSession({
      ...runConfig,
      sessionConfiguration: {
        ...runConfig.sessionConfiguration,
        defaultEnvironment: {
          ...runConfig.sessionConfiguration?.defaultEnvironment,
          disabled: false,
        },
      },
    })
  }

  const preventHeadset = (data) => {
    if (data.sessionAttributes.usesWebXr) {
      return true
    }
    return false
  }

  const preventCamera = (data) => {
    if (data.sessionAttributes.fillsCameraTexture) {
      return true
    }
    return false
  }

  const configure = ({skipCameraSession}) => {
    if (skipCameraSession) {
      sessionPreventer = preventCamera
    }
  }

  const pipelineModule = () => {
    let el

    return {
      name: 'session-reconfigurator',
      onRunConfigure: (data) => {
        runConfig = data.config
      },
      onBeforeSessionInitialize: (data) => {
        if (sessionPreventer && sessionPreventer(data)) {
          throw new Error('Session preventer choose to skip session')
        }
      },
      onAttach: () => {
        if (!XR8.reconfigureSession) {
          throw new Error('Invalid XR8 version, missing reconfigureSession')
        }
        el = document.createElement('div')

        Object.assign(el.style, {
          position: 'fixed',
          left: 0,
          top: 0,
          padding: '1rem',
          zIndex: 900000,
        })

        const options = [
          // {name: 'restart same', action: restartSession},
          // {name: 'any direction camera', action: enableAnyDirection},
          // {name: 'prevent xr', action: restartSession, sessionPreventer: preventHeadset},
          {name: 'enable xr', action: restartSession},
          // {name: 'disable void', action: disableVoidSpace},
          // {name: 'enable void', action: enableVoidSpace},
          {name: 'prevent camera', action: restartSession, sessionPreventer: preventCamera},
        ]

        options.forEach((option) => {
          const button = document.createElement('button')
          button.textContent = option.name
          el.appendChild(button)
          button.addEventListener('click', () => {
            sessionPreventer = option.sessionPreventer
            option.action()
          })
        })

        document.body.appendChild(el)
      },
      onDetach: () => {
        if (el) {
          document.body.removeChild(el)
          el = null
        }
      },
    }
  }

  return {
    pipelineModule,
    configure,
    restartSession,
    enableAnyDirection,
    disableVoidSpace,
    enableVoidSpace,
    preventCamera,
    preventHeadset,
  }
}
let SessionReconfigureModule = null

const SessionReconfigureFactory = () => {
  if (SessionReconfigureModule == null) {
    SessionReconfigureModule = create()
  }

  return SessionReconfigureModule
}

export {
  SessionReconfigureFactory,
}
