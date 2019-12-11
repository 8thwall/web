# Amazon Sumerian with 8th Wall Web
### tl;dr
While Amazon Sumerian provides you with the tools to create immersive 3D experiences, it does not provide creative control over the web page that is hosting these experiences. In order do something like, say, customize your loading screen, you’re required to use Sumerian with AWS Amplify. AWS Amplify is a tool that allows developers to create web apps and provides APIs to several AWS Services (like Sumerian!).

With that said, we’ve made it as simple as adding a few lines of JavaScript to your Amplify app to AR-ify your Sumerian scene.

*Before:*
```javascript
async function loadAndStartScene() {
  await AwsXR.loadScene("scene1", "sumerian-scene-dom-id")
  AwsXR.start("scene1")
}
```

*After:*
```javascript
async function loadAndStartScene() {
  await AwsXR.loadScene("scene1", "sumerian-scene-dom-id")

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
  window.XR8.Sumerian.addXRWebSystem(world)
  AwsXR.start("scene1")
}
```

## Setting up Development Environment
Sign up for an Amazon [AWS Account](https://portal.aws.amazon.com/billing/signup?redirect_url=https%3A%2F%2Faws.amazon.com%2Fregistration-confirmation#/start). Both AWS Amplify and Sumerian require this.

Install [Node.js](https://nodejs.org/en/download/) and [npm](https://www.npmjs.com/get-npm).
Make sure you are running Node.js version 8.11+ or greater, and npm version 5.x or greater. This can be checked by running the following in your termnial:
```
$ node -v
$ npm -v
```

Install and configure the amplify command-line interface:
```
$ npm install -g @aws-amplify/cli
$ amplify configure
```

*Note: You may be asked to create a new user here. That is not necessary. Instead, enter the Access Key Id and Secret Access Key for your own AWS user. This can be found by navigating to the [IAM Users](https://console.aws.amazon.com/iam/home#/users) page and selecting the User you wish to use, then clicking the Security credentials tab.*

## Setting up a Sumerian Scene

Download this example project.

Log onto AWS and navigate to the Sumerian console.
Create a new scene from from the default AR template.
Delete all entites, cameras, lights, etc. from your scene. It should be completely empty.

*Note: You may get an error that the camera cannot be deleted. If so, rename to "Delete me".*

Click `Import Assets` at the top of the page.
Drag in the `xrsumerian-scene.zip` file contained in this repo.
Click the `AR Camera` entity in your scene.
On the right pane, there should be a `Camera` category. Check the `Main Camera` option on it.
If you previously renamed a camera "Delete me", then delete that camera from the scene.

Next, open up `src/app.js`. Edit `YOUR_AWS_REGION` to be the AWS region in which you created your Sumerian scene.

## Publishing a Sumerian Scene
Within the Sumerian scene, you should see a `Publish` button on the top right.
Click the `Publish` button, then click `Host Privately`, then `Publish`.
Copy the JSON provided in the drop down that appeared.
Create a new file under your repository's `xrsumerian/src/` folder called `sumerian-exports.json`. Paste the copied JSON there.

## Creating and Setting up an Amazon Amplify App
Now that a Sumerian scene has been created and published, let's get an Ampliy project setup to host it!

First, make sure you are back in the root directory of your `xrsumerian` project.
```
$ pwd
/path_to_repo/xrsumerian
 ```

Then run the following to setup download the necessary Node dependencies and setp Amplify:
```shell
$ npm install
$ npm install --save aws-amplify
$ amplify init
```
`amplify init` will prompt you to select options several times. Select your editor of choice, then use the defaults for the rest.

*Note: You may be asked to create a new user here. That is not necessary. Instead, enter the Access Key Id and Secret Access Key for your own AWS user. This can be found by navigating to the [IAM Users](https://console.aws.amazon.com/iam/home#/users) page and selecting the User you wish to use, then clicking the Security credentials tab.*

![alt text](https://i.imgur.com/6NlUPiz.png)

Next, run:
```shell
$ amplify add auth
$ amplify push
```

Use the defaults again when prompted by `amplify add auth`.

![alt text](https://i.imgur.com/L2wdBtP.png)

## Granting Sumerian Access to AWS Services
### Adding Access for Unauthenticated Identities to an Identity Pool
1) Open up `src/aws-exports.json`. Take note of your `aws_project_region` and `aws_cognito_identity_pool_id` for the next step.
2) Navigate to:
```url
https://{aws_project_region}.console.aws.amazon.com/cognito/pool/?region={aws_project_region}&id={aws_cognito_identity_pool_id}
```
3) Click Edit Identity pool.
4) Expand Unauthenticated Identities and ensure the checkbox is enabled.
5) Ensure that the Unauthenticated role and the Authenticated role matches the names of the UnauthRoleName and AuthRoleName in your `.amplifyrc` file.
6) Copy the identity pool id.
7) Navigate to your Sumerian scene editor.
8) Click on the root element in your scene on the left sidebar (it should be the name of your scene).
9) On the right sidebar, click `AWS Configuration`.
10) Paste the identity pool id you copied earlier into the `Congnito Identity Pool ID` section.

### Adding Permissions to an Identity Pool Role
Navigate to the [Roles page](https://console.aws.amazon.com/iam/home#/roles) in the AWS IAM console. Locate the Roles that have been created for your project. They should look something like
```
  {project-name}-{time-created}-authRole
  {project-name}-{time-created}-unauthRole
```

For both of these, do the following:
1) Click on the role to view the current Permission policies added to this role.
2) Click `Attach policies`.
3) Search for “sumerian”.
4) Click the checkbox for `AmazonSumerianFullAccess`.
5) Click `Attach policy` at the bottom of the page.

## Integrating 8th Wall Web
### Creating an 8th Wall Web App
1) Navigate to the [8th Wall Console](https://console.8thwall.com/).
2) On the left pane, click `Web Apps`.
3) Click `+ Create a new Web App`.
4) Enter a name for the application you'd like to create and click `Create`.
5) Click the `Edit` button on the newly created app.
6) Copy the `appKey` value displayed in the script tag at the top of the page.
7) Navigate to the `xrsumerian/index.html` file in your project.
8) Paste in the app key in the 8th Wall Web script tag.

## Testing your App
From the `xrsumerian` directory, run the following command:
### MacOS
```
$ npm start
```
### Windows
```
$ npm run start-windows
```

You should now see your application hosted on `https://{local_ip}:8080`.
Scanning theh QR code on the console from your mobile device will take you to this address.
Both the mobile device and the computer serving thhe demo application must be on the same network.
