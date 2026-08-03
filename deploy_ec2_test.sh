#!/bin/bash
echo "=== EC2 DEPLOYMENT START ==="
echo '    location /interior { root /usr/share/nginx/html; try_files $uri $uri/ /interior/index.html; }' > nginx_location.conf
if [ -f /etc/nginx/conf.d/gimcheon.conf ]; then
    sudo sed -i '/location \/interior/d' /etc/nginx/conf.d/gimcheon.conf
    sudo sed -i '/server {/r nginx_location.conf' /etc/nginx/conf.d/gimcheon.conf
elif [ -f /etc/nginx/nginx.conf ]; then
    sudo sed -i '/location \/interior/d' /etc/nginx/nginx.conf
    sudo sed -i '/server {/r nginx_location.conf' /etc/nginx/nginx.conf
fi
rm -f nginx_location.conf
mkdir -p ./temp_interior
aws s3 sync s3://interior-deploy/interior/ ./temp_interior/ --delete
sudo mkdir -p /usr/share/nginx/html/interior
sudo cp -rf ./temp_interior/* /usr/share/nginx/html/interior/
rm -rf ./temp_interior
aws s3 cp s3://interior-deploy/backend-interior-0.0.1-SNAPSHOT.jar .
sudo kill -9 $(pgrep -f backend-interior) 2>/dev/null || true
nohup java -jar -Dspring.profiles.active=prod,web backend-interior-0.0.1-SNAPSHOT.jar > app.log 2>&1 &
sudo systemctl restart nginx
echo "=== EC2 DEPLOYMENT COMPLETED SUCCESSFULLY ==="