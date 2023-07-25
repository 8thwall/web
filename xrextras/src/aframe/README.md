# A-Frame XRExtras Library

The XRExtras library contains various A-Frame components and primitives to quickly add common behaviors and interactions to your 8th Wall experience.

## A-Frame Components

- `xrextras-almost-there`
- `xrextras-loading`
- `xrextras-runtime-error`
- `xrextras-stats`
- `xrextras-tap-recenter`
- `xrextras-generate-image-targets`
- `xrextras-gesture-detector`
- `xrextras-one-finger-rotate`
- `xrextras-two-finger-rotate`
- `xrextras-pinch-scale`
- `xrextras-hold-drag`
- `xrextras-attach`
- `xrextras-play-video`
- `xrextras-log-to-screen`
- `xrextras-pwa-installer`
- `xrextras-pause-on-blur`
- `xrextras-pause-on-hidden`
- `xrextras-hide-camera-feed`
- `xrextras-hider-material`
- `xrextras-spin`

## A-Frame Primitives

- `<xrextras-faceanchor>`
- `<xrextras-resource>`
- `<xrextras-pbr-material>`
- `<xrextras-basic-material>`
- `<xrextras-video-material>`
- `<xrextras-face-mesh>`
- `<xrextras-face-attachment>`
- `<xrextras-capture-button>`
- `<xrextras-capture-preview>`
- `<xrextras-capture-config>`
- `<xrextras-curved-target-container>`
- `<xrextras-named-image-target>`
- `<xrextras-target-mesh>`
- `<xrextras-target-video-fade>`
- `<xrextras-target-video-sound>`
- `<xrextras-opaque-background>`

## Components

### `xrextras-almost-there`

Detects incompatible browsers and guides the user to either refresh the page to accept permissions or to open the experience in a compatible browser. This component is succeeded by `xrextras-loading`.

**Properties**

| Property | Type   | Default | Description                    |
|----------|--------|---------|--------------------------------|
| url      | string | ""      | Used for the QR code and link out button. |

### `xrextras-loading`

Displays almost there flows and a loading screen until scene assets are loaded.

**Properties (all optional)**

| Property              | Type   | Default | Description                                                        |
|-----------------------|--------|---------|--------------------------------------------------------------------|
| loadBackgroundColor   | string | ""      | Background hex color of the loading screen's lower section.         |
| cameraBackgroundColor | string | ""      | Background hex color of the loading screen's top section.           |
| loadImage             | string | ""      | The HTML Element ID of an image. The image needs to be an `<a-asset>`. Ex: `#load` |
| loadAnimation         | string | "spin"  | Animation style of `loadImage`. Choose from `spin`, `pulse`, `scale`, or `none`. |

### `xrextras-runtime-error`

Catches runtime errors and displays a "something went wrong" screen.

**Properties**

None.

### `xrextras-stats`

Displays statistics on framerate, memory, and rendering.

**Properties**

| Property | Type | Default | Description                    |
|----------|------|---------|--------------------------------|
| version  | bool | true    | Display the 8th Wall engine version. |

### `xrextras-tap-recenter`

Recenter the scene when the

 screen is tapped.

**Properties**

None.

### `xrextras-generate-image-targets`

Materialize A-Frame primitives into the scene at detected image locations. Entities will have the following attributes set:
- Name: The name of the image target.
- Rotated: Whether the image targets are stored rotated.
- Metadata: Metadata of image target supplied in the 8th Wall console.

**Properties**

| Property   | Type   | Default | Description                                       |
|------------|--------|---------|---------------------------------------------------|
| primitive  | string | ""      | Use this primitive to populate multiple image targets. |

### `xrextras-gesture-detector`

Component that detects and emits events for touch gestures. Required on the `<a-scene>` for xrextras gesture components to function correctly.

**Properties**

| Property | Type   | Default | Description                                       |
|----------|--------|---------|---------------------------------------------------|
| element  | string | ""      | The element touch event listeners are added to.   |

### `xrextras-one-finger-rotate`

Rotate an entity on the Y axis with a one finger swipe.

**Properties**

| Property | Type   | Default | Description                                                     |
|----------|--------|---------|-----------------------------------------------------------------|
| Factor   | number | 6       | Increase this number to spin more given the same drag distance. |

