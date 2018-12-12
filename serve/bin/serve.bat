@echo OFF
setlocal

SET SCRIPT_NAME="%0"
FOR %%F in (%SCRIPT_NAME%) DO SET DIRNAME=%%~dpF
SET DIRNAME=%DIRNAME%..

SET USE_LOCALHOST=false
SET NO_RELOAD=true
SET PRINT_INSTRUCTIONS=true

:GETOPTS
  IF "%1" == "-d" (SET SERVE="%~dpnx2" & SHIFT
  ) ELSE IF "%1" == "-p" (SET PORT=%2 & SHIFT
  ) ELSE IF "%1" == "-h" (SET USE_LOCALHOST=true
  ) ELSE IF "%1" == "-r" (SET NO_RELOAD=false
  ) ELSE IF "%1" == "-n" (SET PRINT_INSTRUCTIONS=false
  ) ELSE IF "%1" == "-i" (SET NET_IFACE=%2 & SHIFT
  ) ELSE IF NOT "%1" == "" (SET PRINT_INSTRUCTIONS=true & ECHO UNKNOWN FLAG: %1
  )
  SHIFT
IF NOT "%1" == "" GOTO :GETOPTS 

IF %PRINT_INSTRUCTIONS% == true (
    CALL :instructions
)

cd %DIRNAME%
node src\index.js %SERVE%

EXIT /B %ERRORLEVEL%

:instructions
  echo 8888888888888888888888888888888888888888888888888888888888888888
  echo 8
  echo 8  %SCRIPT_NAME% [options]
  echo 8  -d DIR    path to serve [required]
  echo 8  -p PORT   default PORT=8080
  echo 8  -h        hot reload on localhost
  echo 8  -r        enable hot reload
  echo 8  -i IFACE  choose network interface
  echo 8  -n        don't print these instructions
  echo 8
  echo 8888888888888888888888888888888888888888888888888888888888888888
  echo
  EXIT /B 1
