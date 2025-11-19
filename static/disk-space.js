// disk-space.js - Manejo del componente de espacio en disco

document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.getElementById('diskSpaceToggle');
    const content = document.getElementById('diskSpaceContent');
    const progressFill = document.getElementById('diskProgressFill');
    const progressText = document.getElementById('diskProgressText');
    const diskTotal = document.getElementById('diskTotal');
    const diskUsed = document.getElementById('diskUsed');
    const diskFree = document.getElementById('diskFree');

    // Toggle collapsible
    toggleBtn.addEventListener('click', function() {
        const isCollapsed = content.classList.contains('collapsed');
        
        if (isCollapsed) {
            content.classList.remove('collapsed');
            toggleBtn.classList.add('active');
            // Cargar datos cuando se expande
            loadDiskSpace();
        } else {
            content.classList.add('collapsed');
            toggleBtn.classList.remove('active');
        }
    });

    // Función para cargar datos de espacio en disco
    function loadDiskSpace() {
        debugHandler.logEndpoint('/disk_space');
        fetch('/disk_space')
            .then(response => response.json())
            .then(data => {
                debugHandler.logResponse('/disk_space', data);
                if (data.status === 'ok') {
                    // Actualizar valores
                    diskTotal.textContent = data.total_gb + ' GB';
                    diskUsed.textContent = data.used_gb + ' GB';
                    diskFree.textContent = data.free_gb + ' GB';
                    
                    // Actualizar barra de progreso
                    const percent = data.percent_used;
                    progressFill.style.width = percent + '%';
                    progressText.textContent = percent + '%';
                    
                    // Cambiar color según el porcentaje
                    progressFill.classList.remove('warning', 'danger');
                    if (percent >= 90) {
                        progressFill.classList.add('danger');
                    } else if (percent >= 75) {
                        progressFill.classList.add('warning');
                    }
                } else {
                    console.error('Error al obtener datos de disco:', data.msg);
                    showError();
                }
            })
            .catch(error => {
                console.error('Error en la petición:', error);
                showError();
            });
    }

    // Función para mostrar error
    function showError() {
        diskTotal.textContent = 'Error';
        diskUsed.textContent = 'Error';
        diskFree.textContent = 'Error';
        progressText.textContent = '--';
        progressFill.style.width = '0%';
    }

    // Actualizar datos cada 30 segundos si está expandido
    setInterval(function() {
        if (!content.classList.contains('collapsed')) {
            loadDiskSpace();
        }
    }, 30000);
});
