import * as htmlContent from './media-preview.html'
import './media-preview.css'
import {configure, getConfig} from './capture-config'

const IOS_DOWNLOAD_LOCATION = 'shareddocuments:///private/var/mobile/Library/Mobile Documents/com~apple~CloudDocs/Downloads/'

const getFileNamePrefix = () => getConfig().fileNamePrefix || 'my-capture-'

const clickAnchor = (properties) => {
  const anchor = document.createElement('a')
  Object.assign(anchor, properties)
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
}

let currentBlob = null
let currentUrl = null
let currentFilename = null
let previewIsImage = false
let previewInteractableTimeout = null

let previewContainer
let imagePreview
let videoPreview
let muteButtonImg

const clearState = () => {
  currentBlob = null
  if (currentUrl) {
    URL.revokeObjectURL(currentUrl)
  }
  clearTimeout(previewInteractableTimeout)
  previewContainer.style.removeProperty('pointer-events')
  currentUrl = null
  previewIsImage = false
  previewContainer.classList.remove('fade-in')
  previewContainer.classList.remove('image-preview')
  previewContainer.classList.remove('video-preview')
  previewContainer.classList.remove('downloaded')
}

const setMuted = (muted) => {
  videoPreview.muted = muted

  if (muted) {
    muteButtonImg.src = '//cdn.8thwall.com/web/img/mediarecorder/sound-off-v1.svg'
  } else {
    muteButtonImg.src = '//cdn.8thwall.com/web/img/mediarecorder/sound-on-v1.svg'
  }
}

const closePreview = () => {
  clearState()
  imagePreview.removeAttribute('src')
  videoPreview.pause()
  videoPreview.removeAttribute('src')
  window.dispatchEvent(new CustomEvent('mediarecorder-previewclosed'))
}

const downloadFile = () => {
  clickAnchor({
    href: currentUrl,
    download: currentFilename,
  })

  previewContainer.classList.add('downloaded')
}

const openIosDownload = () => {
  clickAnchor({
    href: IOS_DOWNLOAD_LOCATION + currentFilename,
    target: '_blank',
  })
}

const share = () => {
  const fileToInclude = new File([currentBlob], currentFilename, {
    type: previewIsImage ? 'image/jpeg' : 'video/mp4',
    lastModified: Date.now(),
  })

  const shareObject = {
    title: '',
    text: '',
    files: [fileToInclude],
  }

  navigator.share(shareObject)
}

