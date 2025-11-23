# Initialize app (linux) on root of the project

python3 -m venv web
pip install -r requierements.txt
mkdir logs resources

# Start app
./automation/timelapse_service.sh


## Tecnologies
- web (HTTP, python, Flask) - Cliente
- timelaps (python, ffmpeg) - Dispositivo
- HTTP server python        - Recursos



