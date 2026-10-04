@echo off
setlocal EnableExtensions
title EVER FLAME LOGISTICS Local Preview

set "SERVER_SCRIPT=%~dp0server\preview-server.ps1"
set "ERROR_LOG=%~dp0startup-error.log"

if not exist "%SERVER_SCRIPT%" (
  echo ERROR: The preview server script is missing.
  echo Expected file: "%SERVER_SCRIPT%"
  echo Extract the complete ZIP package before running this launcher.
  pause
  exit /b 2
)

if exist "%ERROR_LOG%" del /q "%ERROR_LOG%" >nul 2>nul

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%SERVER_SCRIPT%" %* 2>"%ERROR_LOG%"
set "EXIT_CODE=%ERRORLEVEL%"

if not "%EXIT_CODE%"=="0" (
  echo.
  echo ERROR: The local preview failed with exit code %EXIT_CODE%.
  if exist "%ERROR_LOG%" (
    echo.
    echo Error details:
    type "%ERROR_LOG%"
  )
  echo.
  echo Send startup-error.log to the project provider if you need help.
  pause
)

if "%EXIT_CODE%"=="0" if exist "%ERROR_LOG%" del /q "%ERROR_LOG%" >nul 2>nul
exit /b %EXIT_CODE%
