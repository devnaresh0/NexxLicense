@echo off
setlocal EnableExtensions EnableDelayedExpansion
set "STARTED_BY=%~1"
if "%STARTED_BY%"=="" set "STARTED_BY=UNKNOWN"

:: Tomcat Auto Update + Restart Script (%NexxLicense%)
:: ZIP-based deploy with frontend (ROOT) + rollback
:: ---------------- CONFIGURATION ----------------

:: Get directory where this script lives (Tomcat\bin)
set "SCRIPT_DIR=%~dp0"
:: Go one level up → Tomcat root
for %%I in ("%SCRIPT_DIR%..") do set "TOMCAT_HOME=%%~fI"
set "APP_NAME=NexxLicense"
set "TOMCAT_PORT=9090"
set "UPDATE_DIR=%TOMCAT_HOME%\auto_update\downloads"
set "TEMP_DIR=%TOMCAT_HOME%\auto_update\temp_update"
set "LOG_FILE=%TOMCAT_HOME%\auto_update\update.log"
set UPDATE_ZIP=
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmmss"') do set "DTS=%%i"
set "BACKUP_DIR=%TOMCAT_HOME%\auto_update\backup\%DTS%"

:: ---------------- LOGGING FUNCTION -----------------
set STEP_NUMBER=0
goto :MAIN

:LOG_STEP
set /a STEP_NUMBER+=1

set "UTC_DATE="
set "UTC_TIME="

for /f "tokens=1,2 delims= " %%a in (
  'powershell -NoProfile -Command "(Get-Date).ToUniversalTime().ToString(\"yyyy-MM-dd HH.mm.ss\")"'
) do (
  set "UTC_DATE=%%a"
  set "UTC_TIME=%%b"
)

if not defined UTC_DATE set "UTC_DATE=UTC_UNAVAILABLE"
if not defined UTC_TIME set "UTC_TIME=UTC_UNAVAILABLE"

echo [STEP %STEP_NUMBER%] %~1 - Date %UTC_DATE% Time %UTC_TIME% UTC >> "%LOG_FILE%"
echo [STEP %STEP_NUMBER%] %~1
goto :eof

:MAIN
:: Ensure logs directory exists
if not exist "%TOMCAT_HOME%\logs" mkdir "%TOMCAT_HOME%\logs"
if not exist "%TOMCAT_HOME%\auto_update" mkdir "%TOMCAT_HOME%\auto_update"

:: -------- RESET LOG FILE FOR THIS RUN --------
if exist "%LOG_FILE%" del "%LOG_FILE%"

call :LOG_STEP "Update started by %STARTED_BY%"

:: ---------------- [1] FIND ZIP ----------------
call :LOG_STEP "Locating update ZIP"
for /f "delims=" %%f in ('dir "%UPDATE_DIR%\V_*.zip" /b /o-d 2^>nul') do (
    set "UPDATE_ZIP=%UPDATE_DIR%\%%f"
    goto ZIP_FOUND
)

:ZIP_FOUND
if "%UPDATE_ZIP%"=="" (
    call :LOG_STEP "ERROR: No update ZIP found"
    exit /b 1
)

call :LOG_STEP "Using update ZIP: %UPDATE_ZIP%"

:: ---------------- [2] STOP TOMCAT ----------------
call :LOG_STEP "Stopping Tomcat"
set "CATALINA_HOME=%TOMCAT_HOME%"
call "%CATALINA_HOME%\bin\shutdown.bat" >> "%LOG_FILE%" 2>&1
echo Waiting 10 seconds for Tomcat to stop...
timeout /t 5 /nobreak >nul

:: ---------------- [3] BACKUP ----------------
call :LOG_STEP "Backing up existing deployment"
mkdir "%BACKUP_DIR%" >nul 2>&1

if exist "%TOMCAT_HOME%\webapps\%APP_NAME%.war" (
    copy "%TOMCAT_HOME%\webapps\%APP_NAME%.war" "%BACKUP_DIR%" >nul
    call :LOG_STEP "Backed up %APP_NAME%.war"
)

if exist "%TOMCAT_HOME%\webapps\%APP_NAME%" (
    xcopy "%TOMCAT_HOME%\webapps\%APP_NAME%" "%BACKUP_DIR%\%APP_NAME%\" /E /I /H /Y >nul
    call :LOG_STEP "Backed up %APP_NAME% folder"
)

if exist "%TOMCAT_HOME%\webapps\ROOT" (
    xcopy "%TOMCAT_HOME%\webapps\ROOT" "%BACKUP_DIR%\ROOT\" /E /I /H /Y >nul
    call :LOG_STEP "Backed up ROOT folder"
)

call :LOG_STEP "Backup completed"

:: ---------------- [4] EXTRACT ZIP ----------------
call :LOG_STEP "Extracting ZIP"
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%"
mkdir "%TEMP_DIR%"

