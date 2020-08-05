const xrPrimitives = () => {
  const faceAnchorPrimitive = {
    defaultComponents: {
      'xrextras-faceanchor': {},
    },
  }
  const resourcePrimitive = {
    defaultComponents: {
      'xrextras-resource': {},
    },
    mappings: {
      src: 'xrextras-resource.src',
    },

  }

  const pbrMaterialPrimitive = {
    defaultComponents: {
      'xrextras-pbr-material': {},
    },
    mappings: {
      tex: 'xrextras-pbr-material.tex',
      metalness: 'xrextras-pbr-material.metalness',
      normals: 'xrextras-pbr-material.normals',
      roughness: 'xrextras-pbr-material.roughness',
      alpha: 'xrextras-pbr-material.alpha',
      opacity: 'xrextras-pbr-material.opacity',
    },
  }

  const basicMaterialPrimitive = {
    defaultComponents: {
      'xrextras-basic-material': {},
    },
    mappings: {
      tex: 'xrextras-basic-material.tex',
      alpha: 'xrextras-basic-material.alpha',
      opacity: 'xrextras-basic-material.opacity',
    },
  }

  const videoMaterialPrimitive = {
    defaultComponents: {
      'xrextras-video-material': {},
    },
    mappings: {
      video: 'xrextras-video-material.video',
      alpha: 'xrextras-video-material.alpha',
      autoplay: 'xrextras-video-material.autoplay',
      opacity: 'xrextras-video-material.opacity',
    },
  }

  const faceMeshPrimitive = {
    defaultComponents: {
      'xrextras-face-mesh': {},
    },
    mappings: {
      'material-resource': 'xrextras-face-mesh.material-resource',
    },
  }

  const faceAttachmentPrimitive = {
    defaultComponents: {
      'xrextras-face-attachment': {},
    },
    mappings: {
      point: 'xrextras-face-attachment.point',
    },
  }

  const captureButtonPrimitive = {
    defaultComponents: {
      'xrextras-capture-button': {},
    },
    mappings: {
      'capture-mode': 'xrextras-capture-button.captureMode',
    },
  }

  const capturePreviewPrimitive = {
    defaultComponents: {
      'xrextras-capture-preview': {},
    },
    mappings: {
      'action-button-view-text': 'xrextras-capture-preview.actionButtonViewText',
      'action-button-share-text': 'xrextras-capture-preview.actionButtonShareText',
    },
  }

  const captureConfigPrimitive = {
    defaultComponents: {
      'xrextras-capture-config': {},
    },
    mappings: {
      'enable-end-card': 'xrextras-capture-config.enableEndCard',
      'short-link': 'xrextras-capture-config.shortLink',
      'cover-image-url': 'xrextras-capture-config.coverImageUrl',
      'footer-image-url': 'xrextras-capture-config.footerImageUrl',
      'max-duration-ms': 'xrextras-capture-config.maxDurationMs',
      'end-card-call-to-action': 'xrextras-capture-config.endCardCallToAction',
      'max-dimension': 'xrextras-capture-config.maxDimension',
      'watermark-image-url': 'xrextras-capture-config.watermarkImageUrl',
      'watermark-max-width': 'xrextras-capture-config.watermarkMaxWidth',
      'watermark-max-height': 'xrextras-capture-config.watermarkMaxHeight',
      'watermark-location': 'xrextras-capture-config.watermarkLocation',
      'file-name-prefix': 'xrextras-capture-config.fileNamePrefix',
      'request-mic': 'xrextras-capture-config.requestMic',
      'exclude-scene-audio': 'xrextras-capture-config.excludeSceneAudio',
    },
  }

  return {
    'xrextras-faceanchor': faceAnchorPrimitive,
    'xrextras-resource': resourcePrimitive,
    'xrextras-pbr-material': pbrMaterialPrimitive,
    'xrextras-basic-material': basicMaterialPrimitive,
    'xrextras-video-material': videoMaterialPrimitive,
    'xrextras-face-mesh': faceMeshPrimitive,
    'xrextras-face-attachment': faceAttachmentPrimitive,
    'xrextras-capture-button': captureButtonPrimitive,
    'xrextras-capture-preview': capturePreviewPrimitive,
    'xrextras-capture-config': captureConfigPrimitive,
  }
}

module.exports = {
  xrPrimitives,
}
