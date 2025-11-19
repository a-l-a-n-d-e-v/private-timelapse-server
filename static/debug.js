// Sistema de manejo de mensajes de debug
const DebugSystem = {
    // Colección de configuración
    config: {
        containerId: 'debugList',
        maxMessages: 50,
        autoCollapse: false,
        showTimestamp: true
    },

    // Colección de estado
    state: {
        messages: new Map(),
        counter: 0,
        container: null,
        sidebar: null,
        isInitialized: false
    },

    // Colección de utilidades de formato
    formatters: {
        // Formatear datos clave:valor
        formatKeyValue(data) {
            if (!data || typeof data !== 'object') {
                return `<p class="debug-data">${data}</p>`;
            }

            let html = '<ul class="debug-data">';
            for (const [key, value] of Object.entries(data)) {
                const displayValue = typeof value === 'object' 
                    ? `<pre>${JSON.stringify(value, null, 2)}</pre>` 
                    : value;
                html += `<li><strong>${key}:</strong> <span class="debug-value">${displayValue}</span></li>`;
            }
            html += '</ul>';
            return html;
        },

        // Formatear timestamp
        formatTimestamp() {
            const now = new Date();
            return now.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit',
                fractionalSecondDigits: 3
            });
        },

        // Formatear endpoint
        formatEndpoint(endpoint) {
            return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        }
    },

    // Colección de operaciones de UI
    ui: {
        // Crear elemento de debug
        createDebugElement(id, endpoint, data, timestamp) {
            const debugItem = document.createElement('li');
            debugItem.id = id;
            debugItem.className = 'debug-item';
            
            const dataHtml = DebugSystem.formatters.formatKeyValue(data);
            const timestampHtml = DebugSystem.config.showTimestamp 
                ? `<p class="debug-timestamp">${timestamp}</p>` 
                : '';

            debugItem.innerHTML = `
                <div class="debug-header">
                    <p class="debug-endpoint"><strong>Endpoint:</strong> ${endpoint}</p>
                    <button class="debug-close" onclick="DebugSystem.actions.remove('${id}')">×</button>
                </div>
                <div class="debug-content">
                    ${dataHtml}
                </div>
                ${timestampHtml}
            `;

            return debugItem;
        },

        // Actualizar contador de mensajes
        updateBadge() {
            const badge = document.getElementById('debugBadge');
            const count = DebugSystem.state.messages.size;
            if (badge) {
                badge.textContent = count;
                badge.style.display = count > 0 ? 'block' : 'none';
            }
        },

        // Mostrar/ocultar botón de apertura
        toggleOpenButton(show) {
            const openBtn = document.getElementById('debugOpenBtn');
            if (openBtn) {
                openBtn.style.display = show ? 'block' : 'none';
            }
        }
    },

    // Colección de acciones principales
    actions: {
        // Mostrar mensaje de debug
        show(endpoint, data, debugId = null) {
            if (!DebugSystem.state.container) {
                console.warn('Debug container not found. Attempting to reinitialize...');
                DebugSystem.init();
                if (!DebugSystem.state.container) {
                    console.error('Debug container still not found after reinitialization');
                    return null;
                }
            }

            // Generar ID único
            const id = debugId || `debug-${++DebugSystem.state.counter}`;
            const formattedEndpoint = DebugSystem.formatters.formatEndpoint(endpoint);
            const timestamp = DebugSystem.formatters.formatTimestamp();

            // Crear y agregar elemento
            const debugItem = DebugSystem.ui.createDebugElement(
                id, 
                formattedEndpoint, 
                data, 
                timestamp
            );

            // Insertar al inicio (mensajes más recientes primero)
            DebugSystem.state.container.insertBefore(
                debugItem, 
                DebugSystem.state.container.firstChild
            );
            DebugSystem.state.messages.set(id, {
                element: debugItem,
                endpoint: formattedEndpoint,
                data: data,
                timestamp: timestamp
            });

            // Limitar número de mensajes
            if (DebugSystem.state.messages.size > DebugSystem.config.maxMessages) {
                const oldestId = Array.from(DebugSystem.state.messages.keys())[0];
                DebugSystem.actions.remove(oldestId);
            }

            DebugSystem.ui.updateBadge();
            return id;
        },

        // Remover mensaje específico
        remove(debugId) {
            const message = DebugSystem.state.messages.get(debugId);
            if (message) {
                message.element.remove();
                DebugSystem.state.messages.delete(debugId);
                DebugSystem.ui.updateBadge();
            }
        },

        // Limpiar todos los mensajes
        clearAll() {
            DebugSystem.state.messages.forEach((message) => message.element.remove());
            DebugSystem.state.messages.clear();
            DebugSystem.ui.updateBadge();
        },

        // Exportar mensajes como JSON
        export() {
            const messages = [];
            DebugSystem.state.messages.forEach((message, id) => {
                messages.push({
                    id: id,
                    endpoint: message.endpoint,
                    data: message.data,
                    timestamp: message.timestamp
                });
            });
            return JSON.stringify(messages, null, 2);
        }
    },

    // Colección de helpers para logging
    log: {
        // Registrar llamada a endpoint
        endpoint(endpoint, params = {}) {
            return DebugSystem.actions.show(endpoint, params);
        },

        // Registrar respuesta de endpoint
        response(endpoint, response) {
            return DebugSystem.actions.show(`${endpoint} (Response)`, response);
        },

        // Registrar error de endpoint
        error(endpoint, error) {
            return DebugSystem.actions.show(`${endpoint} (Error)`, {
                message: error.message || error,
                stack: error.stack
            });
        },

        // Registrar datos de formulario
        form(formId, formData) {
            const data = {};
            if (formData instanceof FormData) {
                for (const [key, value] of formData.entries()) {
                    data[key] = value;
                }
            } else {
                Object.assign(data, formData);
            }
            return DebugSystem.actions.show(`Form: ${formId}`, data);
        }
    },

    // Colección de controles del sidebar
    sidebar: {
        // Cerrar sidebar
        close() {
            const sidebar = document.getElementById('debugSidebar');
            const contentWrapper = document.querySelector('.content-wrapper');
            
            if (sidebar) {
                sidebar.classList.add('collapsed');
            }
            if (contentWrapper) {
                contentWrapper.classList.remove('debug-open');
            }
            DebugSystem.ui.toggleOpenButton(true);
        },

        // Abrir sidebar
        open() {
            const sidebar = document.getElementById('debugSidebar');
            const contentWrapper = document.querySelector('.content-wrapper');
            
            if (sidebar) {
                sidebar.classList.remove('collapsed');
            }
            if (contentWrapper) {
                contentWrapper.classList.add('debug-open');
            }
            DebugSystem.ui.toggleOpenButton(false);
        },

        // Toggle sidebar
        toggle() {
            const sidebar = document.getElementById('debugSidebar');
            if (sidebar && sidebar.classList.contains('collapsed')) {
                DebugSystem.sidebar.open();
            } else {
                DebugSystem.sidebar.close();
            }
        }
    },

    // Inicialización del sistema
    init() {
        // Si ya está inicializado y el container existe, no reinicializar
        if (DebugSystem.state.isInitialized && DebugSystem.state.container) {
            return;
        }

        DebugSystem.state.container = document.getElementById(DebugSystem.config.containerId);
        DebugSystem.state.sidebar = document.getElementById('debugSidebar');

        if (!DebugSystem.state.container) {
            console.warn('Debug container not found - element #' + DebugSystem.config.containerId + ' does not exist in DOM');
            return;
        }

        // Configurar event listeners
        const toggleBtn = document.getElementById('debugToggle');
        const openBtn = document.getElementById('debugOpenBtn');
        const clearBtn = document.getElementById('debugClearBtn');

        if (toggleBtn) {
            toggleBtn.addEventListener('click', DebugSystem.sidebar.close);
        }

        if (openBtn) {
            openBtn.addEventListener('click', DebugSystem.sidebar.open);
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', DebugSystem.actions.clearAll);
        }

        DebugSystem.state.isInitialized = true;
        console.log('Debug System initialized');
    }
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', DebugSystem.init);
} else {
    DebugSystem.init();
}

// Alias para compatibilidad y facilidad de uso
const debugHandler = {
    showDebug: (endpoint, data) => DebugSystem.actions.show(endpoint, data),
    removeDebug: (id) => DebugSystem.actions.remove(id),
    clearAll: () => DebugSystem.actions.clearAll(),
    logEndpoint: (endpoint, params) => DebugSystem.log.endpoint(endpoint, params),
    logResponse: (endpoint, response) => DebugSystem.log.response(endpoint, response),
    logError: (endpoint, error) => DebugSystem.log.error(endpoint, error),
    logForm: (formId, formData) => DebugSystem.log.form(formId, formData)
};

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DebugSystem, debugHandler };
}