powershell -Command "Expand-Archive -Path '%UPDATE_ZIP%' -DestinationPath '%TEMP_DIR%' -Force"

if errorlevel 1 (
    call :LOG_STEP "ERROR: ZIP extraction failed"
    exit /b 1
)

if not exist "%TEMP_DIR%\%APP_NAME%.war" (
    call :LOG_STEP "ERROR: %APP_NAME%.war missing"
    exit /b 1
)

if not exist "%TEMP_DIR%\ROOT" (
    call :LOG_STEP "ERROR: ROOT folder missing"
    exit /b 1
)

call :LOG_STEP "ZIP extracted successfully"

:: ---------------- [5] DEPLOY ----------------
call :LOG_STEP "Deploying new version"

if exist "%TOMCAT_HOME%\webapps\%APP_NAME%" rmdir /s /q "%TOMCAT_HOME%\webapps\%APP_NAME%"
if exist "%TOMCAT_HOME%\webapps\%APP_NAME%.war" del "%TOMCAT_HOME%\webapps\%APP_NAME%.war"
if exist "%TOMCAT_HOME%\webapps\ROOT" rmdir /s /q "%TOMCAT_HOME%\webapps\ROOT"

copy "%TEMP_DIR%\%APP_NAME%.war" "%TOMCAT_HOME%\webapps\%APP_NAME%.war" >nul
xcopy "%TEMP_DIR%\ROOT" "%TOMCAT_HOME%\webapps\ROOT\" /E /I /H /Y >nul

call :LOG_STEP "New WAR and ROOT deployed"

:: ---------------- [6] START TOMCAT ----------------
call :LOG_STEP "Starting Tomcat"
start "Tomcat Server" cmd /k "%CATALINA_HOME%\bin\startup.bat"
echo Waiting 30 seconds for Tomcat to start...
timeout /t 25 /nobreak >nul

:: ---------------- [7] HEALTH CHECK ----------------
call :LOG_STEP "Performing health check"

set "HEALTH_RESULT=FAIL"
set "HEALTH_URL=http://localhost:%TOMCAT_PORT%/%APP_NAME%/api/health"

echo Hitting URL: %HEALTH_URL%

:: Call health endpoint and capture response headers
curl -s -D "%TEMP%\health_headers.txt" -o nul ^
%HEALTH_URL%

:: Extract HTTP status line (e.g. HTTP/1.1 200 OK)
findstr /R "^HTTP/" "%TEMP%\health_headers.txt" > "%TEMP%\health_status.txt"
set /p STATUS_LINE=<"%TEMP%\health_status.txt"

del "%TEMP%\health_headers.txt"
del "%TEMP%\health_status.txt"

echo Status line = [%STATUS_LINE%]

:: Check for HTTP 200
echo %STATUS_LINE% | findstr "200" >nul && set "HEALTH_RESULT=OK"

echo Health result = [%HEALTH_RESULT%]

if /I "%HEALTH_RESULT%" NEQ "OK" (
    call :LOG_STEP "Health check FAILED"
    goto ROLLBACK
)

call :LOG_STEP "Health check PASSED Tomcat started Successfully"
goto :EOF

:: ---------------- ROLLBACK ----------------
:ROLLBACK
call :LOG_STEP "ROLLBACK initiated"
echo HEALTH CHECK FAILED! Starting rollback...

taskkill /F /IM java.exe /T >nul 2>&1
timeout /t 5 >nul

if exist "%TOMCAT_HOME%\webapps\%APP_NAME%" rmdir /s /q "%TOMCAT_HOME%\webapps\%APP_NAME%"
if exist "%TOMCAT_HOME%\webapps\%APP_NAME%.war" del "%TOMCAT_HOME%\webapps\%APP_NAME%.war"
if exist "%TOMCAT_HOME%\webapps\ROOT" rmdir /s /q "%TOMCAT_HOME%\webapps\ROOT"

if exist "%BACKUP_DIR%\%APP_NAME%.war" (
    copy "%BACKUP_DIR%\%APP_NAME%.war" "%TOMCAT_HOME%\webapps\" >nul
    call :LOG_STEP "Restored %APP_NAME%.war from backup"
)
if exist "%BACKUP_DIR%\%APP_NAME%" (
    xcopy "%BACKUP_DIR%\%APP_NAME%" "%TOMCAT_HOME%\webapps\%APP_NAME%\" /E /I /H /Y >nul
    call :LOG_STEP "Restored %APP_NAME% folder from backup"
)
if exist "%BACKUP_DIR%\ROOT" (
    xcopy "%BACKUP_DIR%\ROOT" "%TOMCAT_HOME%\webapps\ROOT\" /E /I /H /Y >nul
    call :LOG_STEP "Restored ROOT folder from backup"
)

start "Tomcat Server" cmd /k "%CATALINA_HOME%\bin\startup.bat"

call :LOG_STEP "Rollback completed"

echo Previous version has been restored.
echo Check log file: %LOG_FILE%
pause
exit /b 1
