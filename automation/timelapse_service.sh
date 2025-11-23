#!/bin/bash
# file: /home/orangepi/web_timelaps/automation/timelapse_service.sh
# purpose: Start services in background (web server and simple http server)

# go to project directory
cd "/home/orangepi/private-timelapse-server" || exit 1

# local virtual environment
source web/bin/activate

nohup python3 web_server.py > /home/orangepi/private-timelapse-server/logs/web_server.log 2>&1 &

# share resources quick (temporary)
cd "/home/orangepi/private-timelapse-server/resources" || exit 1
nohup python3 -m http.server > /home/orangepi/private-timelapse-server/logs/http_server.log 2>&1 &

echo "Service started."
exit 0
