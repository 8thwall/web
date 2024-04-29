/* globals AFRAME */
AFRAME.registerComponent('play-vps-animation', {
  init() {
    const overlayHidden = () => {
      this.el.setAttribute('animation-mixer', 'clip: *')
    }

    const overlayVisible = () => {
      this.el.removeAttribute('animation-mixer')
    }

    window.XR8.addCameraPipelineModule({
      name: 'vps-coaching-overlay-listen',
      listeners: [
        {event: 'vps-coaching-overlay.hide', process: overlayHidden},
        {event: 'vps-coaching-overlay.show', process: overlayVisible},
      ],
    })
  },
})
