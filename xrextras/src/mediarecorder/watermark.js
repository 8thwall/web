import {getConfig} from './capture-config'

const scaleToFit = (width, height, maxWidth, maxHeight) => {
  const scale = Math.min(maxWidth / width, maxHeight / height)
  return {width: width * scale, height: height * scale}
}

const START_ALIGNMENT = 0
const MIDDLE_ALIGNMENT = 1
const END_ALIGNMENT = 2

const getVerticalAlignment = (location) => {
  switch (location) {
    case 'topLeft':
    case 'topMiddle':
    case 'topRight':
      return START_ALIGNMENT
    case 'bottomLeft':
    case 'bottomMiddle':
    case 'bottomRight':
    default:
      return END_ALIGNMENT
  }
}

const getHorizontalAlignment = (location) => {
  switch (location) {
    case 'topLeft':
    case 'bottomLeft':
      return START_ALIGNMENT
    case 'topMiddle':
    case 'bottomMiddle':
      return MIDDLE_ALIGNMENT
    case 'topRight':
    case 'bottomRight':
    default:
      return END_ALIGNMENT
  }
}

const positionAxis = (alignment, itemSize, containerSize) => {
  switch (alignment) {
    case START_ALIGNMENT:
      return 0
    case MIDDLE_ALIGNMENT:
      return containerSize / 2 - itemSize / 2
    case END_ALIGNMENT:
    default:
      return containerSize - itemSize
  }
}

const getWatermarkPosition = (width, height, containerWidth, containerHeight, position) => ({
  x: positionAxis(getHorizontalAlignment(position), width, containerWidth),
  y: positionAxis(getVerticalAlignment(position), height, containerHeight),
})

const drawWatermark = (ctx) => {
  const currentConfig = getConfig()
  if (!currentConfig.watermarkImage) {
    return
  }

  const {
    watermarkImage, watermarkLocation, watermarkMaxWidth, watermarkMaxHeight,
  } = currentConfig

  const imageWidth = watermarkImage.naturalWidth
  const imageHeight = watermarkImage.naturalHeight
  const canvasWidth = ctx.canvas.width
  const canvasHeight = ctx.canvas.height
  const maxWidth = canvasWidth * (watermarkMaxWidth || 20) / 100
  const maxHeight = canvasHeight * (watermarkMaxHeight || 20) / 100
  const {width, height} = scaleToFit(imageWidth, imageHeight, maxWidth, maxHeight)
  const {x, y} = getWatermarkPosition(width, height, canvasWidth, canvasHeight, watermarkLocation)
  ctx.drawImage(currentConfig.watermarkImage, x, y, width, height)
}

export {
  // eslint-disable-next-line import/prefer-default-export
  drawWatermark,
}
