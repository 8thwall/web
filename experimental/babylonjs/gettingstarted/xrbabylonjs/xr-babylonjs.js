// Copyright (c) 2019 8th Wall, Inc.
// Original Author: Tony Tomarchio (tony@8thwall.com)
//
// Babylonjs based renderer

function BabylonjsFactory() {
  let scene3
  
  // Tmp variables to avoid create/destroy objects every frame
  let tmpMatrix
  let tmpQuaternion

  function pipelineModule() {
    if (!window.BABYLON) {
      throw new Error('window.BABLYON does not exist but is required by the BabylonJS pipeline module')
    }

    tmpMatrix = new BABYLON.Matrix()
    tmpQuaternion = new BABYLON.Quaternion()

    return {
      name: 'babylonjsrenderer',
      onStart: ({canvas}) => {

        const engine = new BABYLON.Engine(canvas, true, { stencil: true, disableWebGL2Support: true, preserveDrawingBuffer: true })
        engine.enableOfflineSupport = false

        const scene = new BABYLON.Scene(engine)
        scene.autoClear = false

        const camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 1, 0), scene)
        camera.rotationQuaternion = new BABYLON.Quaternion()
        camera.attachControl(canvas, true)
        camera.minZ = 0.01

        scene3 = {engine, scene, camera}
      },
      onUpdate: ({processCpuResult}) => {
        if (!processCpuResult.reality) {
          return
        }
        const {rotation, position, intrinsics} = processCpuResult.reality
        const {scene, camera} = scene3

        if(intrinsics) {
          camera._projectionMatrix.setRowFromFloats(0, intrinsics[0], intrinsics[1],intrinsics[2], intrinsics[3])
          camera._projectionMatrix.setRowFromFloats(1, intrinsics[4], intrinsics[5],intrinsics[6], intrinsics[7])
          camera._projectionMatrix.setRowFromFloats(2, intrinsics[8], intrinsics[9],intrinsics[10], intrinsics[11])
          camera._projectionMatrix.setRowFromFloats(3, intrinsics[12], intrinsics[13],intrinsics[14], intrinsics[15])
          if (!scene.useRightHandedSystem) {
            camera._projectionMatrix.toggleProjectionMatrixHandInPlace()
          }
        }

        if (rotation) {
          // change handedness if needed and set to camera
          tmpQuaternion.copyFrom(rotation)
          tmpQuaternion.toRotationMatrix(tmpMatrix)
          if (!scene.useRightHandedSystem) {
            tmpMatrix.toggleModelMatrixHandInPlace()
          }
          tmpQuaternion.fromRotationMatrix(tmpMatrix)
          camera.rotationQuaternion.copyFrom(tmpQuaternion)
        }

        if (position) {
          // change handedness if needed and set to camera
          BABYLON.Matrix.IdentityToRef(tmpMatrix)
          tmpMatrix.setTranslation(position)
          if (!scene.useRightHandedSystem) {
            tmpMatrix.toggleModelMatrixHandInPlace()
          }
          tmpMatrix.getTranslationToRef(camera.position)
        }
      },
      onCanvasSizeChange: () => {
        const {engine} = scene3
        engine.resize()
      },
      onRender: () => {
        const {scene, camera} = scene3
        scene.render()
      },
    }
  }

  // Get a handle to the xr engine, scene and camera. Returns:
  // {
  //   engine: The Babylonjs engine.
  //   scene: The Babylonjs scene.
  //   camera: The Threejs main camera.
  // }
  const xrScene = () => {
    return scene3
  }

  return {
    pipelineModule,
    xrScene,
  }
}

window.Babylonjs = BabylonjsFactory()
