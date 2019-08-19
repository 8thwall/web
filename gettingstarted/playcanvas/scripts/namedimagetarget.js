/*jshint esversion: 6, asi: true, laxbreak: true*/

// namedimagetarget.js: Controls visibility, position, orientation, and scaling of a 3D object that
// should attach to a real-world image target. This script should be attached to an entity of which
// the target content is a child. The name of the image target should match its name as configured
// on 8thwall.com.

var namedimagetarget = pc.createScript('namedimagetarget');

namedimagetarget.attributes.add('name', {type: 'string'})

namedimagetarget.prototype.initialize =
  function() { XRExtras.PlayCanvas.trackImageTargetWithName(this) }
