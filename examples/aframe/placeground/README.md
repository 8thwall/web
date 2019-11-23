# 8th Wall Web Examples - AFrame - Tap to place

This interactive example allows the user to grow trees on the ground by tapping. This showcases raycasting, instantiating objects, importing 3D model and the animation system.

![tapplace-screenshot](../../../images/screenshot-tap.jpg)

[Try the live demo here](https://templates.8thwall.app/placeground-aframe)

## tap-place component

The primary component used is called ‘tap-place’. This component attaches to the a-scene. On ‘click’ (when the user taps the screen), it creates a new a-entity. This is the empty game object that will hold the tree. Then, using the raycaster attached to the scene’s a-camera, it determines where the intersection with the ground occurs (the new tree’s position). Next, it applies a random rotation for aesthetic, sets its scale to a very small value (in preparation for the scale-up animation), sets the ‘gltf-model’ attribute to the tree model and append the new element as a child of the scene. Finally, once the ‘model-loaded’ event fires, it applies the scale-up animation.