### `xrextras-two-finger-rotate`

Rotate an entity on the Y axis with a two finger swipe.

**Properties**

| Property | Type   | Default | Description                                                     |
|----------|--------|---------|-----------------------------------------------------------------|
| Factor   | number | 5       | Increase this number to spin more given the same drag distance. |

### `xrextras-pinch-scale`

Scales an entity based on two touch inputs.

**Properties (all optional)**

| Property | Type   | Default | Description                                        |
|----------|--------|---------|----------------------------------------------------|
| min      | number | 0.33    | The smallest scale user can pinch to.              |
| max      | number | 3       | The largest scale user can pinch to.               |
| scale    | number | 0       | Set the initial scale. If set to 0, the object's initial scale is used. |

### `xrextras-hold-drag`

Lift up and drag an entity on one finger down/move. The entity must be set up to receive raycasts.

**Properties (all optional)**

| Property    | Type   | Default | Description                                                 |
|-------------|--------|---------|-------------------------------------------------------------|
| cameraId    | string | "camera"| The id of the `<a-camera>`.                                 |
| groundId    | string | "ground"| The id of the ground `<a-entity>`.                           |
| dragDelay   | number | 300     | The time required for the user's finger to be down before lifting the object. |
| riseHeight  | number | 1       | How high the object is lifted on the y-axis.                 |

### `xrextras-attach`

Attaches an entity to another entity, so that it will always follow the target entity's position.

**Properties**

| Property | Type   | Default | Description                           |
|----------|--------|---------|---------------------------------------|
| target   | string | ""      | The ID of the `<a-entity>` element to copy position from. |
| offset   | string | "0 0 0" | The relative offset from the target element.                |

### `xrextras-play-video`

Displays a thumbnail image and waits for the user tap to begin playback (for videos with sound).

**Properties**

| Property    | Type

   | Default | Description                                     |
|-------------|--------|---------|-------------------------------------------------|
| video       | string | ""      | The id of the `<video>` element.                |
| thumb       | string | ""      | The id of the `<img>` element to serve as a thumbnail. |
| canstop     | bool   | null    | Whether the video can be paused on tap.         |

### `xrextras-log-to-screen`

Log console messages over the scene.

**Properties**

None.

### `xrextras-pwa-installer`

Displays a PWA install prompt over the scene. See pwainstallermodule for more information.

**Properties**

| Property               | Type   | Default                    | Description                                                |
|------------------------|--------|----------------------------|------------------------------------------------------------|
| name                   | string | On an 8th Wall hosted app, the default is the PWA Name value specified in the settings. On a self-hosted app, the default is null. | The name of the PWA that will appear on the install prompt. |
| iconSrc                | string | On an 8th Wall hosted app, the default is the PWA Name value specified in the settings. On a self-hosted app, the default is null. | The name of the PWA that will appear on the install prompt. |
| installTitle           | string | "Add to your home screen" | The title to display on the install prompt. This text will appear bolded. |
| installSubtitle        | string | "for easy access."         | The subtitle to display under the title on the install prompt. |
| installButtonText      | string | "Install"                  | The text on the install button. This text will only be visible on browsers which support the beforeinstallprompt window event. |
| iosInstallText         | string | "Tap $ACTION_ICON and then 'Add to Homescreen'" | The text that appears on iOS Safari instructing users how to add the web app to their home screen. The macro, "$ACTION_ICON", will be replaced by an inline SVG which matches the appearance of the iOS action icon. |
| delayAfterDismissalMillis | int  | 90 days (in milliseconds) | The amount of time, in milliseconds, that should pass before attempting to display the install prompt to the user after they have previously dismissed it. |
| minNumVisits           | int    | 2                          | The minimum number of times a user must visit the web app before attempting to display the install prompt. |

### `xrextras-pause-on-blur`

Pauses the scene on window blur and resumes on window focus.

**Properties**

None.

### `xrextras-pause-on-hidden`

Pauses and resumes the scene on document visibility change.

**Properties**

None.

### `xrextras-hide-camera-feed`

Draw a solid color instead of drawing the camera feed.

**Properties**

