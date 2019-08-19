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
      float getShadowPCF3x3VS(SHADOW_SAMPLERVS shadowMap, vec3 shadowParams);

      vec3 getEmission() {
          float shadow = getShadowPCF3x3VS(light0_shadowMap, light0_shadowParams);
          dAlpha = 1. - clamp(shadow + 0.5, 0., 1.);
          return -gl_FragColor.rgb;
      }`
    // We use emissive because it can overwrite color to be pure black.
    materialResource.chunks.emissivePS = shadowFragmentShader
    materialResource.blendType = pc.BLEND_PREMULTIPLIED
    materialResource.update()
  }

  // Finds one camera entity in the scene graph of a given entity. If there are multiple cameras, a
  // warning is printed and one of them is returned arbitrarily. If there are no cameras, an error
  // is printed, and undefined is returned.
  const findOneCamera = (entity) => {
    // Recursively traverse an entity graph until the root is reached.
    const findRoot = (entity) => (entity.parent && findRoot(entity.parent)) || entity

    // Return a node and all entities in its subtree as a flat list, in pre-order traversal order.
    // Note thiat subtree(findRoot(entity)) will return all nodes in the graph of entity.
    const subtree = (entity) =>
      [entity].concat(entity.children.reduce((r, v) => r.concat(subtree(v)), []))

    // Find all camera entities in the graph of an entity.
    const cameras = (entity) =>
      subtree(findRoot(entity)).filter(v => v.camera && v.camera instanceof pc.CameraComponent)

    // Get the cameras in the request entity's graph, and print an error or warning if there isn't
    // exactly one.
    const cs = cameras(entity)
    if (!cs.length) {
      console.error(`Couldn't find any cameras in the scene graph of ${entity.name}`)
      return
    }
    if (cs.length > 1) {
      console.warn(`Found too many cameras (${cs.length}) in the scene graph of ${entity.name}`)
    }

    // Pick the frist camera if there are multiple.
    return cs[0]
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
