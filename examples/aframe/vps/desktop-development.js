/* globals XR8 AFRAME */
AFRAME.registerComponent('desktop-development', {
  schema: {
    inspector: {type: 'boolean', default: true},
  },
  init() {
    const onAttach = ({sessionAttributes}) => {
      const s = sessionAttributes
      const isDesktop = !s.cameraLinkedToViewer && !s.controlsCamera && !s.fillsCameraTexture &&
      !s.supportsHtmlEmbedded && s.supportsHtmlOverlay && !s.usesMediaDevices && !s.usesWebXr

      const namedWayspot = document.querySelector('[named-wayspot]')
      const occluder = document.querySelector('[hider-material]')

      const scene = this.el
      const removeXRandExtras = () => {
        scene.removeAttribute('landing-page')
        scene.removeAttribute('xrextras-loading')
        scene.removeAttribute('xrextras-gesture-detector')
        scene.removeAttribute('xrextras-runtime-error')
        scene.removeAttribute('vps-coaching-overlay')

        namedWayspot.removeAttribute('named-wayspot')
        occluder.removeAttribute('hider-material')

        scene.removeAttribute('xrweb')

        if (this.data.inspector) {
          scene.components.inspector.openInspector()
          scene.renderer.autoClearColor = true
        }
      }

      if (isDesktop) {
        removeXRandExtras()
      }
    }
    const onxrloaded = () => {
      XR8.addCameraPipelineModules([{'name': 'desktopDevelopment', onAttach}])
    }
    if (window.XR8) onxrloaded()
    else window.addEventListener('xrloaded', onxrloaded)
  },
})