| Property | Type   | Default   | Description    |
|----------|--------|-----------|----------------|
| color    | string | "#2D2E43" | Background color. |

### `xrextras-hider-material`

Applies an occluder material to a mesh or primitive. The mesh or primitive appears transparent and blocks rendering behind it.

**Properties**

None.

### `xrextras-spin`

Rotates an object around its y-axis.

**Properties**

| Property | Type | Default | Description                                                  |
|----------|------|---------|--------------------------------------------------------------|
| speed    | int  | 2000    | The speed of one full spin in milliseconds.                   |
| direction| string| "normal"| Direction of spin. Options include normal, reverse, and alternate. |



## Primitives

### `<xrextras-opaque-background>`

Show or hide children elements if the user has an opaque background session.

**Attributes**

| Attribute | Type  | Default | Description                                          |
|-----------|-------|---------|------------------------------------------------------|
| remove    | bool  | false   | Only render children elements on AR-capable devices, such as mobile devices and headsets. |

### `<xrextras-named-image-target>`

Tracks an image target. Children elements inherit transforms from the tracked target.

**Attributes**

| Attribute | Type   | Default | Description                                                                |
|-----------|--------|---------|----------------------------------------------------------------------------|
| name      | string | ""      | The name of the image target as it appears on the "Image Targets" page in an 8th Wall project. |

### `<xrextras-faceanchor>`

Inherits the detected face transforms. Entities inside will move with the face. Use the face-id property when xrface maxDetections > 1 to define different face scenes.

**Attributes**

| Attribute | Type | Default | Description                                                              |
|-----------|------|---------|--------------------------------------------------------------------------|
| face-id   | int  | 0       | Attaches the children to the corresponding face id. If not specified, multiple faces will |

### `<xrextras-resource>`

Resource referenced by either xrextras-pbr-material or xrextras-basic-material.

**Attributes**

| Attribute | Type   | Default | Description                   |
|-----------|--------|---------|-------------------------------|
| src       | string | ""      | The file path.                |

### `<xrextras-pbr-material>`

Used to construct a PBR material.

**Attributes**

| Attribute | Type   | Default | Description           |
|-----------|--------|---------|-----------------------|
| tex       | string | ""      | Color map.            |
| metalness | string | ""      | Metalness map.        |
| normals   | string | ""      | Normal map.           |
| roughness | string | ""      | Roughness map.        |
| alpha     | string | ""      | Alpha map. Activates when opacity is set < 1.0. |
| opacity   | number | 1.0     | Overall opacity of material. |


### `<xrextras-basic-material>`

Used to construct a flat material.

**Attributes**

| Attribute | Type   | Default | Description           |
|-----------|--------|---------|-----------------------|
| tex       | string | ""      | Color map.            |
| alpha     | string | ""      | Alpha map. Activates when opacity is set < 1.0. |
| opacity   | number | 1.0     | Overall opacity of material. |


### `<xrextras-video-material>`

Used to construct a flat video material.

**Attributes**

| Attribute | Type   | Default | Description           |
|-----------|--------|---------|-----------------------|
| video     | string | ""      | <video> src id        |
| alpha     | string | ""      | Alpha map. Activates when opacity is set < 1.0. |
| autoplay  | bool   | true    | Autoplay on scene load. If true, <video> must have the muted attribute. |
| opacity   | number | 1.0     | Overall opacity of material. |


### `<xrextras-face-mesh>`

Generates a face mesh in your scene.

**Attributes**

| Attribute       | Type   | Default | Description                              |
|-----------------|--------|---------|------------------------------------------|
| material-resource | string | ""    | HTML Element ID of the xrextras material. |
| material        | -      | -       | Use this instead to set custom shaders or A-Frame material properties. |


### `<xrextras-face-attachment>`

Inherits the detected attachment point transforms. Entities inside will move with the assigned attachment point.

**Attributes**

| Attribute | Type   | Default   | Description      |
|-----------|--------|-----------|------------------|
| point     | string | "forehead" | Name of attachment point |


### `<xrextras-capture-button>`

Adds a capture button to the scene.

**Attributes**

| Attribute     | Type   | Default   | Description     |
|---------------|--------|-----------|-----------------|
| capture-mode  | string | "standard" | Sets the capture mode behavior. Possible values include standard: tap to take photo and tap + hold to record video, fixed: tap to toggle video recording, or photo: tap to take photo. |


