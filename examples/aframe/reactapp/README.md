# AFrame - React

## Getting started

In a terminal, clone this repository and `cd` to this directory.

Run `npm install && npm start` to install dependencies and launch the web app.

Create a self-hosted project in the 8th Wall console. Add `localhost` and the web app IP address as connected domains. Add the project app key from project settings to the `xrweb` script in `public/index.html`.

Happy hacking!

## Note

The `start` script has been modified to serve via https (required for browsers to draw the camera feed). Optionally, [create a SSL certificate](https://www.freecodecamp.org/news/how-to-set-up-https-locally-with-create-react-app/) to remove the security warning.

The `start`, `build`, and `test` scripts has been modified to use [react-app-rewired](https://github.com/timarney/react-app-rewired) so that we can add `html-loader` to the default webpack config via `config-overrides.js`.

In order to use the [serve script](https://github.com/8thwall/web/tree/master/serve) for testing the production build, you need to run `export NODE_OPTIONS=--openssl-legacy-provider`, and execute the serve script on the build folder.

## Learn More

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

To learn 8th Wall, check out the [8th Wall documentation](https://www.8thwall.com/docs/web/)