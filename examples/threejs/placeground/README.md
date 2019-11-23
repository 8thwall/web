# 8th Wall Web Examples - three.js - Tap to place

This interactive example allows the user to grow trees on the ground by tapping. This showcases raycasting, instantiating objects, importing 3D models, and animation.

![tapplace-threejs-screenshot](../../../images/screenshot-tap.jpg)

[Try the live demo here](https://templates.8thwall.app/placeground-threejs)

## Overview

On 'touchstart' (when the user taps the screen), a THREE.Raycaster() is used to determine where the intersection with the ground (a transparent THREE.PlaneGeometry residing at a height of Y=0) occurs.  THREE.GLTFLoader() is then used to load a .glb file and place it at the tap location on the ground. The model is instantiated with a random Y-rotation and the initial scale is set to a very small value.  tween.js is then used to apply a scale-up animation to the model.
