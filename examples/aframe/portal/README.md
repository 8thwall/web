# 8th Wall Web Examples - AFrame - Portal

[Try the live demo here](https://8thwall.8thwall.app/portal-aframe)

This example shows off the popular portal illusion in web AR using three.js materials and the camera position as an event trigger.

![](https://media.giphy.com/media/S5cOkP6H4UbFY8Tlsg/giphy.gif)

### Project Components

```portal``` component hides and shows certain elements as the camera moves.

```xrextras-hider-material``` is applied to any mesh or primitive that must be transparent while 
blocking the rendering of models behind it.

```cubemap-static``` applies environment cubemaps to glb models.

- 'cubemap-static.js' is a slightly modified version of 
['cube-env-map.js'](https://raw.githubusercontent.com/donmccurdy/aframe-extras/master/src/misc/cube-env-map.js)
that works with 8th Wall's asset hierarchy. Learn more about donmccurdy's aframe-extras 
[here](https://github.com/donmccurdy/aframe-extras/tree/master/src/misc#cube-env-map).

```bob``` animates the ball up and down depending on 'distance' and 'duration' parameters. 

- distance: (default: 0.15)
- duration: (default: 1000)
