# A-Frame: Manipulate 3D Model

[Try the live demo here](https://8thwall.8thwall.app/manipulate-aframe)

This example allows the user to position, scale, and rotate an object using raycasting and gesture inputs.

![](https://media.giphy.com/media/6sWoOFGEDIz1e2K0P7/giphy.gif)

### Project Components

```xrextras-gesture-detector``` is required in your ```<a-scene>``` for xrextras gesture components 
to function correctly.

- element: the element touch event listeners are added to (default: '')

```xrextras-hold-drag``` lifts up and drags around its entity on finger down/drag. The entity must receive raycasts.

- cameraId: the id of the ```<a-camera>```(default: 'camera')
- groundId: the id of the ground ```<a-entity>```(default: 'ground')
- dragDelay: the time required for the user's finger to be down before lifting the object (default: 300)

```xrextras-pinch-scale```

- min: smallest scale user can pinch to (default: 0.33)
- max: largest scale user can pinch to (default: 3)
- scale: sets initial scale. If set to 0, the object's initial scale is used (default: 0)

```xrextras-one-finger-rotate``` lets the user drag across the screen with one finger
to spin an object around its y axis.

- factor: increase this number to spin more given the same drag distance (default: 6)

```xrextras-two-finger-rotate```  lets the user drag across the screen with two fingers
to spin an object around its y axis.

- factor: increase this number to spin more given the same drag distance (default: 5)

Check out the source code for these XRExtras components on [Github](https://8th.io/xrextras-components).
