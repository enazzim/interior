@echo off
echo ==========================================================
echo [Interior ERP] Dev Starter (Backend + Frontend)
echo ==========================================================

echo.
echo Cleaning up existing Java and Electron processes...
taskkill /F /IM java.exe /T 2>nul
taskkill /F /IM electron.exe /T 2>nul

echo.
echo Step 1: Building Backend (BootJar compile)...
cd backend
call .\gradlew.bat bootJar -x test
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Backend build failed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Step 2: Launching Backend Server in background...
start "Interior-ERP-Backend" java -jar build/libs/backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod

echo.
echo Step 3: Navigating to Frontend...
cd ../frontend

echo Checking/Installing dependencies...
if not exist node_modules (
    call npm install
)

echo.
echo Step 4: Launching Vite Dev Server...
start "Interior-ERP-Vite-Dev" npm run dev

echo.
echo Step 5: Launching Electron application...
timeout /t 3 >nul
call npm run electron

echo.
echo All processes launched successfully!
pause
