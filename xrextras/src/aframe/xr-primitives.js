const xrPrimitives = () => {
  const faceAnchorPrimitive = {
    defaultComponents: {
      'xrextras-faceanchor': {},
    },
  }
  const resourcePrimitive = {
    defaultComponents: {
      'xrextras-resource': {}
    },
    mappings: {
      src: 'xrextras-resource.src',
    }

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
    }
  }

  const basicMaterialPrimitive = {
    defaultComponents: {
      'xrextras-basic-material': {},
    },
    mappings: {
      tex: 'xrextras-basic-material.tex',
      alpha: 'xrextras-basic-material.alpha',
      opacity: 'xrextras-basic-material.opacity',
    }
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
    }
  }

  const faceMeshPrimitive = {
    defaultComponents: {
      'xrextras-face-mesh': {},
    },
    mappings: {
      'material-resource': 'xrextras-face-mesh.material-resource',
    }
  }

  const faceAttachmentPrimitive = {
    defaultComponents: {
      'xrextras-face-attachment': {},
    },
    mappings: {
      point: 'xrextras-face-attachment.point',
    }
  }

  return {
    'xrextras-faceanchor': faceAnchorPrimitive,
    'xrextras-resource': resourcePrimitive,
    'xrextras-pbr-material': pbrMaterialPrimitive,
    'xrextras-basic-material': basicMaterialPrimitive,
    'xrextras-video-material': videoMaterialPrimitive,
    'xrextras-face-mesh': faceMeshPrimitive,
    'xrextras-face-attachment': faceAttachmentPrimitive,
  }
}

module.exports = {
  xrPrimitives,
}
