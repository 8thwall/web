let playcanvas = null

const PlayCanvasFactory = () => {
  if (!playcanvas) {
    playcanvas = create()
  }

  return playcanvas
}

function create() {
  // Attach a shader to a material that makes it appear transparent while still receiving shadows.
  const makeShadowMaterial = ({pc, material}) => {
    const materialResource = material.resource || material
    const shadowFragmentShader = `
      #ifdef GL2
      #define SHADOW_SAMPLERVS sampler2DShadow
      #else
      #define SHADOW_SAMPLERVS sampler2D
      #endif
      vec3 dEmissive;
      float getShadowPCF3x3(SHADOW_SAMPLERVS shadowMap, vec3 shadowParams);
      vec3 getTransparentShadow() {
          float shadow = getShadowPCF3x3(light0_shadowMap, light0_shadowParams);
          dAlpha = 1. - clamp(shadow + 0.5, 0., 1.);
          return -gl_FragColor.rgb;
      }
      
      void getEmission() {

      }
    `

    const endShader = `
      gl_FragColor.rgb = combineColor();
      gl_FragColor.rgb += getTransparentShadow();
      gl_FragColor.rgb = addFog(gl_FragColor.rgb);

      #ifndef HDR
      gl_FragColor.rgb = toneMap(gl_FragColor.rgb);
      gl_FragColor.rgb = gammaCorrectOutput(gl_FragColor.rgb);
      #endif
    `

    // We use emissive because it can overwrite color to be pure black.
    materialResource.chunks.APIVersion = pc.CHUNKAPI_1_55
    materialResource.chunks.emissivePS = shadowFragmentShader
    materialResource.chunks.endPS = endShader
    materialResource.blendType = pc.BLEND_PREMULTIPLIED
    materialResource.update()
  }

  // Finds one camera entity in the scene graph of a given entity. If there are multiple cameras, a
  // warning is printed and one of them is returned arbitrarily. If there are no cameras, an error
  // is printed, and undefined is returned.
  const findOneCamera = (entity) => {
    // Find all camera components in the graph of an entity.
    const cameras = entity.root.findComponents('camera')

    if (!cameras.length) {
      console.error(`Couldn't find any cameras in the scene graph of ${entity.name}`)
      return
    }
    if (cameras.length > 1) {
      console.warn(`Found too many cameras (${cameras.length}) in the scene graph of ${entity.name}`)
    }

    // Pick the first camera if there are multiple.
    return cameras[0].entity
  }

  // Configures the playcanvas entity to to track the image target with the specified name. This
  // matches the name set in the 8th Wall console.
  const trackImageTargetWithName = ({name, entity, app}) => {
    entity.enabled = false
    const showImage = (detail) => {
      if (name != detail.name) { return }
      const {rotation, position, scale} = detail
      entity.setRotation(rotation.x, rotation.y, rotation.z, rotation.w)
      entity.setPosition(position.x, position.y, position.z)
      entity.setLocalScale(scale, scale, scale)
      entity.enabled = true
    }

    const hideImage = (detail) => {
      if (name != detail.name) { return }
      entity.enabled = false
    }

    app.on('xr:imagefound', showImage, {})
    app.on('xr:imageupdated', showImage, {})
    app.on('xr:imagelost', hideImage, {})
  }

  return {
    findOneCamera,
    makeShadowMaterial,
    trackImageTargetWithName,
  }
}

module.exports = {
  PlayCanvasFactory,
}
