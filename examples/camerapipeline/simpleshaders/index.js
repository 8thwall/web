// Copyright (c) 2018 8th Wall, Inc.

const onxrloaded = () => {

  const fragmentShaders = [
    // Just the camera feed.
    ` precision mediump float;
      varying vec2 texUv;
      uniform sampler2D sampler;
      void main() {
        gl_FragColor = texture2D(sampler, texUv);
      }`,
    // Color boost.
    ` precision mediump float;
      varying vec2 texUv;
      uniform sampler2D sampler;
      void main() {
        vec4 c = texture2D(sampler, texUv);
        float y = dot(c.rgb, vec3(0.299, 0.587, 0.114));
        float u = dot(c.rgb, vec3(-.159, -.331, .5)) * 6.0;
        float v = dot(c.rgb, vec3(.5, -.419, -.081)) * 3.0;
        float r = y + 1.4 * v;
        float g = y - .343 * u - .711 * v;
        float b = y + 1.765 * u;
        gl_FragColor = vec4(r, g, b, c.a);
      }`,
    // Vignette.
    ` precision mediump float;
      varying vec2 texUv;
      uniform sampler2D sampler;
      void main() {
        float x = texUv.x - .5;
        float y = texUv.y - .5;
        float v = 1.5 - sqrt(x * x + y * y) * 2.5;
        v = v > 1.0 ? 1.0 : v;
        vec4 c = texture2D(sampler, texUv);
        gl_FragColor = vec4(c.rgb * v, c.a);
      }`,
    // Black and white.
    ` precision mediump float;
      varying vec2 texUv;
      uniform sampler2D sampler;
      void main() {
        vec4 c = texture2D(sampler, texUv);
        gl_FragColor = vec4(vec3(dot(c.rgb, vec3(0.299, 0.587, 0.114))), c.a);
      }`,
    // Sepia.
    ` precision mediump float;
      varying vec2 texUv;
      uniform sampler2D sampler;
      void main() {
        vec4 c = texture2D(sampler, texUv);
        gl_FragColor.r = dot(c.rgb, vec3(.393, .769, .189));
        gl_FragColor.g = dot(c.rgb, vec3(.349, .686, .168));
        gl_FragColor.b = dot(c.rgb, vec3(.272, .534, .131));
        gl_FragColor.a = c.a;
      }`,
    // Purple.
    ` precision mediump float;
      varying vec2 texUv;
      uniform sampler2D sampler;
      void main() {
        vec4 c = texture2D(sampler, texUv);
        float y = dot(c.rgb, vec3(0.299, 0.587, 0.114));
        vec3 p = vec3(.463, .067, .712);
        vec3 p1 = vec3(1.0, 1.0, 1.0) - p;
        vec3 rgb = y < .25 ? (y * 4.0) * p : ((y - .25) * 1.333) * p1 + p;
        gl_FragColor = vec4(rgb, c.a);
      }`,
  ]

  let idx = 0
  const nextShader = () => {
    XR.GlTextureRenderer.configure({fragmentSource: fragmentShaders[idx]})
    idx = (idx + 1) % fragmentShaders.length
  }

  const canvas = document.getElementById('camerafeed')

  const nextButton = document.getElementById('nextbutton')
  nextButton.onclick = nextShader

  // Update the size of the camera feed canvas to fill the screen.
  const fillScreenWithCanvas = ({orientation}) => {
    const ww = window.innerWidth
    const wh = window.innerHeight

    // Wait for orientation change to take effect before handline resize.
    if (((orientation == 0 || orientation == 180) && ww > wh)
      || ((orientation == 90 || orientation == -90) && wh > ww)) {
      window.requestAnimationFrame(() => fillScreenWithCanvas({orientation}))
      return
    }

    // Set the canvas geometry to the new window size.
    canvas.width = ww * window.devicePixelRatio
    canvas.height = wh * window.devicePixelRatio
    nextButton.style.lineHeight = `${nextButton.getBoundingClientRect().height}px`
  }

  // Set the initial canvas geometry.
  fillScreenWithCanvas({orientation: window.orientation})

  // Add an existing camera pipeline module to draw the camera feed.
  XR.addCameraPipelineModule(XR.GlTextureRenderer.pipelineModule())

  nextShader()

  // Add a custom pipeline module to update the canvas size if the phone is rotated.
  XR.addCameraPipelineModule({
    name: 'camerafeed',
    onDeviceOrientationChange: ({orientation}) => {
      fillScreenWithCanvas({orientation})
    },
  })

  // Request camera permissions and run the camera.
  XR.run({canvas})
}

// Wait until the XR javascript has loaded before making XR calls.
window.onload = () => {
  const nextButton = document.getElementById('nextbutton')
  nextButton.style.lineHeight = `${nextButton.getBoundingClientRect().height}px`
  if (window.XR) {
    onxrloaded()
  } else {
    window.addEventListener('xrloaded', onxrloaded)
  }
}
