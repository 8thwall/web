# Getting Started with PlayCanvas

## Sample Projects

To get started go to https://playcanvas.com/the8thwall and fork one of our sample projects:

* [AR World Tracking Starter Kit](https://playcanvas.com/project/631719/overview/ar-world-tracking-starter-kit): An application to get you started quickly creating AR world tracking applications in PlayCanvas.

* [AR Image Tracking Starter Kit](https://playcanvas.com/project/631721/overview/ar-image-tracking-starter-kit): An application to get you started quickly creating AR image tracking applications in PlayCanvas.

* [AR Face Tracking Starter Kit](https://playcanvas.com/project/687674/overview/ar-face-effects-starter-kit): An application to get you started quickly creating AR face effect applications in PlayCanvas.

## Add your App Key

Go to Settings -> External Scripts

The following two scripts should be added added:

https://cdn.8thwall.com/web/xrextras/xrextras.js

https://apps.8thwall.com/xrweb?appKey=XXXXXX

(Note: replace the X's with your own unique App Key obtained at https://console.8thwall.com)

## Enable "Transparent Canvas"

Go to Settings -> Rendering

Make sure that "Transparent Canvas" is **checked**

## Add XRController

The 8th Wall sample PlayCanvas projects are populated with an XRController game object.  If you are starting with a blank project, download `xrcontroller.js` from https://www.github.com/8thwall/web/tree/master/gettingstarted/playcanvas/scripts/ and attach to an Entity in your scene.

Options:

Option | Description 
--------- | -----------
disableWorldTracking  | If true, turn off SLAM tracking for efficiency.
shadowmaterial | Material which you want to use as a transparent shadow receiver (e.g. for ground shadows).  Typically this material will be used on a "ground" plane entity positioned at (0,0,0)
