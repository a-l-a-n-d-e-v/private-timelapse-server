// Sistema de manejo de errores
class ErrorHandler {
    constructor(containerId = 'errorsList') {
        this.container = document.getElementById(containerId);
        this.errors = new Map();
        this.errorCounter = 0;
    }

    // Mostrar error en la interfaz
    showError(title, message, type = 'Error', errorId = null) {
        if (!this.container) {
            console.error('Error container not found');
            return null;
        }

        // Generar ID único si no se proporciona
        const id = errorId || `error-${++this.errorCounter}`;
        
        // Crear elemento de error
        const errorItem = document.createElement('li');
        errorItem.id = id;
        errorItem.className = 'error-item';
        errorItem.innerHTML = `
            <p class="error-title"><strong>${title}</strong></p>
            <p class="error-message">${message}</p>
            <p class="error-type">${type}</p>
            <button class="error-close" onclick="errorHandler.removeError('${id}')">×</button>
        `;
        
        // Agregar al contenedor
        this.container.appendChild(errorItem);
        this.errors.set(id, errorItem);
        
        return id;
    }

    // Remover error específico
    removeError(errorId) {
        const errorItem = this.errors.get(errorId);
        if (errorItem) {
            errorItem.remove();
            this.errors.delete(errorId);
        }
    }

    // Limpiar todos los errores
    clearAll() {
        this.errors.forEach((item) => item.remove());
        this.errors.clear();
    }

    // Manejar errores de fetch
    handleFetchError(error, context = '') {
        const title = context ? `${context}` : 'Error de Conexión';
        const message = error.message || 'No se pudo conectar con el servidor';
        const type = 'Conexión';
        
        this.showError(title, message, type);
        console.error(`[${context}]`, error);
    }

    // Manejar respuestas de API con errores
    handleApiError(data, context = '') {
        const title = context ? `${context}` : 'Error de API';
        const message = data.msg || data.message || data.error || 'Error desconocido';
        const type = 'API';
        
        this.showError(title, message, type);
        console.error(`[${context}]`, data);
    }

    // Manejar errores de carga de recursos
    handleLoadError(resource, context = '') {
        const title = context ? `${context}` : 'Error de Carga';
        const message = `No se pudo cargar: ${resource}`;
        const type = 'Carga';
        
        this.showError(title, message, type);
    }
}

// Instancia global del manejador de errores
const errorHandler = new ErrorHandler();

// Funcionalidad de la barra lateral colapsable
document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.getElementById('errorsSidebar');
    const toggleBtn = document.getElementById('sidebarToggle');
    const openBtn = document.getElementById('sidebarOpenBtn');
    const contentWrapper = document.querySelector('.content-wrapper');

    // Función para cerrar el sidebar
    function closeSidebar() {
        sidebar.classList.add('collapsed');
        openBtn.style.display = 'block';
        if (contentWrapper) {
            contentWrapper.classList.remove('sidebar-open');
        }
    }

    // Función para abrir el sidebar
    function openSidebar() {
        sidebar.classList.remove('collapsed');
        openBtn.style.display = 'none';
        if (contentWrapper) {
            contentWrapper.classList.add('sidebar-open');
        }
    }

    // Event listeners
    if (toggleBtn) {
        toggleBtn.addEventListener('click', closeSidebar);
    }

    if (openBtn) {
        openBtn.addEventListener('click', openSidebar);
    }

    // Mostrar el botón de abrir cuando hay errores
    const originalShowError = errorHandler.showError.bind(errorHandler);
    errorHandler.showError = function(...args) {
        const result = originalShowError(...args);
        // Si el sidebar está colapsado y hay errores, asegurar que el botón sea visible
        if (sidebar.classList.contains('collapsed') && errorHandler.errors.size > 0) {
            openBtn.style.display = 'block';
        }
        return result;
    };
});

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ErrorHandler, errorHandler };
}