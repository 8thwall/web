/*jshint esversion: 6, asi: true, laxbreak: true*/

// taprecenter.js: Defines a playcanvas script that re-centers the AR scene when the screen is
// tapped.

var taprecenter = pc.createScript('taprecenter')

// Fire a 'recenter' event to move the camera back to its starting location in the scene.
taprecenter.prototype.initialize = function() {
  this.app.touch.on(pc.EVENT_TOUCHSTART,
    (event) => { if (event.touches.length !== 1) { return } this.app.fire('xr:recenter')})
}
