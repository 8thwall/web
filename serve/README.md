# Serving Web Apps locally

## Serving locally from Mac

Serving web app locally from your computer can be tricky as browsers require HTTPS certificates to access the camera on your phone through a browser.  As a convenience, 8th Wall has provided a "serve" script that will run a local https webserver on your development computer.

1. Install Node.js and npm

If you don't already have Node.js and npm installed, get it here: https://www.npmjs.com/get-npm

2. Open a terminal window (Terminal.app, iTerm2, etc):

```
# cd <to_this_serve_directory>
# npm install
# cd ..
# ./serve/bin/serve -d <sample_project_dir>
```

Example:
```
./serve/bin/serve -n -d xr3js -p 7777
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
serve\bin\serve.bat -n -d xr3js -p 7777
```
