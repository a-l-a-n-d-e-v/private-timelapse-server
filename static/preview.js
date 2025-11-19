// Función para crear la visualización de resoluciones tipo matrioshka
function createResolutionComparison() {
    const container = document.getElementById('resolutionBoxes');
    
    if (!resolucionSelect || !container) return;
    
    // Limpiar contenedor
    container.innerHTML = '';
    
    // Obtener todas las resoluciones del select (excepto la opción por defecto)
    const resolutions = [];
    for (let i = 0; i < resolucionSelect.options.length; i++) {
        const option = resolucionSelect.options[i];
        if (option.value && option.value !== '') {
            const match = option.value.match(/(\d+)x(\d+)/);
            if (match) {
                resolutions.push({
                    label: option.value,
                    width: parseInt(match[1]),
                    height: parseInt(match[2])
                });
            }
        }
    }
    
    if (resolutions.length === 0) {
        container.innerHTML = '<p style="color: #666;">Selecciona una cámara para ver las resoluciones disponibles</p>';
        return;
    }
    
    // Ordenar de mayor a menor para efecto matrioshka
    resolutions.sort((a, b) => (b.width * b.height) - (a.width * a.height));
    
    // Usar escala 1:1 (sin escalar)
    const maxWidth = resolutions[0].width;
    const maxHeight = resolutions[0].height;
    const scale = 1; // Escala 1:1 para representación real de píxeles
    
    // Crear el contenedor de cajas anidadas
    const matryoshkaContainer = document.createElement('div');
    matryoshkaContainer.className = 'matryoshka-container';
    matryoshkaContainer.style.position = 'relative';
    matryoshkaContainer.style.width = maxWidth + 'px';
    matryoshkaContainer.style.height = maxHeight + 'px';
    matryoshkaContainer.style.margin = '0';
    matryoshkaContainer.style.overflow = 'auto'; // Permitir scroll si es necesario
    
    // Crear cada caja
    resolutions.forEach((res, index) => {
        const box = document.createElement('div');
        box.className = 'resolution-box';
        
        const scaledWidth = res.width;
        const scaledHeight = res.height;
        
        // Colores diferentes para cada caja
        const colors = [
            'rgba(59, 130, 246, 0.3)',   // Azul
            'rgba(16, 185, 129, 0.3)',   // Verde
            'rgba(245, 158, 11, 0.3)',   // Naranja
            'rgba(239, 68, 68, 0.3)',    // Rojo
            'rgba(139, 92, 246, 0.3)',   // Púrpura
            'rgba(236, 72, 153, 0.3)',   // Rosa
            'rgba(20, 184, 166, 0.3)',   // Teal
        ];
        
        const borderColors = [
            'rgb(59, 130, 246)',
            'rgb(16, 185, 129)',
            'rgb(245, 158, 11)',
            'rgb(239, 68, 68)',
            'rgb(139, 92, 246)',
            'rgb(236, 72, 153)',
            'rgb(20, 184, 166)',
        ];
        
        box.style.position = 'absolute';
        box.style.width = scaledWidth + 'px';
        box.style.height = scaledHeight + 'px';
        box.style.border = `3px solid ${borderColors[index % borderColors.length]}`;
        box.style.backgroundColor = colors[index % colors.length];
        box.style.left = '0';
        box.style.top = '0';
        box.style.transform = 'none';
        box.style.transformOrigin = 'top left';
        box.style.display = 'flex';
        box.style.alignItems = 'flex-start';
        box.style.justifyContent = 'flex-end';
        box.style.padding = '10px';
        box.style.boxSizing = 'border-box';
        box.style.transition = 'all 0.3s ease';
        box.style.cursor = 'pointer';
        // Z-index más alto para cajas más pequeñas (índice mayor = caja más pequeña)
        box.style.zIndex = (100 + index).toString();
        box.style.pointerEvents = 'auto';
        
        // Etiqueta de resolución
        const label = document.createElement('div');
        label.className = 'resolution-label';
        label.textContent = res.label;
        label.style.backgroundColor = borderColors[index % borderColors.length];
        label.style.color = 'white';
        label.style.padding = '4px 12px';
        label.style.borderRadius = '4px';
        label.style.fontSize = '14px';
        label.style.fontWeight = 'bold';
        label.style.boxShadow = '0 2px 4px';
        label.style.whiteSpace = 'nowrap';
        
        box.appendChild(label);
        
        // Efecto hover
        box.addEventListener('mouseenter', () => {
            box.style.transform = 'scale(1.02)';
            box.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.2)';
        });
        
        box.addEventListener('mouseleave', () => {
            box.style.transform = 'none';
            box.style.boxShadow = 'none';
        });
        
        // Click para seleccionar resolución
        box.addEventListener('click', () => {
            resolucionSelect.value = res.label;
            // Resaltar brevemente la selección
            box.style.transform = 'scale(1.05)';
            setTimeout(() => {
                box.style.transform = 'none';
            }, 200);
        });
        
        matryoshkaContainer.appendChild(box);
    });
    
    // Agregar el stream de la cámara como la capa superior
    const streamBox = document.createElement('div');
    streamBox.id = 'streamBox';
    streamBox.className = 'resolution-box stream-box';
    streamBox.style.position = 'absolute';
    streamBox.style.left = '0';
    streamBox.style.top = '0';
    streamBox.style.width = maxWidth + 'px';
    streamBox.style.height = maxHeight + 'px';
    streamBox.style.border = '3px solid #333';
    streamBox.style.backgroundColor = 'transparent';
    streamBox.style.display = 'none';
    streamBox.style.alignItems = 'flex-start';
    streamBox.style.justifyContent = 'flex-end';
    streamBox.style.padding = '10px';
    streamBox.style.boxSizing = 'border-box';
    streamBox.style.zIndex = '2000';
    streamBox.style.overflow = 'hidden';
    
    const streamImg = document.createElement('img');
    streamImg.id = 'streamImg';
    streamImg.src = '';
    streamImg.alt = 'Stream de cámara';
    streamImg.style.position = 'absolute';
    streamImg.style.left = '0';
    streamImg.style.top = '0';
    streamImg.style.width = '100%';
    streamImg.style.height = '100%';
    streamImg.style.objectFit = 'none'; // Sin escalar, píxeles 1:1
    streamImg.style.objectPosition = 'top left';
    
    const streamLabel = document.createElement('div');
    streamLabel.className = 'resolution-label';
    streamLabel.textContent = 'Vista Previa';
    streamLabel.style.backgroundColor = '#333';
    streamLabel.style.color = 'white';
    streamLabel.style.padding = '4px 12px';
    streamLabel.style.borderRadius = '4px';
    streamLabel.style.fontSize = '14px';
    streamLabel.style.fontWeight = 'bold';
    streamLabel.style.boxShadow = '0 2px 4px transparent';
    streamLabel.style.whiteSpace = 'nowrap';
    streamLabel.style.position = 'relative';
    streamLabel.style.zIndex = '2001';
    
    streamBox.appendChild(streamImg);
    streamBox.appendChild(streamLabel);
    matryoshkaContainer.appendChild(streamBox);
    
    container.appendChild(matryoshkaContainer);
    
    // Agregar leyenda con información adicional
    const legend = document.createElement('div');
    legend.className = 'resolution-legend';
    legend.style.marginTop = '20px';
    legend.style.textAlign = 'left';
    legend.style.fontSize = '14px';
    legend.style.color = '#666';
    legend.innerHTML = `
        <p><strong>${resolutions.length}</strong> resoluciones disponibles (escala 1:1)</p>
        <p style="font-size: 12px; margin-top: 5px;">Haz clic en una caja para seleccionar esa resolución. El stream se muestra en tamaño real sin escalar.</p>
    `;
    container.appendChild(legend);
}

// Actualizar la visualización cuando cambien las resoluciones
if (resolucionSelect) {
    // Observar cambios en el select
    const observer = new MutationObserver(() => {
        createResolutionComparison();
    });
    
    observer.observe(resolucionSelect, {
        childList: true,
        subtree: true
    });
    
    // También actualizar cuando cambie la selección
    resolucionSelect.addEventListener('change', createResolutionComparison);
    
    // Crear visualización inicial
    setTimeout(createResolutionComparison, 500);
}