#!/bin/bash
# file: /home/orangepi/web_timelaps/automation/timelapse_service.sh
# purpose: Start services in background (web server and simple http server)

# go to project directory
cd "/home/orangepi/web_timelaps" || exit 1

# local virtual environment
source web/bin/activate

# start web server
nohup python3 web_server.py > /home/orangepi/web_timelaps/logs/web_server.log 2>&1 &

# share resources quick (temporary)
cd "/home/orangepi/web_timelaps/resources" || exit 1
nohup python3 -m http.server > /home/orangepi/web_timelaps/logs/http_server.log 2>&1 &

echo "Services started."
