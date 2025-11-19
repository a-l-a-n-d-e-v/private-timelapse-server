const form = document.getElementById('timelapseForm');

const camaraSelect = document.getElementById('camaraSelect');
const resolucionSelect = document.getElementById('resolucionSelect');
const pixFmtSelect = document.getElementById('pixFmtSelect');

// Variables para el stream
const previewBtn = document.getElementById('previewBtn');
let streamActive = false;

// Función para obtener referencias del stream (se crean dinámicamente)
function getStreamElements() {
    return {
        streamBox: document.getElementById('streamBox'),
        streamImg: document.getElementById('streamImg')
    };
}

// Cargar resoluciones cuando cambia la cámara
async function cargarResoluciones() {
    const camara = camaraSelect.value;
    resolucionSelect.innerHTML = '<option value="">Cargando...</option>';
    
    // Debug: Log endpoint call
    debugHandler.logEndpoint('/resoluciones', { camara: camara });
    
    try {
        const res = await fetch(`/resoluciones/${camara}`);
        const data = await res.json();
        
        // Debug: Log response
        debugHandler.logResponse('/resoluciones', data);
        
        if (data.status === 'ok') {
            resolucionSelect.innerHTML = '<option value="">Resolución por defecto</option>';
            data.resoluciones.forEach(r => {
                const option = document.createElement('option');
                option.value = r.label;
                option.textContent = r.label;
                resolucionSelect.appendChild(option);
            });
        } else {
            resolucionSelect.innerHTML = '<option value="">Error al cargar</option>';
            errorHandler.handleApiError(data, 'Cargar Resoluciones');
        }
    } catch (error) {
        resolucionSelect.innerHTML = '<option value="">Error al cargar</option>';
        errorHandler.handleFetchError(error, 'Cargar Resoluciones');
    }
}

// Cargar formatos de píxel cuando cambia la cámara
async function cargarFormatosPixel() {
    const camara = camaraSelect.value;
    pixFmtSelect.innerHTML = '<option value="">Cargando...</option>';
    
    try {
        const res = await fetch(`/formatos_pixel/${camara}`);
        const data = await res.json();
        
        if (data.status === 'ok') {
            pixFmtSelect.innerHTML = '';
            data.formatos.forEach(f => {
                const option = document.createElement('option');
                option.value = f.value;
                option.textContent = f.label;
                // Seleccionar yuv420p por defecto
                if (f.value === 'yuv420p') {
                    option.selected = true;
                }
                pixFmtSelect.appendChild(option);
            });
        } else {
            pixFmtSelect.innerHTML = '<option value="yuv420p">YUV 4:2:0 (Por defecto)</option>';
            errorHandler.handleApiError(data, 'Cargar Formatos de Píxel');
        }
    } catch (error) {
        pixFmtSelect.innerHTML = '<option value="yuv420p">YUV 4:2:0 (Por defecto)</option>';
        errorHandler.handleFetchError(error, 'Cargar Formatos de Píxel');
    }
}

// Cargar datos al inicio y cuando cambie la cámara
async function cargarDatosCamara() {
    await Promise.all([cargarResoluciones(), cargarFormatosPixel()]);
}

camaraSelect.addEventListener('change', cargarDatosCamara);
cargarDatosCamara();

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Detener el stream si está activo para liberar la cámara
    if (streamActive) {
        const { streamBox, streamImg } = getStreamElements();
        if (streamImg) streamImg.src = '';
        if (streamBox) streamBox.style.display = 'none';
        previewBtn.textContent = 'Preview';
        streamActive = false;
        // Esperar un momento para que la cámara se libere
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    document.getElementById('status').innerText = "Iniciando timelapse...";
    const formData = new FormData(form);
    
    try {
        const res = await fetch('/start', { method: 'POST', body: formData });
        const data = await res.json();
        
        if (data.status === 'ok' || data.msg) {
            document.getElementById('status').innerText = data.msg;
        } else {
            document.getElementById('status').innerText = "Error al iniciar timelapse";
            errorHandler.handleApiError(data, 'Iniciar Timelapse');
        }
    } catch (error) {
        document.getElementById('status').innerText = "Error al iniciar timelapse";
        errorHandler.handleFetchError(error, 'Iniciar Timelapse');
    }
});

// Funcionalidad de preview del stream
if (previewBtn) {
    previewBtn.addEventListener('click', () => {
        const { streamBox, streamImg } = getStreamElements();
        
        if (!streamBox || !streamImg) {
            alert('Por favor, selecciona una cámara primero para cargar las resoluciones.');
            return;
        }
        
        if (!streamActive) {
            // Activar stream
            const camara = camaraSelect.value;
            const resolucion = resolucionSelect.value;
            
            let streamUrl = `/stream?camara=${camara}`;
            if (resolucion) {
                streamUrl += `&resolucion=${resolucion}`;
            }
            
            streamImg.src = streamUrl;
            streamBox.style.display = 'flex';
            previewBtn.textContent = 'Detener Preview';
            streamActive = true;
        } else {
            // Desactivar stream
            streamImg.src = '';
            streamBox.style.display = 'none';
            previewBtn.textContent = 'Preview';
            streamActive = false;
        }
    });
}