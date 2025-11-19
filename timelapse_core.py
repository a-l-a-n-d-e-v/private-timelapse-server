# timelapse_core.py
import cv2
import os
import time
import threading
import subprocess
import json

def detectar_camaras(max_test=10):
    camaras = []
    for i in range(max_test):
        cap = cv2.VideoCapture(i)
        if cap.isOpened():
            camaras.append(i)
            cap.release()
    return camaras

def detectar_resoluciones(camara=0):
    """
    Detecta las resoluciones disponibles para una cámara específica.
    Retorna una lista de tuplas (ancho, alto) con las resoluciones soportadas.
    """
    # Resoluciones comunes a probar
    resoluciones_test = [
        (320, 240),    # QVGA
        (640, 480),    # VGA
        (800, 600),    # SVGA
        (1024, 768),   # XGA
        (1280, 720),   # HD 720p
        (1280, 1024),  # SXGA
        (1920, 1080),  # Full HD 1080p
        (2560, 1440),  # QHD
        (3840, 2160),  # 4K UHD
    ]
    
    cap = cv2.VideoCapture(camara)
    if not cap.isOpened():
        return []
    
    resoluciones_disponibles = []
    
    for ancho, alto in resoluciones_test:
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, ancho)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, alto)
        
        # Verificar si la resolución fue establecida correctamente
        ancho_actual = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        alto_actual = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        # Si la resolución coincide (o está muy cerca), la agregamos
        if (ancho_actual, alto_actual) not in resoluciones_disponibles:
            resoluciones_disponibles.append((ancho_actual, alto_actual))
    
    cap.release()
    
    # Ordenar por área (de menor a mayor)
    resoluciones_disponibles.sort(key=lambda x: x[0] * x[1])
    
    return resoluciones_disponibles

def obtener_formatos_pixel():
    """
    Obtiene los formatos de píxel disponibles para una cámara específica.
    Retorna una lista de formatos de píxel soportados por la cámara.
    """
    descripciones = {
            'yuv420p': 'YUV 4:2:0 (Más compatible)',
            'yuyv422': 'YUYV 4:2:2',
            'mjpeg': 'Motion JPEG',
            'rgb24': 'RGB 24-bit',
            'bgr24': 'BGR 24-bit',
            'nv12': 'NV12 (YUV 4:2:0)',
            'yuv422p': 'YUV 4:2:2 Planar',
            'yuv444p': 'YUV 4:4:4 Planar',
            'gray': 'Escala de grises',
        }
    return descripciones

