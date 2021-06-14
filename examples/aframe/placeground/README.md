# 8th Wall Web Examples - AFrame - Tap to place

[Try the live demo here](https://8thwall.8thwall.app/placeground-aframe)

This example allows the user to grow trees on the ground by tapping. Showcases raycasting,
creating new objects, and importing a 3D model.

![](https://media.giphy.com/media/1vcbBZMlaZ4KElLnNH/giphy.gif)

### Project Components

```tap-place```

The primary component used is called ‘tap-place’. This component attaches to the a-scene. On ‘click’ (when the user taps the screen), it creates a new a-entity. This is the empty game object that will hold the tree. Then, using the raycaster attached to the scene’s a-camera, it determines where the intersection with the ground occurs (the new tree’s position). Next, it applies a random rotation for aesthetic, sets its scale to a very small value (in preparation for the scale-up animation), sets the ‘gltf-model’ attribute to the tree model and append the new element as a child of the scene. Finally, once the ‘model-loaded’ event fires, it applies the scale-up animation.
