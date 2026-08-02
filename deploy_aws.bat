@echo off
rem Set AWS Credentials via environment variables or uncomment below:
rem set AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY
rem set AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_KEY
set AWS_DEFAULT_REGION=ap-northeast-2

echo ==========================================================
echo [Interior ERP] AWS Deployment Package ^& S3 Upload Tool
echo ==========================================================

echo.
echo Step 1: Compiling Backend (BootJar)...
cd backend
call .\gradlew.bat bootJar -x test
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Backend compilation failed.
    pause
    exit /b %ERRORLEVEL%
)
cd ..

echo.
echo Step 2: Compiling Frontend (Web Target)...
cd frontend
set VITE_DEPLOY_TARGET=web
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Frontend compilation failed.
    pause
    exit /b %ERRORLEVEL%
)
cd ..

echo.
echo #!/bin/bash > deploy_ec2.sh
echo echo "=== EC2 DEPLOYMENT START ===" >> deploy_ec2.sh
echo if [ -f /etc/nginx/conf.d/gimcheon.conf ]; then >> deploy_ec2.sh
echo     sudo tee /etc/nginx/conf.d/gimcheon.conf ^> /dev/null ^<^< 'EOF' >> deploy_ec2.sh
echo server { >> deploy_ec2.sh
echo     listen 80; >> deploy_ec2.sh
echo     server_name _; >> deploy_ec2.sh
echo     rewrite ^^/interior$ /interior/ permanent; >> deploy_ec2.sh
echo     location /interior { >> deploy_ec2.sh
echo         root /usr/share/nginx/html; >> deploy_ec2.sh
echo         try_files $uri $uri/ /interior/index.html; >> deploy_ec2.sh
echo     } >> deploy_ec2.sh
echo     location /api/ { >> deploy_ec2.sh
echo         proxy_pass http://127.0.0.1:8080/api/; >> deploy_ec2.sh
echo         proxy_set_header Host $host; >> deploy_ec2.sh
echo         proxy_set_header X-Real-IP $remote_addr; >> deploy_ec2.sh
echo         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; >> deploy_ec2.sh
echo         proxy_set_header X-Forwarded-Proto $scheme; >> deploy_ec2.sh
echo     } >> deploy_ec2.sh
echo     location / { >> deploy_ec2.sh
echo         root /opt/gimcheon/frontend; >> deploy_ec2.sh
echo         try_files $uri $uri/ /index.html; >> deploy_ec2.sh
echo     } >> deploy_ec2.sh
echo } >> deploy_ec2.sh
echo EOF>> deploy_ec2.sh
echo fi >> deploy_ec2.sh
echo mkdir -p ./temp_interior >> deploy_ec2.sh
echo aws s3 sync s3://interior-deploy/interior/ ./temp_interior/ --delete >> deploy_ec2.sh
echo sudo mkdir -p /usr/share/nginx/html/interior >> deploy_ec2.sh
echo sudo cp -rf ./temp_interior/* /usr/share/nginx/html/interior/ >> deploy_ec2.sh
echo rm -rf ./temp_interior >> deploy_ec2.sh
echo aws s3 cp s3://interior-deploy/backend-interior-0.0.1-SNAPSHOT.jar . >> deploy_ec2.sh
echo sudo kill -9 $(pgrep -f backend-interior) 2^>/dev/null ^|^| true >> deploy_ec2.sh
echo nohup java -jar -Dspring.profiles.active=prod,web backend-interior-0.0.1-SNAPSHOT.jar ^> app.log 2^>^&1 ^& >> deploy_ec2.sh
echo sleep 3 >> deploy_ec2.sh
echo disown >> deploy_ec2.sh
echo sudo systemctl restart nginx >> deploy_ec2.sh
echo echo "=== EC2 DEPLOYMENT COMPLETED SUCCESSFULLY ===" >> deploy_ec2.sh

echo.
echo Step 4: Uploading builds to AWS S3 (interior-deploy)...
echo Uploading backend jar file...
call aws s3 cp backend/build/libs/backend-interior-0.0.1-SNAPSHOT.jar s3://interior-deploy/backend-interior-0.0.1-SNAPSHOT.jar
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Backend upload failed.
    pause
    exit /b %ERRORLEVEL%
)

echo Uploading frontend static assets...
call aws s3 sync frontend/dist s3://interior-deploy/interior/ --delete
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Frontend upload failed.
    pause
    exit /b %ERRORLEVEL%
)

echo Uploading EC2 deployment helper script...
call aws s3 cp deploy_ec2.sh s3://interior-deploy/deploy_ec2.sh
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Deploy helper script upload failed.
    pause
    exit /b %ERRORLEVEL%
)
del deploy_ec2.sh

echo.
echo Step 5: Connecting to AWS EC2 to apply changes...
set /p PEM_PATH="Drag and drop your AWS SSH PEM key file path: "
set PEM_PATH=%PEM_PATH:"=%
set EC2_IP=13.209.48.203

echo Executing remote deployment commands on EC2 via SSH...
call ssh -o StrictHostKeyChecking=no -i "%PEM_PATH%" ec2-user@%EC2_IP% "export AWS_ACCESS_KEY_ID=%AWS_ACCESS_KEY_ID% && export AWS_SECRET_ACCESS_KEY=%AWS_SECRET_ACCESS_KEY% && export AWS_DEFAULT_REGION=%AWS_DEFAULT_REGION% && aws s3 cp s3://interior-deploy/deploy_ec2.sh . && sed -i 's/\r$//' deploy_ec2.sh && chmod +x deploy_ec2.sh && ./deploy_ec2.sh && rm -f deploy_ec2.sh"
if %ERRORLEVEL% neq 0 (
    echo [ERROR] SSH Remote execution failed. Please verify PEM key and EC2 status.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ==========================================================
echo [SUCCESS] Web application deployed and applied to EC2!
echo Access URL: http://%EC2_IP%/interior
echo ==========================================================
pause
