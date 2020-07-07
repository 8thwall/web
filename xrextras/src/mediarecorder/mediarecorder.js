import {initMediaPreview, removeMediaPreview} from './media-preview'
import {initRecordButton, removeRecordButton, setCaptureMode} from './record-button'
import {configure} from './capture-config'

const create = () => ({
  initMediaPreview,
  removeMediaPreview,
  initRecordButton,
  removeRecordButton,
  configure,
  setCaptureMode,
})

let mediaRecorder = null

const MediaRecorderFactory = () => {
  if (mediaRecorder === null) {
    mediaRecorder = create()
  }

  return mediaRecorder
}

// TODO: export MediaRecorderFactory
const MediaRecorder = MediaRecorderFactory()
export {
  MediaRecorder,
}
