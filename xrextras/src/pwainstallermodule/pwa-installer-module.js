/* globals XR8 */
require('!style-loader!css-loader!../fonts/fonts.css')
require('!style-loader!css-loader!./pwa-installer-module.css')

const {MILLISECONDS_PER_SECOND, MILLISECONDS_PER_DAY} = require('./time.js')
const html = require('./pwa-installer-module.html')
const iosActionSvg = require('./ios-action-icon-svg.html')

const NUM_VISITS_BEFORE_INSTALL_PROMPT = 2
const PROMPT_DISMISSAL_DELAY_MS = MILLISECONDS_PER_DAY * 90

const LAST_INSTALL_DISMISS_TIME_KEY = 'LAST_INSTALL_DISMISS_TIME_KEY'
const NUM_VISITS_KEY = 'NUM_VISITS_KEY'
const DEFAULT_INSTALL_TITLE = 'Add to your home screen'
const DEFAULT_INSTALL_SUBTITLE = 'for easy access.'
const DEFAULT_INSTALL_BUTTON_TEXT = 'Install'
const DEFAULT_IOS_INSTALL_TEXT = `Tap $ACTION_ICON and then "Add to Homescreen"`

let pwaInstallerModule_ = null
let installEvent_ = null

const lastDismissalKey = () => `${LAST_INSTALL_DISMISS_TIME_KEY}/${getAppKey()}`
const numVisitsKey = () => `${NUM_VISITS_KEY}/${getAppKey()}`

const getXrWebScript = () => [].find.call(document.scripts, s => /xrweb(\?.*)?$/.test(s.src))

const getAppKey = () => {
  try {
    return new URL(getXrWebScript().src).searchParams.get('appKey')
  } catch (e) {
    return ''
  }
}

const localStorageGetItem = (key, defaultValue = null) => {
  try {
    return localStorage.getItem(key) || defaultValue
  } catch (e) {
    return defaultValue
  }
}

const localStorageSetItem = (key, value) => {
  try {
    localStorage.setItem(key, value)
  } catch (e) {
    // No-op.
  }
}

const recordVisit = () => {
  const key = numVisitsKey()
  const numVisits = parseInt(localStorageGetItem(key, '0'), 10)
  localStorageSetItem(key, (numVisits + 1).toString())
}

const recordInstallPromptDismissed = () => {
  localStorageSetItem(lastDismissalKey(), new Date().getTime().toString())
}

const getDefaultIconSrc = () => (
  (document.querySelector('meta[name="8thwall:pwa_icon"]') || {content: ''}).content
)

const getDefaultPwaName = () => (
  (document.querySelector('meta[name="8thwall:pwa_name"]') || {content: ''}).content
)

