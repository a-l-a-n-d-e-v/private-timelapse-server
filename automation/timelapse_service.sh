#!/bin/bash
# Archivo: /home/orangepi/web_timelaps/automation/timelapse_service.sh
# Propósito: Inicia los dos servicios Python (web principal y HTTP simple)

# Ir al directorio del proyecto
cd "/home/devops/Pruebas/web_timelaps_source" || exit 1

# Activar entorno virtual y ejecutar el servidor web principal
source web/bin/activate
nohup python3 web_server.py > /home/devops/Pruebas/web_timelaps_source/logs/web_server.log 2>&1 &

# Ir al directorio de recursos y ejecutar el servidor HTTP simple
cd "/home/devops/Pruebas/web_timelaps_source/resources" || exit 1
nohup python3 -m http.server > /home/devops/Pruebas/web_timelaps_source/logs/http_server.log 2>&1 &

echo "Servicios iniciados correctamente."