def detectar_formatos_pixel(camara=0):
    """
    Detecta los formatos de píxel disponibles para una cámara específica.
    Retorna una lista de formatos de píxel soportados por la cámara.
    """
    # Formatos de píxel comunes a probar
    formatos_test = [
        'yuv420p',   # Más compatible, usado por defecto
        'yuyv422',   # YUYV 4:2:2
        'mjpeg',     # Motion JPEG
        'rgb24',     # RGB de 24 bits
        'bgr24',     # BGR de 24 bits
        'nv12',      # NV12 (YUV 4:2:0)
        'yuv422p',   # YUV 4:2:2 planar
        'yuv444p',   # YUV 4:4:4 planar
        'gray',      # Escala de grises
    ]
    
    formatos_disponibles = []
    
    # Intentar obtener información de la cámara usando v4l2-ctl si está disponible
    try:
        result = subprocess.run(
            ['v4l2-ctl', '--device', f'/dev/video{camara}', '--list-formats-ext'],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode == 0:
            output = result.stdout.lower()
            
            # Mapeo de formatos v4l2 a ffmpeg
            formato_map = {
                'yuyv': 'yuyv422',
                'mjpeg': 'mjpeg',
                'mjpg': 'mjpeg',
                'yuv420': 'yuv420p',
                'nv12': 'nv12',
                'rgb': 'rgb24',
                'bgr': 'bgr24',
                'gray': 'gray',
            }
            
            for v4l2_fmt, ffmpeg_fmt in formato_map.items():
                if v4l2_fmt in output and ffmpeg_fmt not in formatos_disponibles:
                    formatos_disponibles.append(ffmpeg_fmt)
    except (subprocess.TimeoutExpired, FileNotFoundError, Exception):
        # Si v4l2-ctl no está disponible o falla, usar lista predeterminada
        pass
    
    # Si no se encontraron formatos, usar los más comunes
    if not formatos_disponibles:
        formatos_disponibles = ['yuv420p', 'yuyv422', 'mjpeg']
    
    # Asegurar que yuv420p esté siempre disponible (es el más compatible)
    if 'yuv420p' not in formatos_disponibles:
        formatos_disponibles.insert(0, 'yuv420p')
    
    return formatos_disponibles

def generar_stream(camara=0, resolucion=None):
    """
    Genera un stream de video MJPEG desde la cámara especificada.
    Retorna un generador de frames en formato JPEG.
    """
    cap = cv2.VideoCapture(camara)
    if not cap.isOpened():
        raise RuntimeError("No se puede acceder a la cámara seleccionada.")
    
    # Establecer resolución si se especifica
    ancho_deseado = None
    alto_deseado = None
    if resolucion:
        ancho_deseado, alto_deseado = resolucion
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, ancho_deseado)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, alto_deseado)
        
        # Verificar la resolución real que se estableció
        ancho_real = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        alto_real = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        print(f"Resolución solicitada: {ancho_deseado}x{alto_deseado}")
        print(f"Resolución real de la cámara: {ancho_real}x{alto_real}")
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("Error al capturar frame del stream")
                break
            
            # Si se especificó una resolución y el frame es más grande, recortar
            if ancho_deseado and alto_deseado:
                frame_alto, frame_ancho = frame.shape[:2]
                
                # Recortar el frame a la resolución deseada si es necesario
                # Esto elimina píxeles oscuros de relleno que algunas cámaras añaden
                if frame_ancho > ancho_deseado or frame_alto > alto_deseado:
                    frame = frame[:alto_deseado, :ancho_deseado]
            
            # Codificar el frame como JPEG
            ret, buffer = cv2.imencode('.jpg', frame)
            if not ret:
                continue
            
            frame_bytes = buffer.tobytes()
            
            # Generar el frame en formato multipart
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
    except GeneratorExit:
        # El cliente cerró la conexión
        print(f"Stream cerrado para cámara {camara}")
    except Exception as e:
        print(f"Error en stream: {e}")
    finally:
        cap.release()
        print(f"Cámara {camara} liberada del stream")

def capture_timelapse(duration_sec, interval_sec, output_fps, output_path="timelapse.mp4", frames_dir="frames", camara=0, resolucion=None, pix_fmt="yuv420p"):
    os.makedirs(frames_dir, exist_ok=True)

    # Pequeño retraso para asegurar que la cámara esté liberada si venía de un stream
    time.sleep(0.5)
    
    cap = cv2.VideoCapture(camara)
    if not cap.isOpened():
        raise RuntimeError("No se puede acceder a la cámara seleccionada.")
    
    # Establecer resolución si se especifica
    ancho_deseado = None
    alto_deseado = None
    if resolucion:
        ancho_deseado, alto_deseado = resolucion
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, ancho_deseado)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, alto_deseado)
        
        # Verificar la resolución real que se estableció
        ancho_real = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        alto_real = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        print(f"Resolución solicitada: {ancho_deseado}x{alto_deseado}")
        print(f"Resolución real de la cámara: {ancho_real}x{alto_real}")

    frame_count = 0
    start_time = time.time()

    while True:
        elapsed = time.time() - start_time
        if elapsed >= duration_sec:
            break

        ret, frame = cap.read()
        if not ret:
            print("Error al capturar frame")
            continue

        # Si se especificó una resolución y el frame es más grande, recortar
        if ancho_deseado and alto_deseado:
            frame_alto, frame_ancho = frame.shape[:2]
            
            # Recortar el frame a la resolución deseada si es necesario
            # Esto elimina píxeles oscuros de relleno que algunas cámaras añaden
            if frame_ancho > ancho_deseado or frame_alto > alto_deseado:
                frame = frame[:alto_deseado, :ancho_deseado]

        filename = os.path.join(frames_dir, f"frame_{frame_count:05d}.jpg")
        cv2.imwrite(filename, frame)
        frame_count += 1
        time.sleep(interval_sec)

    cap.release()
    
    # Validar y usar el formato de píxel especificado
    pix_fmt_arg = pix_fmt if pix_fmt else "yuv420p"
    
    os.system(f"ffmpeg -y -framerate {output_fps} -pattern_type glob -i '{frames_dir}/*.jpg' "
              f"-c:v libx264 -pix_fmt {pix_fmt_arg} '{output_path}'")
    print(f"Timelapse generado en: {output_path}")
