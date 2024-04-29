Use the VPS Blank Project to bootstrap VPS development. Building location-based AR can be done in three simple steps:

1. Add a test scan or a public VPS Location to the project via the Geospatial Browser (https://www.8thwall.com/docs/web/#managing-wayspots)
2. Copy the `name` of the project VPS Location and replace `my-location` with the name of the project VPS Location on line 48 of `index.html` (the `named-location` `name` parameter)
3. Download the selected mesh as a glb from the Geospatial Browser, upload to the project and set the `src` of the `vps-mesh` asset (line 39 of `index.html`) to a relative path to the glb

If you use the A-Frame inspector to build your bespoke experience, you can speed up development by adding the `desktop-development` component to the `<a-scene>`. The `desktop-development` component automatically removes all 8th Wall components predefined in the scene, removes the occluder material, and optionally opens the A-Frame inspector. You can even test at the real world location on your mobile device without changing a single line of code.

To test localization, you can render the scanned mesh over the real-world location. Simply remove (or add a z to the beginning of) the `hider-material` component on line 50 of `index.html`.

To add content or animations placed relative to the mesh in 3D modeling software, simply upload the model and update the `vps-anim` `src` path on line 41 of `index.html`