import {
  resourceComponent,
  pbrMaterialComponent,
  basicMaterialComponent,
  videoMaterialComponent,
  hiderMaterialComponent,
} from './components/asset-components'

import {
  runtimeErrorComponent,
  statsComponent,
  logToScreenComponent,
} from './components/debug-components'

import {
  tapRecenterComponent,
  gestureDetectorComponent,
  oneFingerRotateComponent,
  twoFingerRotateComponent,
  pinchScaleComponent,
  holdDragComponent,
  playVideoComponent,
} from './components/gestures-components'

import {
  faceAttachmentComponent,
  faceMeshComponent,
  faceAnchorComponent,
} from './components/face-components'

import {
  handAnchorComponent,
  handAttachmentComponent,
  handMeshComponent,
  handOccluderComponent,
} from './components/hand-components'

import {
  opaqueBackgroundComponent,
  attachComponent,
  pwaInstallerComponent,
  pauseOnBlurComponent,
  pauseOnHiddenComponent,
  hideCameraFeedComponent,
  almostThereComponent,
  loadingComponent,
} from './components/lifecycle-components'

import {
  captureButtonComponent,
  capturePreviewComponent,
  captureConfigComponent,
} from './components/recorder-components'

import {
  targetMeshComponent,
  curvedTargetContainerComponent,
  targetVideoFadeComponent,
  targetVideoSoundComponent,
  generateImageTargetsComponent,
  namedImageTargetComponent,
  spinComponent,
} from './components/target-components'

const xrComponents = () => {
  return {
    'xrextras-almost-there': almostThereComponent,
    'xrextras-loading': loadingComponent,
    'xrextras-runtime-error': runtimeErrorComponent,
    'xrextras-stats': statsComponent,
    'xrextras-opaque-background': opaqueBackgroundComponent,
    'xrextras-tap-recenter': tapRecenterComponent,
    'xrextras-generate-image-targets': generateImageTargetsComponent,
    'xrextras-named-image-target': namedImageTargetComponent,
    'xrextras-gesture-detector': gestureDetectorComponent,
    'xrextras-one-finger-rotate': oneFingerRotateComponent,
    'xrextras-two-finger-rotate': twoFingerRotateComponent,
    'xrextras-pinch-scale': pinchScaleComponent,
    'xrextras-hold-drag': holdDragComponent,
    'xrextras-attach': attachComponent,
    'xrextras-play-video': playVideoComponent,
    'xrextras-log-to-screen': logToScreenComponent,
    'xrextras-pwa-installer': pwaInstallerComponent,
    'xrextras-pause-on-blur': pauseOnBlurComponent,
    'xrextras-pause-on-hidden': pauseOnHiddenComponent,
    'xrextras-faceanchor': faceAnchorComponent,
    'xrextras-resource': resourceComponent,
    'xrextras-pbr-material': pbrMaterialComponent,
    'xrextras-basic-material': basicMaterialComponent,
    'xrextras-video-material': videoMaterialComponent,
    'xrextras-face-mesh': faceMeshComponent,
    'xrextras-face-attachment': faceAttachmentComponent,
    'xrextras-hide-camera-feed': hideCameraFeedComponent,
    'xrextras-hider-material': hiderMaterialComponent,
    'xrextras-capture-button': captureButtonComponent,
    'xrextras-capture-preview': capturePreviewComponent,
    'xrextras-capture-config': captureConfigComponent,
    'xrextras-curved-target-container': curvedTargetContainerComponent,
    'xrextras-target-mesh': targetMeshComponent,
    'xrextras-target-video-fade': targetVideoFadeComponent,
    'xrextras-target-video-sound': targetVideoSoundComponent,
    'xrextras-spin': spinComponent,
    'xrextras-hand-anchor': handAnchorComponent,
    'xrextras-hand-attachment': handAttachmentComponent,
    'xrextras-hand-mesh': handMeshComponent,
    'xrextras-hand-occluder': handOccluderComponent,
  }
}

export {
  xrComponents,
}
