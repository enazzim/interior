$ErrorActionPreference = "Stop"

Write-Host "=========================================================="
Write-Host "   Interior Project - Automation Harness Verification"
Write-Host "=========================================================="

# 1. 백엔드 테스트 및 가드레일 하네스 검증
Write-Host "`n[1/2] Running Backend Test & Guardrail Harness..."
Set-Location -Path ".\backend"
.\gradlew.bat test
if ($LASTEXITCODE -ne 0) {
    Write-Error "Backend Harness Check Failed!"
    exit $LASTEXITCODE
}
Set-Location -Path ".."

# 2. 프론트엔드 타입 & AI 가드레일 하네스 검증
Write-Host "`n[2/2] Verifying Frontend AI Harness TypeScript Types..."
Set-Location -Path ".\frontend"
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) {
    Write-Error "Frontend Harness Type Check Failed!"
    exit $LASTEXITCODE
}
Set-Location -Path ".."

Write-Host "`n=========================================================="
Write-Host "   ALL HARNESS CHECKS PASSED SUCCESSFULLY!"
Write-Host "=========================================================="