### `<xrextras-capture-preview>`

Adds a media preview interface to the scene which allows for viewing, saving, and sharing captured media.

**Attributes**

| Attribute             | Type   | Default | Description     |
|-----------------------|--------|---------|-----------------|
| action-button-share-text | string | "Share" | Sets the text string in the action button when Web Share API 2 is available (iOS 14, Android). |
| action-button-view-text | string | "View"  | Sets the text string in the action button when Web Share API 2 is not available in iOS (iOS 13). |


### `<xrextras-capture-config>`

Configures the captured media.

**Attributes**

| Attribute          | Type   | Default | Description     |
|--------------------|--------|---------|-----------------|
| max-duration-ms    | int    | 15000   | Total video duration (in milliseconds) that the capture button allows. If the end card is disabled, this corresponds to max user record time. |
| max-dimension      | int    | 1280    | Maximum record dimension for both width and height. |
| enable-end-card    | bool   | true    | Whether the end card is included in the recorded media. |
| cover-image-url    | string | project cover image | Image source for end card image. |
| end-card-call-to-action | string | "Try it at:" | Sets the text string for call to action on the end card. |
| short-link         | string | project shortlink | Sets the text string for the end card shortlink. |
| footer-image-url   | string | Powered by 8th Wall image | Image source for end card footer image. |
| watermark-image-url | string | null    | Image source for watermark. |
| watermark-max-width | number | 20      | Max width (%) of watermark image. |
| watermark-max-height | number | 20      | Max height (%) of watermark image. |
| watermark-location | string | "bottomRight" | Location of watermark image. Options include topLeft, topMiddle, topRight, bottomLeft, bottomMiddle, or bottomRight. |
| file-name-prefix   | string | "my-capture-" | Sets the text string that prepends the unique timestamp on file name. |
| request-mic        | string | "auto"  | Determines if you want to set up the microphone during initialization (auto) or during runtime (manual). |
| include-scene-audio | bool  | true   | If true, the A-Frame sounds in the scene will be part of the recorder output. |


### `<xrextras-curved-target-container>`

Generates a series of curved meshes that form a portal-like container that 3D content can be placed inside. The effect works through a combination of "interior" geometry that is visible to the user and "hider" geometry that blocks rendering outside the interior's opening. The generated cylinder proportions match that of the uploaded target curvature.

**Attributes**

| Attribute | Type   | Default | Description           |
|-----------|--------|---------|-----------------------|
| color     | string | "#464766" | The color of the interior geometry. |
| height    | number | 1       | Scales the generated geometry height by this value. |
| width     | number | 1       | Scales the generated geometry width by this value. |


### `<xrextras-target-mesh>`

Generates a mesh that matches an image target's curvature properties. Easy way to create accurate 3D label geometry to use in your scene. You can use an A-Frame material to customize.

**Attributes**

| Attribute    | Type   | Default | Description           |
|--------------|--------|---------|-----------------------|
| material-resource (optional) | string | "" | HTML Element ID of the xrextras material. |
| target-geometry | string | "label" | Specify full or label geometry. |
| height       | number | 1       | Scales the generated geometry height by this value. |
| width        | number | 1       | Scales the generated geometry width by this value. |


### `<xrextras-target-video-fade>`

Automatically fades video in and begins playback (muted only).

**Attributes**

| Attribute | Type   | Default | Description           |
|-----------|--------|---------|-----------------------|
| video     | string | ""      | The id of the <video> element used for playback. |
| height    | number | 1       | Scales the generated geometry height by this value. |
| width     | number | 1       | Scales the generated geometry width by this value. |


### `<xrextras-target-video-sound>`

Displays a thumbnail image and waits for a tap to begin playback (for videos with sound).

**Attributes**

| Attribute | Type   | Default | Description           |
|-----------|--------|---------|-----------------------|
| video     | string | ""      | The id of the <video> element used for playback. |
| thumb (optional) | string | "" | The id of the <img> element to serve as a thumbnail. |
| height    | number | 1       | Scales the generated geometry height by this value. |
| width     | number | 1       | Scales the generated geometry width by this value. |
