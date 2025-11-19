# web_server.py
from flask import Flask, render_template, request, jsonify, Response
import threading
import timelapse_core as tl
import os
import shutil
from datetime import datetime as date
app = Flask(__name__)
timelapse_thread = None

@app.route('/')
def index():
    camaras = tl.detectar_camaras()
    return render_template('index.html', camaras=camaras)

@app.route('/resoluciones/<int:camara>')
def get_resoluciones(camara):
    """Endpoint para obtener las resoluciones disponibles de una cámara"""
    try:
        resoluciones = tl.detectar_resoluciones(camara)
        # Convertir tuplas a diccionarios para JSON
        resoluciones_json = [{"ancho": r[0], "alto": r[1], "label": f"{r[0]}x{r[1]}"} for r in resoluciones]
        return jsonify({"status": "ok", "resoluciones": resoluciones_json})
    except Exception as e:
        return jsonify({"status": "error", "msg": str(e)})

@app.route('/formatos_pixel/<int:camara>')
def get_formatos_pixel(camara):
    """Endpoint para obtener los formatos de píxel disponibles de una cámara"""
    try:
        formatos = tl.detectar_formatos_pixel(camara)
        # Convertir lista a diccionarios para JSON con descripciones
        descripciones = tl.obtener_formatos_pixel()

        formatos_json = [{"value": f, "label": descripciones.get(f, f)} for f in formatos]
        return jsonify({"status": "ok", "formatos": formatos_json})
    except Exception as e:
        return jsonify({"status": "error", "msg": str(e)})

@app.route('/start', methods=['POST'])
def start_timelapse():
    data = request.form
    try:
        camara = int(data.get("camara"))
        duracion = float(data.get("duracion"))
        intervalo = float(data.get("intervalo"))
        fps = int(data.get("fps"))
        path = data.get("path") or "frames_" + date.now().strftime("%Y-%m-%d_%H-%M-%S")
        
        # Obtener resolución si se especifica
        resolucion = None
        resolucion_str = data.get("resolucion")
        if resolucion_str:
            ancho, alto = map(int, resolucion_str.split("x"))
            resolucion = (ancho, alto)
        
        # Obtener formato de píxel si se especifica
        pix_fmt = data.get("pix_fmt") or "yuv420p"

        salida = data.get("salida") or "timelapse.mp4"
        # Validar que la salida sea un archivo .mov, .mp4 o .avi
        if salida.split(".")[-1] not in ["mov", "mp4", "avi"]:
            salida += ".mp4"

        prefix_path = 'resources'
        frames_dir = os.path.join(prefix_path, path, "frames")
        def run_timelapse():
            tl.capture_timelapse(duracion, intervalo, fps, output_path=os.path.join(prefix_path, path, salida), frames_dir=frames_dir, camara=camara, resolucion=resolucion, pix_fmt=pix_fmt)

        global timelapse_thread
        timelapse_thread = threading.Thread(target=run_timelapse, daemon=True)
        timelapse_thread.start()

        return jsonify({"status": "ok", "msg": "Timelapse iniciado correctamente."})

    except Exception as e:
        return jsonify({"status": "error", "msg": str(e)})

@app.route('/stream')
def stream():
    """Endpoint para el stream de video en vivo"""
    try:
        # Obtener parámetros opcionales de la URL
        camara = int(request.args.get('camara', 0))
        resolucion = None
        resolucion_str = request.args.get('resolucion')
        if resolucion_str:
            ancho, alto = map(int, resolucion_str.split('x'))
            resolucion = (ancho, alto)
        
        return Response(
            tl.generar_stream(camara=camara, resolucion=resolucion),
            mimetype='multipart/x-mixed-replace; boundary=frame'
        )
    except Exception as e:
        return jsonify({"status": "error", "msg": str(e)}), 500

@app.route('/status')
def status():
    running = timelapse_thread.is_alive() if timelapse_thread else False
    return jsonify({"running": running})

@app.route('/test')
def test():

    return jsonify({"status": {"status_code": 200, "msg": "ok"}})

@app.route('/disk_space')
def disk_space():
    """Endpoint para obtener el uso de espacio en disco"""
    try:
        # Obtener información del disco donde está el proyecto
        path = os.path.abspath('.')
        disk_usage = shutil.disk_usage(path)
        
        total = disk_usage.total
        used = disk_usage.used
        free = disk_usage.free
        percent_used = (used / total) * 100
        
        return jsonify({
            "status": "ok",
            "total": total,
            "used": used,
            "free": free,
            "percent_used": round(percent_used, 2),
            "total_gb": round(total / (1024**3), 2),
            "used_gb": round(used / (1024**3), 2),
            "free_gb": round(free / (1024**3), 2)
        })
    except Exception as e:
        return jsonify({"status": "error", "msg": str(e)})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
