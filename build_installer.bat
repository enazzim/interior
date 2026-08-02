@echo off
echo ==========================================================
echo [Interior ERP] Release Setup Installer Packaging Tool
echo ==========================================================

echo.
echo Step 1: Compiling Backend BootJar...
cd backend
call .\gradlew.bat bootJar -x test
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Backend compilation failed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Step 2: Navigating to Frontend...
cd ../frontend

echo Checking/Installing dependencies...
if not exist node_modules (
    call npm install
)

echo.
echo Step 3: Compiling installer wizard (Setup.exe)...
set "PATH=c:\Users\enazz\OneDrive\Desktop\Interior\frontend\mock_bin;%PATH%"
set CSC_IDENTITY_AUTO_DISCOVERY=false
set CSC_NEVER_SIGN=true

call npm run dist
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Installer packaging failed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ==========================================================
echo [SUCCESS] Packaging completed successfully!
echo Setup file: frontend\dist\installers\InteriorERP Setup 0.0.0.exe
echo ==========================================================
pause
