import Auth from '@aws-amplify/auth';
import Amplify from 'aws-amplify';
import awsconfig from './aws-exports';
import aws_exports from './aws-exports';

import { XR as AwsXR } from 'aws-amplify';
import scene1Config from './sumerian-exports';

Amplify.configure(aws_exports);

Auth.configure(awsconfig);

AwsXR.configure({
  SumerianProvider: {
    region: 'YOUR_AWS_REGION', // Sumerian region
    scenes: {
      "scene1": { // Friendly scene name
        sceneConfig: scene1Config // Scene configuration from Sumerian publish
      }
    },
  }
});

async function loadAndStartScene() {
  await AwsXR.loadScene("scene1", "sumerian-scene-dom-id")

  const sceneController = AwsXR.getSceneController('scene1')
  window.sceneController = sceneController
  const world = AwsXR.getSceneController('scene1').sumerianRunner.world
  window.sumerian.SystemBus.addListener('xrready', () => {
    // Both Sumerian scene and camera have loaded. Dismiss loading screen.
    const loadBackground = document.getElementById('loadBackground')
    loadBackground.classList.add('fade-out')
    setTimeout(function () {
      return loadBackground && loadBackground.parentNode && loadBackground.parentNode.removeChild(loadBackground);
    }, 1000);
  })
  window.sumerian.SystemBus.addListener('xrerror', (params) => {
    // Dismiss loading screen and display error
  })
  window.XR.Sumerian.addXRWebSystem(world)

  const handleClickEvent = (e) => {
    if (!e.touches || e.touches.length < 2) {
      return;
    }
    if (e.touches.length == 2) {
      window.sumerian.SystemBus.emit('recenter')
    }
  }

  const sumerianContainer = document.getElementById('sumerian-app')
  if (sumerianContainer) {
    sumerianContainer.addEventListener('touchstart', handleClickEvent, true)
  }

  AwsXR.start("scene1")
}

loadAndStartScene();
