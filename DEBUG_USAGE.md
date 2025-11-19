# Sistema de Debug - Guía de Uso

## Descripción

El sistema de debug proporciona una interfaz visual para monitorear llamadas a endpoints, parámetros enviados y respuestas recibidas. Se presenta como un sidebar colapsable en el lado izquierdo de la aplicación.

## Características

- **Sidebar izquierdo colapsable**: Muestra mensajes de debug sin interferir con el contenido principal
- **Contador de mensajes**: Badge que muestra el número de mensajes activos
- **Timestamps precisos**: Cada mensaje incluye hora exacta con milisegundos
- **Formato clave:valor**: Datos estructurados de forma legible
- **Límite automático**: Mantiene solo los últimos 50 mensajes
- **Botón de limpieza**: Elimina todos los mensajes con un clic
- **Exportación JSON**: Permite exportar todos los mensajes

## Estructura del Objeto DebugSystem

El sistema está organizado en colecciones de funcionalidades:

### 1. **config** - Configuración
```javascript
DebugSystem.config = {
    containerId: 'debugList',      // ID del contenedor HTML
    maxMessages: 50,               // Máximo de mensajes a mantener
    autoCollapse: false,           // Auto-colapsar sidebar
    showTimestamp: true            // Mostrar timestamps
}
```

### 2. **state** - Estado del sistema
```javascript
DebugSystem.state = {
    messages: Map,                 // Mapa de mensajes activos
    counter: 0,                    // Contador de mensajes
    container: HTMLElement,        // Referencia al contenedor
    sidebar: HTMLElement,          // Referencia al sidebar
    isInitialized: false          // Estado de inicialización
}
```

### 3. **formatters** - Utilidades de formato
```javascript
DebugSystem.formatters.formatKeyValue(data)    // Formatea objetos a HTML
DebugSystem.formatters.formatTimestamp()       // Genera timestamp
DebugSystem.formatters.formatEndpoint(url)     // Formatea URLs
```

### 4. **ui** - Operaciones de interfaz
```javascript
DebugSystem.ui.createDebugElement(id, endpoint, data, timestamp)
DebugSystem.ui.updateBadge()                   // Actualiza contador
DebugSystem.ui.toggleOpenButton(show)          // Muestra/oculta botón
```

### 5. **actions** - Acciones principales
```javascript
DebugSystem.actions.show(endpoint, data, id)   // Muestra mensaje
DebugSystem.actions.remove(id)                 // Elimina mensaje
DebugSystem.actions.clearAll()                 // Limpia todos
DebugSystem.actions.export()                   // Exporta a JSON
```

### 6. **log** - Helpers de logging
```javascript
DebugSystem.log.endpoint(endpoint, params)     // Log de llamada
DebugSystem.log.response(endpoint, response)   // Log de respuesta
DebugSystem.log.error(endpoint, error)         // Log de error
DebugSystem.log.form(formId, formData)         // Log de formulario
```

### 7. **sidebar** - Control del sidebar
```javascript
DebugSystem.sidebar.open()                     // Abre sidebar
DebugSystem.sidebar.close()                    // Cierra sidebar
DebugSystem.sidebar.toggle()                   // Alterna estado
```

## Uso Básico

### Alias `debugHandler`

Para facilidad de uso, existe un alias `debugHandler` con métodos simplificados:

```javascript
// Mostrar mensaje de debug
debugHandler.showDebug('/api/endpoint', { param1: 'value1', param2: 'value2' });

// Registrar llamada a endpoint
debugHandler.logEndpoint('/resoluciones', { camara: 0 });

// Registrar respuesta
debugHandler.logResponse('/resoluciones', { status: 'ok', data: [...] });

// Registrar error
debugHandler.logError('/start', new Error('Connection failed'));

// Registrar datos de formulario
const formData = new FormData(form);
debugHandler.logForm('timelapseForm', formData);

// Limpiar todos los mensajes
debugHandler.clearAll();
```

## Ejemplos de Uso

### 1. Monitorear llamadas fetch

```javascript
async function cargarDatos() {
    const params = { camara: 0, resolucion: '1920x1080' };
    
    // Log de llamada
    debugHandler.logEndpoint('/resoluciones', params);
    
    try {
        const res = await fetch(`/resoluciones/${params.camara}`);
        const data = await res.json();
        
        // Log de respuesta
        debugHandler.logResponse('/resoluciones', data);
        
        return data;
    } catch (error) {
        // Log de error
        debugHandler.logError('/resoluciones', error);
        throw error;
    }
}
```

### 2. Monitorear envío de formularios

```javascript
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    
    // Log del formulario
    debugHandler.logForm('timelapseForm', formData);
    
    const res = await fetch('/start', { method: 'POST', body: formData });
    const data = await res.json();
    
    // Log de respuesta
    debugHandler.logResponse('/start', data);
});
```

### 3. Debug personalizado

```javascript
// Mostrar información personalizada
DebugSystem.actions.show('Custom Debug', {
    usuario: 'admin',
    accion: 'configurar_camara',
    timestamp: Date.now(),
    detalles: {
        camara: 0,
        resolucion: '1920x1080',
        fps: 30
    }
});
```

### 4. Exportar mensajes

```javascript
// Exportar todos los mensajes a JSON
const jsonData = DebugSystem.actions.export();
console.log(jsonData);

// Descargar como archivo
const blob = new Blob([jsonData], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'debug-log.json';
a.click();
```

## Controles de UI

### Sidebar
- **Botón ×**: Cierra el sidebar
- **Botón 🗑**: Limpia todos los mensajes
- **Badge numérico**: Muestra cantidad de mensajes activos

### Botón flotante
- **🐛 (verde)**: Abre el sidebar de debug cuando está colapsado
- Aparece automáticamente en la esquina superior izquierda

## Personalización

### Cambiar configuración

```javascript
// Cambiar número máximo de mensajes
DebugSystem.config.maxMessages = 100;

// Desactivar timestamps
DebugSystem.config.showTimestamp = false;

// Auto-colapsar después de cada mensaje
DebugSystem.config.autoCollapse = true;
```

### Estilos CSS

Los estilos principales están en `style.css`:

- `.sidebar-debug`: Contenedor principal
- `.debug-item`: Cada mensaje individual
- `.debug-endpoint`: Nombre del endpoint
- `.debug-data`: Datos clave:valor
- `.debug-timestamp`: Marca de tiempo

## Integración con Sistema de Errores

El sistema de debug trabaja en conjunto con el sistema de errores:

- **Debug (izquierda)**: Información de desarrollo y monitoreo
- **Errores (derecha)**: Errores y advertencias para el usuario

Ambos sidebars pueden estar abiertos simultáneamente, y el contenido principal se ajusta automáticamente.

## Tips de Uso

1. **Desarrollo**: Mantén el sidebar abierto para ver todas las llamadas en tiempo real
2. **Producción**: Puedes deshabilitar el debug comentando la inclusión de `debug.js`
3. **Debugging**: Usa `DebugSystem.actions.export()` para guardar logs de sesiones problemáticas
4. **Performance**: El límite de 50 mensajes evita problemas de memoria en sesiones largas

## Compatibilidad

- Navegadores modernos (ES6+)
- Compatible con módulos CommonJS
- No requiere dependencias externas
