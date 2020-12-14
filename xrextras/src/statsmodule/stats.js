const STATS_URL = 'https://cdn.8thwall.com/web/aframe/stats.16.min.js'
let statsModule = null

const loadJsPromise = url => new Promise((resolve, reject) =>
  document.head.appendChild(Object.assign(
    document.createElement('script'), {async: true, onload: resolve, onError: reject, src: url})))

const StatsFactory = () => {
  if (statsModule == null) {
    statsModule = create()
  }

  return statsModule
}

function create() {
  const pipelineModule = () => {
    let stats_ = null
    return {
      name: 'stats',
      onBeforeRun: () => (
        window.Stats ? Promise.resolve() : loadJsPromise(STATS_URL)
      ),
      onAttach: () => {
        stats_ = new Stats()
        stats_.showPanel(0)
        stats_.dom.style.zIndex = 5000
        stats_.dom.style.position = 'absolute'
        stats_.dom.style.top = '0px'
        stats_.dom.style.left = '0px'
        document.body.appendChild(stats_.dom)
      },
      onUpdate: () => {
        stats_.update()
      },
      onDetach: () => {
        document.body.removeChild(stats_.dom)
        stats_ = null
      },
    }
  }

  return {
    // Creates a camera pipeline module that, when installed, adds a framerate stats element to
    // the window dom. If the Stats package is not yet loaded, it will load it.
    pipelineModule,
  }
}

module.exports = {
  StatsFactory,
}
