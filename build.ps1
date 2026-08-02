$ErrorActionPreference = "Stop"

Write-Host "============================================="
Write-Host "   Interior ERP - Standalone Build Script"
Write-Host "============================================="

# 1. 백엔드 빌드 (Spring Boot JAR 생성)
Write-Host "`n[1/3] Building Backend (Spring Boot)..."
Set-Location -Path ".\backend"
.\gradlew.bat clean bootJar
if ($LASTEXITCODE -ne 0) {
    Write-Error "Backend build failed."
    exit $LASTEXITCODE
}
Set-Location -Path ".."

# 2. 프론트엔드 종속성 설치
Write-Host "`n[2/3] Installing Frontend Dependencies..."
Set-Location -Path ".\frontend"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Error "npm install failed."
    exit $LASTEXITCODE
}

# 3. 프론트엔드 및 Electron 패키징 (dist)
Write-Host "`n[3/3] Building and Packaging Electron App..."
# package.json에 정의된 dist 스크립트 실행 (vite build && electron-builder)
npm run dist
if ($LASTEXITCODE -ne 0) {
    Write-Error "npm run dist failed."
    exit $LASTEXITCODE
}

Write-Host "`n============================================="
Write-Host "   Build Completed Successfully!"
Write-Host "   Check frontend/dist/installers/ for .exe"
Write-Host "============================================="
Set-Location -Path ".."
