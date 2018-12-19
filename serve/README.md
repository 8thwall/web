# Serving Web Apps locally

Serving web app locally from your computer can be tricky as browsers require HTTPS certificates to access the camera on your phone through a browser.  As a convenience, 8th Wall has provided a "serve" script that will run a local https webserver on your development computer.

## Serving locally from Mac

1. Install Node.js and npm

If you don't already have Node.js and npm installed, get it here: https://www.npmjs.com/get-npm

2. Open a terminal window (Terminal.app, iTerm2, etc):

```
# cd <to_this_serve_directory>
# npm install
# cd ..
# ./serve/bin/serve -d <sample_project_location>
```

Example:
```
./serve/bin/serve -n -d gettingstarted/xraframe/ -p 7777
```

**IMPORTANT**: To connect to this local webserver, make sure to copy the **entire** "Listening" URL into your browser, including both the "**https://**" at the beginning and **port** number at the end.

**NOTE**: If the serve script states it's listening on **127.0.0.1**:<port\> (which is the loopback device aka "localhost") your mobile phone won't be able to connect to that IP address directly.  Please re-run the `serve` script with the `-i` flag to specify the network interface the serve script should listen on.

Example - specify network interface:
```
./serve/bin/serve -d gettingstarted/xraframe/ -p 7777 -i en0
```

## Serving locally From Windows

1. Install Node.js and npm

If you don't already have Node.js and npm installed, get it here: https://www.npmjs.com/get-npm

2. Open a Command Prompt (cmd.exe)

```
# cd <to_this_serve_directory>
# npm install
# cd ..
# serve\bin\serve.bat -d <sample_project_dir>
```

Example:
```
serve\bin\serve.bat -n -d gettingstarted\xraframe -p 7777
```
**IMPORTANT**: To connect to this local webserver, make sure to copy the **entire** "Listening" URL into your browser, including both the "**https://**" at the beginning and **port** number at the end.

**NOTE**: If the serve script states it's listening on **127.0.0.1**:<port\> (which is the loopback device aka "localhost") your mobile phone won't be able to connect to that IP address directly.  Please re-run the `serve` script with the `-i` flag to specify the network interface the serve script should listen on.

Example - specify network interface:
```
serve\bin\serve.bat -d gettingstarted\xraframe -p 7777 -i WiFi
```
