import React from 'react'

import {AFrameScene} from '../lib/aframe-components'
import html from './cube.html'

const Scene = () => (
  <AFrameScene sceneHtml={html} />
)

export {Scene}
