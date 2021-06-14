/* globals AFRAME */

AFRAME.registerComponent('artgalleryframe', {
  schema: {
    name: {type: 'string'},
    rotated: {type: 'bool'},
    metadata: {type: 'string'},
  },
  init() {
    const contents = document.getElementById('contents')
    const container = document.getElementById('container')

    const {object3D, sceneEl} = this.el

    // Hide the image target until it is found
    object3D.visible = false

    // Metadata comes to the primitive as a string, so we parse and destructure it
    const {artist, date, title, wikiTitle} = JSON.parse(this.data.metadata)

    const frameEl = document.createElement('a-entity')
    frameEl.setAttribute('scale', '0.95 0.95 0.95')
    frameEl.setAttribute('gltf-model', '#frame-model')
    if (this.data.rotated) {
      // Rotate the frame for a landscape target
      frameEl.setAttribute('rotation', '0 0 90')
    }
    this.el.appendChild(frameEl)

    // Instantiate the element with information about the painting
    const infoDisplay = document.createElement('a-entity')
    infoDisplay.setAttribute('info-display', {title, artist, date})
    infoDisplay.object3D.position.set(0, this.data.rotated ? -0.4 : -0.5, 0.1)
    this.el.appendChild(infoDisplay)

    // Use the title of the painting to fetch some info from the Wikipedia API
    // If a painting doesn't have a Wikipedia article of its own, we use the painter's article via
    // wikiTitle
    const apiUrl = 'https://en.wikipedia.org/w/api.php?action=query' +
      `&titles=${wikiTitle || title}&format=json&prop=extracts&exintro=1&origin=*`
    let pageContent
    fetch(apiUrl, {mode: 'cors'})
      .then(e => e.json())
      .then((data) => {
        const page = Object.entries(data.query.pages)[0][1]
        pageContent = `<h1>${page.title}</h1>${page.extract}`
      })

    const tapTarget = document.createElement('a-box')
    // Image targets are 3:4 so the target is scaled to match
    tapTarget.setAttribute('scale', '0.75 1 0.1')
    tapTarget.setAttribute('material', 'opacity: 0; transparent:true')
    if (this.data.rotated) {
      // Rotate the tap target for a landscape target
      tapTarget.setAttribute('rotation', '0 0 90')
    }
    this.el.appendChild(tapTarget)

    tapTarget.addEventListener('click', (e) => {
      // Set the innerHTML of our UI element to the data returned by the API
      contents.innerHTML = pageContent
      // Removing the collapsed class from container triggers a CSS transition to show the content
      container.classList.remove('collapsed')
    })

    // showImage handles displaying and moving the virtual object to match the image
    const showImage = ({detail}) => {
      // Updating position/rotation/scale using object3D is more performant than setAttribute
      object3D.position.copy(detail.position)
      object3D.quaternion.copy(detail.rotation)
      object3D.scale.set(detail.scale, detail.scale, detail.scale)
      object3D.visible = true
      // Add tapTarget as a clickable object
      tapTarget.classList.add('cantap')
    }

    // hideImage handles hiding the virtual object when the image target is lost
    const hideImage = () => {
      object3D.visible = false
      // Remove tapTarget from clickable objects
      tapTarget.classList.remove('cantap')
    }

    // These events are routed and dispatched by xrextras-generate-image-targets
    this.el.addEventListener('xrimagefound', showImage)
    this.el.addEventListener('xrimageupdated', showImage)
    this.el.addEventListener('xrimagelost', hideImage)
  },
})

// This component uses the A-Frame text component to display information about a painting
AFRAME.registerComponent('info-display', {
  schema: {
    title: {default: ''},
    artist: {default: ''},
    date: {default: ''},
  },
  init() {
    // Limit title to 20 characters
    const displayTitle =
      this.data.title.length > 20 ? `${this.data.title.substring(0, 17)}...` : this.data.title
    const text = `${displayTitle}\n${this.data.artist}, ${this.data.date}`
    const textData = {
      align: 'left',
      width: 0.7,
      wrapCount: 22,
      value: text,
      color: 'white',
    }

    this.el.setAttribute('text', textData)

    // Instantiate a second text object behind the first to achieve an shadow effect
    const textShadowEl = document.createElement('a-entity')
    textData.color = 'black'
    textShadowEl.setAttribute('text', textData)
    textShadowEl.object3D.position.z = -0.01
    this.el.appendChild(textShadowEl)
  },
})

// xrextras-generate-image-targets uses this primitive to populate multiple image targets
AFRAME.registerPrimitive('artgallery-frame', {
  defaultComponents: {
    artgalleryframe: {},
  },

  mappings: {
    name: 'artgalleryframe.name',
    rotated: 'artgalleryframe.rotated',
    metadata: 'artgalleryframe.metadata',
  },
})
