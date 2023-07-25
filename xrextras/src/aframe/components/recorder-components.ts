import type {ComponentDefinition} from 'aframe'

import {ensureXrAndExtras} from '../ensure'

declare const THREE: any
declare const XRExtras: any

const captureButtonComponent: ComponentDefinition = {
  schema: {
    captureMode: {default: 'standard'},
  },
  init() {
    ensureXrAndExtras().then(() => {
      if (this.removed) {
        return
      }
      this.added = true
      XRExtras.MediaRecorder.initRecordButton()
      XRExtras.MediaRecorder.setCaptureMode(this.data.captureMode)
    })
  },
  update() {
    if (this.added) {
      XRExtras.MediaRecorder.setCaptureMode(this.data.captureMode)
    }
  },
  remove() {
    this.removed = true
    if (this.added) {
      XRExtras.MediaRecorder.removeRecordButton()
    }
  },
}

const capturePreviewComponent: ComponentDefinition = {
  // This schema must be duplicated to mappings xr-primitives.js
  schema: {
    actionButtonShareText: {default: ''},
    actionButtonViewText: {default: ''},
    finalizeText: {default: ''},
  },
  init() {
    ensureXrAndExtras().then(() => {
      if (!this.removed) {
        this.added = true
        XRExtras.MediaRecorder.initMediaPreview(this.data)
      }
    })
  },
  remove() {
    this.removed = true
    if (this.added) {
      XRExtras.MediaRecorder.removeMediaPreview()
    }
  },
}

interface CaptureComponentDefinition extends ComponentDefinition {
  includeSceneAudio: ({microphoneInput, audioProcessor}: { microphoneInput: any, audioProcessor: any }) => any
}

const captureConfigComponent: CaptureComponentDefinition = {
  // This schema must be duplicated to mappings xr-primitives.js
  schema: {
    enableEndCard: {type: 'boolean'},
    shortLink: {type: 'string'},
    coverImageUrl: {type: 'string'},
    footerImageUrl: {type: 'string'},
    maxDurationMs: {type: 'int'},
    endCardCallToAction: {type: 'string'},
    maxDimension: {type: 'int'},
    watermarkImageUrl: {type: 'string'},
    watermarkMaxWidth: {type: 'number'},
    watermarkMaxHeight: {type: 'number'},
    watermarkLocation: {type: 'string'},
    fileNamePrefix: {type: 'string'},
    requestMic: {type: 'string'},
    includeSceneAudio: {type: 'boolean', default: true},
    excludeSceneAudio: {type: 'boolean', default: false},  // deprecated
  },
  init() {
    this.includeSceneAudio = this.includeSceneAudio.bind(this)
  },
  update() {
    const config: any = {
      audioContext: THREE.AudioContext.getContext(),
    }

    if (this.attrValue.excludeSceneAudio !== undefined) {
      console.warn('"exclude-scene-audio" has been deprecated in favor of "include-scene-audio"')
      config.configureAudioOutput = this.data.excludeSceneAudio ? null : this.includeSceneAudio
    } else {
      config.configureAudioOutput = this.data.includeSceneAudio ? this.includeSceneAudio : null
    }

    Object.keys(this.data).forEach((key) => {
      // Ignore value if not specified
      if (this.attrValue[key] !== undefined &&
        !['includeSceneAudio', 'excludeSceneAudio'].includes(key)) {
        config[key] = this.data[key]
      }
    })

    XRExtras.MediaRecorder.configure(config)
  },
  includeSceneAudio({microphoneInput, audioProcessor}) {
    const audioContext = audioProcessor.context

    // if the scene doesn't have any audio, then we'll create the listener for the scene.
    // That way, if they add sounds later, it will still connect without the user having to
    // re-call this function.
    if (!this.el.sceneEl.audioListener) {
      this.el.sceneEl.audioListener = new THREE.AudioListener()
    }

    // This connects the A-Frame audio to the audioProcessor so that all sound effects initialized
    // are part of the recorded video's audio.
    this.el.sceneEl.audioListener.gain.connect(audioProcessor)
    // This connects the A-Frame audio to the hardware output.  That way, the user can also hear
    // the sound effects during the experience
    this.el.sceneEl.audioListener.gain.connect(audioContext.destination)

    // you must return a node at the end.  This node is connected to the audioProcessor
    // automatically inside MediaRecorder
    return microphoneInput
  },
}

export {
  captureButtonComponent,
  capturePreviewComponent,
  captureConfigComponent,
}