const create = () => {
  const promptConfig_ = {
    delayAfterDismissalMillis: PROMPT_DISMISSAL_DELAY_MS,
    minNumVisits: NUM_VISITS_BEFORE_INSTALL_PROMPT
  }
  const displayConfig_ = {
    preferredName: preferredName,
    preferredIconSrc: preferredIconSrc,
    preferredInstallTitle: preferredInstallTitle,
    preferredInstallSubtitle: preferredInstallSubtitle,
    preferredInstallButtonText: preferredInstallButtonText,
    preferredIosInstallText: preferredIosInstallText,
  }
  let numUpdates_ = 0
  let waitingOnReality_ = true
  let rootNode_ = null
  let pendingDisplayPromptId_ = null
  let displayAllowed_ = false
  let runConfig_ = null

  // Overridable functions
  let shouldDisplayInstallPrompt_ = shouldDisplayInstallPrompt
  let displayInstallPrompt_ = displayInstallPrompt
  let hideInstallPrompt_ = hideInstallPrompt

  function pipelineModule () {
    return {
      name: 'pwa-installer',
      onBeforeRun: (args) => {
        runConfig_ = args && args.config
        setDisplayAllowed(false)
      },
      onAttach: () => {
        numUpdates_ = 0
        waitingOnReality_ = true
      },
      onUpdate: () => {
        if (!waitingOnReality_) {
          return
        }
        if (numUpdates_ < 5) {
          ++numUpdates_
        } else {
          waitingOnReality_ = false
          setDisplayAllowed(true)
        }
      },
      onDetach: () => {
        setDisplayAllowed(false)
      }
    }
  }

  function preferredName() {
    return getDefaultPwaName()
  }

  function preferredIconSrc() {
    return getDefaultIconSrc()
  }

  function preferredInstallTitle() {
    return DEFAULT_INSTALL_TITLE
  }

  function preferredInstallSubtitle() {
    return DEFAULT_INSTALL_SUBTITLE
  }

  function preferredInstallButtonText() {
    return DEFAULT_INSTALL_BUTTON_TEXT
  }

  function preferredIosInstallText() {
    return DEFAULT_IOS_INSTALL_TEXT
  }

  function displayInstallPrompt(displayConfig, onInstalled, onDismissed) {
    const e = document.createElement('template')
    e.innerHTML = html.trim()
    rootNode_ = e.content.firstChild

    // Display appropriate install action.
    const installActionNode = XR8.XrDevice.deviceEstimate().os !== 'iOS'
      ? rootNode_.querySelector('#android-install-action')
      : rootNode_.querySelector('#ios-install-action')
    installActionNode.classList.remove('hidden')

    // Add the PWA icon preview source.
    const iconNode = rootNode_.querySelector('#pwa-icon-preview')
    if (iconNode) {
      iconNode.src = displayConfig.iconSrc
    }

    // Add the PWA name.
    const pwaNameNode = rootNode_.querySelector('#pwa-name')
    if (pwaNameNode) {
      pwaNameNode.innerHTML = displayConfig.name
    }

    const installTitleNode = rootNode_.querySelector('#install-title')
    if (installTitleNode) {
      installTitleNode.innerHTML = displayConfig.installTitle
    }

    const installSubtitle = rootNode_.querySelector('#install-subtitle')
    if (installSubtitle) {
      installSubtitle.innerHTML = displayConfig.installSubtitle
    }

    // Add close button click listener.
    const closeButtonNode = rootNode_.querySelector('#close-button')
    if (closeButtonNode) {
      closeButtonNode.onclick = onDismissed
    }

    // Add install button text and click listener.
    const installButtonNode = rootNode_.querySelector('#android-install-action')
    if (installButtonNode) {
      installButtonNode.innerHTML = displayConfig.installButtonText

      installButtonNode.onclick = () => {
        if (!installEvent_) {
          console.error('Attempting install app without `beforeinstallprompt` event')
          hideInstallPrompt_()
          return
        }

        installEvent_.prompt()
        return installEvent_.userChoice.then(choice => {
          if (choice.outcome === 'accepted') {
            onInstalled()
          } else {
            onDismissed()
          }
          installEvent_ = null
        })
      }
    }

    // Add iOS install action text.
    const iosInstallTextNode = rootNode_.querySelector('#ios-install-action')
    if (iosInstallTextNode) {
      const iosInstallText =
        displayConfig.iosInstallText && displayConfig.iosInstallText.replace('$ACTION_ICON', iosActionSvg)
        iosInstallTextNode.innerHTML = iosInstallText
    }

    document.getElementsByTagName('body')[0].appendChild(rootNode_)
    installPromptShown = true
  }

  function hideInstallPrompt() {
    if (!rootNode_) {
      return
    }
    document.getElementsByTagName('body')[0].removeChild(rootNode_)
    rootNode_ = null
  }

  function shouldDisplayInstallPrompt(promptConfig, lastDismissalMillis, numVisits) {
    // Incompatible devices shouldn't have the option to install.
    if (!XR8.XrDevice.isDeviceBrowserCompatible(runConfig_)) {
      return false
    }

    const requiresPromptEvent = XR8.XrDevice.deviceEstimate().os !== 'iOS'
    if (requiresPromptEvent && !installEvent_) {
      return false
    }

    // Wait the appropriate amount of time before displaying the prompt again.
    const currentTimeMillis = new Date().getTime()
    const delayTimeMillis = promptConfig.delayAfterDismissalMillis
    if (lastDismissalMillis && (currentTimeMillis < (lastDismissalMillis + delayTimeMillis))) {
      return false
    }

    // Ensure the user has visited the page enough times before displaying the prompt.
    if (numVisits < promptConfig.minNumVisits) {
      return false
    }

    // Don't display the install prompt if the app is already running through a PWA.
    const url = new URL(location.href)
    const mode = url.searchParams.get('mode')
    if (mode === 'pwa' || window.matchMedia('(display-mode: standalone)').matches) {
      return false
    }

    return true
  }

  function onInstalled() {
    hideInstallPrompt_()
  }

  function onDismissed() {
    recordInstallPromptDismissed()
    hideInstallPrompt_()
  }

  function displayOrSchedulePrompt() {
    if (pendingDisplayPromptId_) {
      clearTimeout(pendingDisplayPromptId_)
      pendingDisplayPromptId_ = null
    }

    const numVisits = parseInt(localStorageGetItem(numVisitsKey(), '0'), 10)
    const lastDismissalMillis = parseInt(localStorageGetItem(lastDismissalKey(), '0'), 10)
    if (displayAllowed_ && shouldDisplayInstallPrompt_(promptConfig_, lastDismissalMillis, numVisits)) {
      const config = {
        name: displayConfig_.preferredName(),
        iconSrc: displayConfig_.preferredIconSrc(),
        installTitle: displayConfig_.preferredInstallTitle(),
        installSubtitle: displayConfig_.preferredInstallSubtitle(),
        installButtonText: displayConfig_.preferredInstallButtonText(),
        iosInstallText: displayConfig_.preferredIosInstallText()
      }
      displayInstallPrompt_(config, onInstalled, onDismissed)
    } else if (displayInstallPrompt_) {
      pendingDisplayPromptId_ = setTimeout(displayOrSchedulePrompt, MILLISECONDS_PER_SECOND * 5)
    } else {
      hideInstallPrompt_()
    }
  }

  function setDisplayAllowed(displayAllowed) {
    displayAllowed_ = displayAllowed
    displayOrSchedulePrompt()
  }

  const configure = (args) => {
    const {
      promptConfig,
      displayConfig,
      shouldDisplayInstallPrompt,
      displayInstallPrompt,
      hideInstallPrompt
    } = args

    if (displayConfig) {
      if (displayConfig.name) {
        displayConfig_.preferredName = () => displayConfig.name
      }
      if (displayConfig.iconSrc) {
        displayConfig_.preferredIconSrc = () => displayConfig.iconSrc
      }
      if (displayConfig.installButtonText) {
        displayConfig_.preferredInstallButtonText = () => displayConfig.installButtonText
      }
      if (displayConfig.iosInstallText) {
        displayConfig_.preferredIosInstallText = () => displayConfig.iosInstallText
      }
      if (displayConfig.installTitle) {
        displayConfig_.preferredInstallTitle = () => displayConfig.installTitle
      }
      if (displayConfig.installSubtitle) {
        displayConfig_.preferredInstallSubtitle = () => displayConfig.installSubtitle
      }
    }
    if (promptConfig) {
      Object.assign(promptConfig_, promptConfig)
    }
    if (shouldDisplayInstallPrompt) {
      shouldDisplayInstallPrompt_ = shouldDisplayInstallPrompt
    }
    if (displayInstallPrompt) {
      displayInstallPrompt_ = displayInstallPrompt
    }
    if (hideInstallPrompt) {
      hideInstallPrompt_ = hideInstallPrompt
    }
  }

  function hideInstallPrompt() {
    if (!rootNode_) {
      return
    }
    document.getElementsByTagName('body')[0].removeChild(rootNode_)
    rootNode_ = null
  }

  return {
    configure,
    pipelineModule,
    setDisplayAllowed,
  }
}

const PwaInstallerFactory = () => {
  if (!pwaInstallerModule_) {
    pwaInstallerModule_ = create()
  }
  return pwaInstallerModule_
}

window.addEventListener('beforeinstallprompt', function(e) {
  e.preventDefault()
  installEvent_ = e
})

window.addEventListener('load', (event) => {
  recordVisit()
})

module.exports = {
  PwaInstallerFactory,
}
