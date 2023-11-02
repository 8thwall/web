import type {ComponentDefinition} from 'aframe'

import {SessionReconfigureFactory} from '../../sessionreconfiguremodule/session-reconfigure-module'

declare const XR8: any

type SessionReconfigureParameters = {
  skipCameraSession: boolean
}

const defaultParameters: SessionReconfigureParameters = {
  skipCameraSession: false,
}

const generateSchema = () => {
  const schema = {}
  Object.keys(defaultParameters).forEach((param) => {
    schema[param] = {default: defaultParameters[param]}
  })
  return schema
}

const sessionReconfigureComponent: ComponentDefinition = {
  schema: generateSchema(),
  init() {
    const SessionReconfigure = SessionReconfigureFactory()
    const module = SessionReconfigure.pipelineModule()
    this.moduleName = module.name
    SessionReconfigure.configure({...this.data})
    XR8.addCameraPipelineModule(module)
  },
  remove() {
    XR8.removeCameraPipelineModule(this.moduleName)
  },
}

export {
  sessionReconfigureComponent,
}

export type {
  SessionReconfigureParameters,
}