const getTimestamp = () => {
  const now = new Date()
  return [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map(n => n.toString().padStart(2, '0')).join('')
}

const showPreview = () => {
  previewContainer.classList.add('fade-in')
  window.dispatchEvent(new CustomEvent('mediarecorder-previewopened'))
  // This prevents a click on the capture button from also causing a click on the download button
  clearTimeout(previewInteractableTimeout)
  previewInteractableTimeout = setTimeout(() => {
    previewContainer.style.pointerEvents = 'auto'
  }, 100)
}

const showImagePreview = ({blob}) => {
  clearState()
  currentBlob = blob
  currentUrl = URL.createObjectURL(blob)
  currentFilename = `${getFileNamePrefix()}${getTimestamp()}.jpg`
  previewIsImage = true
  const reader = new FileReader()
  reader.readAsDataURL(blob)
  reader.onloadend = () => {
    imagePreview.src = reader.result
    previewContainer.classList.add('image-preview')
    showPreview()
  }
}

const showVideoPreview = ({videoBlob}) => {
  clearState()
  currentBlob = videoBlob
  currentUrl = URL.createObjectURL(videoBlob)
  currentFilename = `${getFileNamePrefix()}${getTimestamp()}.mp4`

  previewContainer.classList.add('video-preview')

  videoPreview.oncanplaythrough = () => {
    videoPreview.oncanplaythrough = null
    showPreview()

    setMuted(false)
    videoPreview.play().then(() => {
      // On iOS, this fixes the audio playback issue with volume being very low
      if (window.XR8.XrDevice.deviceEstimate().os === 'iOS') {
        videoPreview.pause()
        videoPreview.play()
      }
    }).catch(() => {
      // If the play command failed, retry with the video muted
      setMuted(true)
      videoPreview.play()
    })
  }

  videoPreview.src = currentUrl
  videoPreview.load()
}

const showVideoHandler = event => showVideoPreview(event.detail)
const showImageHandler = event => showImagePreview(event.detail)

const initMediaPreview = (options = {}) => {
  document.body.insertAdjacentHTML('beforeend', htmlContent)

  previewContainer = document.getElementById('previewContainer')
  imagePreview = document.getElementById('imagePreview')
  videoPreview = document.getElementById('videoPreview')
  muteButtonImg = document.getElementById('muteButtonImg')

  const downloadButton = document.getElementById('downloadButton')
  const actionButton = document.getElementById('actionButton')
  const actionButtonText = document.getElementById('actionButtonText')
  const actionButtonImg = document.getElementById('actionButtonImg')

  // Checks for WKWebView's that can't download : https://github.com/eligrey/FileSaver.js/issues/686
  // TODO(paris): Check for Brave with https://www.ctrl.blog/entry/brave-user-agent-detection.html
  // Info today: {name: "Mobile Safari", version: "14.0", majorVersion: 14, inAppBrowser: undefined}
  const isWKWebViewiOS = ['Microsoft Edge', 'Google Chrome', 'Mozilla Firefox Focus', 'Opera Touch',
    'Pinterest', 'Snapchat', 'Instagram', 'Facebook', 'Facebook Messenger', 'Line', 'LinkedIn',
    'Naver', 'Baidu'].includes(window.XR8.XrDevice.deviceEstimate().browser.inAppBrowser) ||
    window.XR8.XrDevice.deviceEstimate().browser.name === 'Firefox'

  const tmpFile = new File([new Blob()], 'tmp.mp4', {
    type: 'video/mp4',
    lastModified: Date.now(),
  })
  const shareTestObj = {
    files: [tmpFile],
  }

  // Check if Web Share API Level 2 is supported
  if (navigator.canShare && navigator.canShare(shareTestObj)) {
    actionButtonText.textContent = options.actionButtonShareText || 'Share'
    actionButtonImg.src = '//cdn.8thwall.com/web/img/mediarecorder/share-v1.svg'
    actionButton.addEventListener('click', share)
  } else if (window.XR8.XrDevice.deviceEstimate().os === 'iOS' && isWKWebViewiOS) {
    previewContainer.classList.add('disabled-download')
    actionButton.parentNode.removeChild(actionButton)
    downloadButton.parentNode.removeChild(downloadButton)
  } else if (window.XR8.XrDevice.deviceEstimate().os === 'iOS') {
    actionButtonText.textContent = options.actionButtonViewText || 'View'
    actionButtonImg.src = '//cdn.8thwall.com/web/img/mediarecorder/view-v1.svg'
    actionButton.addEventListener('click', openIosDownload)
    actionButton.classList.add('show-after-download')
  } else {
    actionButton.parentNode.removeChild(actionButton)
  }

  document.getElementById('toggleMuteButton').addEventListener('click', () => {
    setMuted(!videoPreview.muted)
  })

  window.addEventListener('mediarecorder-recordcomplete', showVideoHandler)
  window.addEventListener('mediarecorder-photocomplete', showImageHandler)

  document.getElementById('closePreviewButton').addEventListener('click', closePreview)
  if (document.getElementById('downloadButton')) {
    downloadButton.addEventListener('click', downloadFile)
  }

  // Initialize with default configuration
  configure()
}

const removeMediaPreview = () => {
  previewContainer.parentNode.removeChild(previewContainer)
  clearState()
  currentFilename = null
  previewContainer = null
  imagePreview = null
  videoPreview = null
  muteButtonImg = null
  window.removeEventListener('mediarecorder-recordcomplete', showVideoHandler)
  window.removeEventListener('mediarecorder-photocomplete', showImageHandler)
}

export {
  initMediaPreview,
  removeMediaPreview,
}
