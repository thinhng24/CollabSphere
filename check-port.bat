@echo off
echo === Port 5000 Usage Check ===
echo.

echo Checking what is using port 5000...
netstat -ano | findstr :5000
echo.

echo Process details:
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') DO (
    echo PID: %%P
    tasklist /FI "PID eq %%P" /FO TABLE
)
echo.

echo === Options ===
echo.
echo To kill the process:
echo   1. Note the PID from above
echo   2. Run: taskkill /PID [PID] /F
echo.
echo Or to change CollabSphere to use a different port:
echo   Edit docker-compose.yml and change "5000:8080" to "5001:8080"
echo.

set /p kill="Do you want to kill the process using port 5000? (Y/N): "
if /I "%kill%"=="Y" (
    echo.
    FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') DO (
        echo Killing process %%P...
        taskkill /PID %%P /F
    )
    echo.
    echo Port 5000 should now be free. Try starting services again:
    echo   docker compose up -d
) else (
    echo.
    echo No processes killed. Choose one of these options:
    echo   1. Manually kill the process
    echo   2. Change the port in docker-compose.yml
)
echo.
pause
