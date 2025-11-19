#!/bin/bash
# Archivo: /home/orangepi/web_timelaps/automation/timelapse_stop.sh
# Propósito: Detiene los procesos iniciados por timelapse_service.sh

# Buscar y detener web_server.py
pkill -f "python3 web_server.py"

# Buscar y detener el servidor HTTP simple
pkill -f "python3 -m http.server"

echo "Servicios detenidos correctamente."
