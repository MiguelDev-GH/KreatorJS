// KreatorJS - Renderer Process
// Lógica principal da IDE

// Verificar se está rodando no Electron ou no navegador
const isElectron = typeof window.electronAPI !== 'undefined';
const ipcRenderer = isElectron ? window.electronAPI : null;


// Estado global da aplicação
let currentProject = null;
let selectedComponent = null;
let componentCounter = 0;
let undoStack = [];
let redoStack = [];
let projectVariables = {};
let globalProjectSettings = {
    width: 800,
    height: 600,
    backgroundColor: '#ffffff'
};
let globalEvents = {};

// Estado do canvas do designer
let canvasScale = 1;
let canvasPanX = 0;
let canvasPanY = 0;
let isPanning = false;
let isSpacePressed = false;
let lastMousePos = { x: 0, y: 0 };

// Função para aplicar a transformação ao canvas
function updateCanvasTransform() {
    const canvas = document.getElementById('designer-canvas');
    if (canvas) {
        canvas.style.transform = `translate(${canvasPanX}px, ${canvasPanY}px) scale(${canvasScale})`;
        canvas.style.transformOrigin = '0 0';
    }
}

// Componentes disponíveis na paleta
const componentLibrary = [
    {
        type: 'button',
        name: 'Botão',
        description: 'Botão clicável',
        icon: '🔘',
        defaultProps: {
            text: 'Botão',
            width: '100px',
            height: '30px',
            backgroundColor: '#007acc',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px'
        },
        html: '<button>{{text}}</button>'
    },
    {
        type: 'input',
        name: 'Campo de Texto',
        description: 'Campo de entrada de texto',
        icon: '📝',
        defaultProps: {
            placeholder: 'Digite aqui...',
            width: '200px',
            height: '30px',
            backgroundColor: '#ffffff',
            color: '#000000',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '14px',
            padding: '5px'
        },
        html: '<input type="text" placeholder="{{placeholder}}">'
    },
    {
        type: 'label',
        name: 'Rótulo',
        description: 'Texto estático',
        icon: '🏷️',
        defaultProps: {
            text: 'Rótulo',
            width: 'auto',
            height: 'auto',
            color: '#000000',
            fontSize: '14px',
            fontWeight: 'normal'
        },
        html: '<label>{{text}}</label>'
    },
    {
        type: 'div',
        name: 'Painel',
        description: 'Container genérico',
        icon: '📦',
        defaultProps: {
            width: '200px',
            height: '100px',
            backgroundColor: '#f0f0f0',
            border: '1px solid #ccc',
            borderRadius: '4px'
        },
        html: '<div></div>'
    },
    {
        type: 'image',
        name: 'Imagem',
        description: 'Elemento de imagem',
        icon: '🖼️',
        defaultProps: {
            src: 'https://via.placeholder.com/150x100',
            alt: 'Imagem',
            width: '150px',
            height: '100px',
            border: 'none',
            borderRadius: '0px'
        },
        html: '<img src="{{src}}" alt="{{alt}}">'
    },
    {
        type: 'textarea',
        name: 'Área de Texto',
        description: 'Campo de texto multilinha',
        icon: '📄',
        defaultProps: {
            placeholder: 'Digite seu texto aqui...',
            width: '300px',
            height: '100px',
            backgroundColor: '#ffffff',
            color: '#000000',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '14px',
            padding: '5px',
            resize: 'both'
        },
        html: '<textarea placeholder="{{placeholder}}"></textarea>'
    },
    {
        type: 'select',
        name: 'Lista Suspensa',
        description: 'Seletor de opções',
        icon: '📋',
        defaultProps: {
            width: '150px',
            height: '30px',
            backgroundColor: '#ffffff',
            color: '#000000',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '14px'
        },
        html: '<select><option>Opção 1</option><option>Opção 2</option><option>Opção 3</option></select>'
    },
    {
        type: 'checkbox',
        name: 'Caixa de Seleção',
        description: 'Checkbox para seleção',
        icon: '☑️',
        defaultProps: {
            text: 'Marcar opção',
            checked: false,
            color: '#000000',
            fontSize: '14px'
        },
        html: '<label><input type="checkbox"> {{text}}</label>'
    }
];

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', () => {
    initializeIDE();
    setupEventListeners();
    populateComponentPalette();
    initializeVariablesPanel();
    setupInitialMenu(); // Adicionado para configurar o menu inicial
    logToConsole('KreatorJS inicializado com sucesso!', 'success');
});

// Configuração do Menu Inicial
function setupInitialMenu() {
    const initialMenu = document.getElementById('initial-menu');
    const appContainer = document.getElementById('app');
    const btnNewProject = document.getElementById('menu-new-project');
    const btnOpenProject = document.getElementById('menu-open-project');
    const recentProjectsList = document.getElementById('recent-projects-list');

    if (!initialMenu || !appContainer) return;

    const showApp = () => {
        initialMenu.style.display = 'none';
        appContainer.style.display = 'flex';
    };

    btnNewProject.addEventListener('click', () => {
        showApp();
        newProject();
    });

    btnOpenProject.addEventListener('click', () => {
        showApp();
        openProject();
    });

    // Lógica de projetos recentes
    // (Ainda sem armazenamento persistente, apenas como exemplo)
    if (recentProjectsList) {
        // Limpa a lista atual
        recentProjectsList.innerHTML = '<li><p>Nenhum projeto recente</p></li>';
    }
}

function showCustomAlert(title, text) {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-alert-modal');
        const titleEl = document.getElementById('alert-modal-title');
        const textEl = document.getElementById('alert-modal-text');
        const okBtn = document.getElementById('alert-modal-ok');
        const closeBtn = document.getElementById('alert-modal-close');

        titleEl.textContent = title;
        textEl.textContent = text;

        modal.style.zIndex = "999999999"
        modal.style.display = 'block';

        const close = (value) => {
            modal.style.display = 'none';
            resolve(value);
        };

        okBtn.onclick = () => close(true);
        closeBtn.onclick = () => close(true);
    });
}

function showCustomConfirm(title, text) {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-confirm-modal');
        const titleEl = document.getElementById('confirm-modal-title');
        const textEl = document.getElementById('confirm-modal-text');
        const okBtn = document.getElementById('confirm-modal-ok');
        const cancelBtn = document.getElementById('confirm-modal-cancel');
        const closeBtn = document.getElementById('confirm-modal-close');

        titleEl.textContent = title;
        textEl.textContent = text;

        modal.style.zIndex = "999999999"
        modal.style.display = 'block';

        const close = (value) => {
            modal.style.display = 'none';
            resolve(value);
        };

        okBtn.onclick = () => close(true);
        cancelBtn.onclick = () => close(false);
        closeBtn.onclick = () => close(false);
    });
}

function logToConsoleInPreview(message, type = 'info') {
    if (window.opener) {
        window.opener.postMessage({
            type: 'kreatorjs-log',
            message: message,
            logType: type
        }, '*');
    }
    console.log(`[Preview] ${message}`);
}

// Inicializar a IDE
function initializeIDE() {
    // Configurar área de design
    const canvas = document.getElementById('designer-canvas');
    setupDesignerCanvas(canvas);
    
    // Configurar redimensionamento de painéis
    //setupPanelResize();
    
    // Estado inicial
    updateUI();
    populateGlobalInspector();
}

// Configurar listeners de eventos
function setupEventListeners() {
    // Botões da toolbar
    document.getElementById('btn-new').addEventListener('click', newProject);
    document.getElementById('btn-open').addEventListener('click', openProject);
    document.getElementById('btn-save').addEventListener('click', saveProject);
    document.getElementById('btn-run').addEventListener('click', runProject);
    document.getElementById('btn-package').addEventListener('click', packageProject);
    
    // Controles do designer
    document.getElementById('btn-grid').addEventListener('click', toggleGrid);
    document.getElementById('btn-clear').addEventListener('click', clearDesigner);
    document.getElementById('btn-clear-all').addEventListener('click', clearAll);
    document.getElementById('btn-clear-console').addEventListener('click', clearConsole);
    
    // Modal de código
    document.getElementById('modal-close').addEventListener('click', closeCodeModal);
    document.getElementById('btn-copy-code').addEventListener('click', copyCode);
    document.getElementById('btn-save-code').addEventListener('click', saveCode);
    
    // Listeners IPC do menu (apenas no Electron)
    if (ipcRenderer) {
        ipcRenderer.on('menu-new-project', newProject);
        ipcRenderer.on('menu-open-project', (event, projectPath) => openProject(projectPath));
        ipcRenderer.on('menu-save', saveProject);
        ipcRenderer.on('menu-export-html', () => exportCode('html'));
        ipcRenderer.on('menu-export-js', () => exportCode('js'));
        ipcRenderer.on('menu-export-complete', exportCompleteProject);
        ipcRenderer.on('menu-package-app', packageProject);
        ipcRenderer.on('menu-undo', undo);
        ipcRenderer.on('menu-redo', redo);
    }
    
    // Atalhos de teclado
    document.addEventListener('keydown', handleKeyboard);
    document.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            isSpacePressed = false;
            if (!isPanning) {
                const visualDesigner = document.getElementById('visual-designer');
                if (visualDesigner) visualDesigner.style.cursor = 'default';
            }
        }
    });

    // Panning and Zooming listeners
    const visualDesigner = document.getElementById('visual-designer');
    if (visualDesigner) {
        visualDesigner.addEventListener('wheel', handleWheelZoom, { passive: false });
        visualDesigner.addEventListener('mousedown', handlePanStart);
    }
    // Listen on window to catch mouseup/mousemove even if cursor leaves the designer area
    window.addEventListener('mousemove', handlePanMove);
    window.addEventListener('mouseup', handlePanEnd);
}

// Popular a paleta de componentes
function populateComponentPalette() {
    const palette = document.getElementById('component-palette');
    
    componentLibrary.forEach(component => {
        const item = document.createElement('div');
        item.className = 'component-item';
        item.draggable = true;
        item.dataset.componentType = component.type;
        
        item.innerHTML = `
            <span class="icon">${component.icon}</span>
            <div class="info">
                <div class="name">${component.name}</div>
                <div class="description">${component.description}</div>
            </div>
        `;
        
        // Eventos de drag
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
        
        palette.appendChild(item);
    });
}

// Configurar canvas do designer
function setupDesignerCanvas(canvas) {
    // Eventos de drop
    canvas.addEventListener('dragover', handleDragOver);
    canvas.addEventListener('drop', handleDrop);
    canvas.addEventListener('dragleave', handleDragLeave);
    
    // Clique para deselecionar
    canvas.addEventListener('click', (e) => {
        // Se o clique não foi em um componente de design, deseleciona
        if (!e.target.closest('.designer-component')) {
            selectComponent(null);
        }
    });
}

// Manipuladores de drag and drop
function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.componentType);
    e.target.classList.add('dragging');
    
    // Melhorar feedback visual
    e.dataTransfer.effectAllowed = 'copy';
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    // Só remover se realmente saiu da área
    if (!e.currentTarget.contains(e.relatedTarget)) {
        e.currentTarget.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const componentType = e.dataTransfer.getData('text/plain');
    if (!componentType) return;

    const visualDesigner = document.getElementById('visual-designer');
    if (!visualDesigner) return;
    
    const designerRect = visualDesigner.getBoundingClientRect();
    const viewportX = e.clientX - designerRect.left;
    const viewportY = e.clientY - designerRect.top;

    // Transform viewport coordinates to canvas coordinates
    const x = (viewportX - canvasPanX) / canvasScale;
    const y = (viewportY - canvasPanY) / canvasScale;
    
    // Criar componente imediatamente
    setTimeout(() => {
        createComponent(componentType, Math.max(0, x), Math.max(0, y));
    }, 10);
}

// Criar componente no designer
function createComponent(type, x, y) {
    const componentDef = componentLibrary.find(c => c.type === type);
    if (!componentDef) return;
    
    componentCounter++;
    const componentId = `${type}_${componentCounter}`;
    
    // Criar elemento do componente
    const wrapper = document.createElement('div');
    wrapper.className = 'designer-component';
    wrapper.dataset.componentId = componentId;
    wrapper.dataset.componentType = type;
    wrapper.style.left = x + 'px';
    wrapper.style.top = y + 'px';
    
    // Aplicar propriedades padrão
    const props = { ...componentDef.defaultProps };
    const html = generateComponentHTML(componentDef, props);
    wrapper.innerHTML = html + '<div class="resize-handle"></div><div class="move-handle">✢</div>';
    
    // Aplicar estilos
    applyComponentStyles(wrapper, props);
    
    // Eventos do componente
    setupComponentEvents(wrapper);
    
    // Adicionar ao canvas
    const canvas = document.getElementById('designer-canvas');
    const placeholder = canvas.querySelector('.canvas-placeholder');
    if (placeholder) {
        placeholder.style.display = 'none';
    }
    
    canvas.appendChild(wrapper);
    
    // Selecionar o novo componente
    selectComponent(wrapper);
    
    // Salvar estado para undo
    saveState();
    renderComponentTree();
    
    logToConsole(`Componente ${componentDef.name} adicionado (ID: ${componentId})`, 'success');
}

// Gerar HTML do componente
function generateComponentHTML(componentDef, props) {
    let html = componentDef.html;
    
    // Substituir placeholders
    Object.keys(props).forEach(key => {
        const placeholder = `{{${key}}}`;
        if (html.includes(placeholder)) {
            html = html.replace(new RegExp(placeholder, 'g'), props[key]);
        }
    });
    
    return html;
}

// Aplicar estilos ao componente
function applyComponentStyles(wrapper, props) {
    const element = wrapper.firstElementChild;
    if (!element) return;
    
    // Aplicar estilos CSS
    Object.keys(props).forEach(key => {
        if (key !== 'text' && key !== 'placeholder' && key !== 'src' && key !== 'alt' && key !== 'checked') {
            element.style[key] = props[key];
        }
    });
    
    // Estilos do wrapper
    if (props.width) wrapper.style.width = props.width;
    if (props.height) wrapper.style.height = props.height;
}

// Configurar eventos do componente
function setupComponentEvents(wrapper) {
    // Clique para seleção - melhorar área clicável
    wrapper.addEventListener('click', (e) => {
        e.stopPropagation();
        selectComponent(wrapper);
    });
    
    
    // Drag para mover com a alça de movimento
    const moveHandle = wrapper.querySelector('.move-handle');
    if (moveHandle) {
        moveHandle.addEventListener('mousedown', (e) => {
            // Apenas o botão esquerdo (principal) do mouse deve iniciar o arrasto
            if (e.button !== 0) return;
            e.stopPropagation(); // Prevenir que o clique na alça se propague para outros elementos

            let isDraggingComponent = false;
            let dragStartPos = { x: e.clientX, y: e.clientY };
            let componentStartPos = { x: parseInt(wrapper.style.left) || 0, y: parseInt(wrapper.style.top) || 0 };

            const handleMouseMove = (moveEvent) => {
                const deltaX = moveEvent.clientX - dragStartPos.x;
                const deltaY = moveEvent.clientY - dragStartPos.y;

                if (!isDraggingComponent && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
                    isDraggingComponent = true;
                    document.body.style.cursor = 'grabbing';
                    wrapper.style.cursor = 'grabbing';
                }

                if (isDraggingComponent) {
                    const newX = Math.max(0, componentStartPos.x + (deltaX / canvasScale));
                    const newY = Math.max(0, componentStartPos.y + (deltaY / canvasScale));

                    wrapper.style.left = newX + 'px';
                    wrapper.style.top = newY + 'px';

                    if (selectedComponent === wrapper) {
                        const xInput = document.getElementById('prop-x');
                        const yInput = document.getElementById('prop-y');
                        if (xInput) xInput.value = Math.round(newX);
                        if (yInput) yInput.value = Math.round(newY);
                    }
                }
            };

            const handleMouseUp = () => {
                if (isDraggingComponent) {
                    saveState();
                }
                document.body.style.cursor = '';
                wrapper.style.cursor = '';
                isDraggingComponent = false;
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        });
    }

    // Redimensionamento
    const resizeHandle = wrapper.querySelector('.resize-handle');
    if (resizeHandle) {
        resizeHandle.addEventListener('mousedown', startResize);
    }
    
    // Prevenir interação com elementos durante o modo design
    preventDesignModeInteraction(wrapper);
}

// Prevenir interação com elementos durante o modo design
function preventDesignModeInteraction(wrapper) {
    const element = wrapper.firstElementChild;
    if (!element) return;
    
    // Não aplicar a lógica de prevenção se o elemento estiver dentro de um modal
    if (wrapper.closest('.modal-content')) {
        return;
    }
    
    // Prevenir eventos padrão em elementos interativos durante o design
    const preventDefaultEvents = ['click', 'change', 'input', 'submit', 'focus', 'blur'];
    
    preventDefaultEvents.forEach(eventType => {
        element.addEventListener(eventType, (e) => {
            // Prevenir apenas se estivermos no modo design (não no modo execução)
            if (!isInExecutionMode()) {
                e.preventDefault();
                e.stopPropagation();

                if (eventType === 'click') {
                    selectComponent(wrapper);
                }
                
                // Para checkboxes, prevenir mudança de estado
                if (element.type === 'checkbox') {
                    e.target.checked = !e.target.checked;
                }
            }
        }, true); // Use capture para interceptar antes de outros handlers
    });
    
    // Prevenir seleção de texto em inputs durante o design
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        element.addEventListener('mousedown', (e) => {
            if (!isInExecutionMode()) {
                e.preventDefault();
            }
        });
    }
}

function rgbToHex(rgb) {
    if (!rgb || !rgb.includes('rgb')) return rgb; // Retorna o valor original se não for um RGB válido

    const result = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.exec(rgb);
    if (!result) return rgb;

    const r = parseInt(result[1], 10);
    const g = parseInt(result[2], 10);
    const b = parseInt(result[3], 10);

    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

// Verificar se estamos no modo execução
function isInExecutionMode() {
    // Por enquanto, sempre retorna false (sempre em modo design)
    // Esta função será usada quando implementarmos um modo de preview/execução
    return false;
}

// Selecionar componente
function selectComponent(component) {
    // Remover seleção anterior
    document.querySelectorAll('.designer-component.selected').forEach(el => {
        el.classList.remove('selected');
    });
    
    selectedComponent = component;
    
    if (component) {
        component.classList.add('selected');
        populateObjectInspector(component);
    } else {
        populateGlobalInspector();
    }
    renderComponentTree();
}

// Popular inspetor de objetos
function populateObjectInspector(component) {
    const inspector = document.getElementById("object-inspector");
    const componentType = component.dataset.componentType;
    const componentDef = componentLibrary.find(c => c.type === componentType);
    
    if (!componentDef) return;
    
    // Contar eventos configurados
    const componentId = component.dataset.componentId;
    const events = componentEvents[componentId] || {};
    const eventCount = Object.keys(events).length;
    
    inspector.innerHTML = `
        <div class="property-group">
            <div class="property-group-title">Eventos</div>
            <button class="btn" onclick="showEventEditorModal(selectedComponent, selectedComponent.dataset.componentId, selectedComponent.dataset.componentType)">Editar Eventos</button>
            <div class="event-count">${eventCount} evento(s) configurado(s)</div>
        </div>
        <div class="property-group">
            <div class="property-group-title">Geral</div>
            <div class="property-item">
                <label class="property-label">ID</label>
                <input type="text" class="property-input" value="${component.dataset.componentId}" readonly>
            </div>
            <div class="property-item">
                <label class="property-label">Tipo</label>
                <input type="text" class="property-input" value="${componentDef.name}" readonly>
            </div>
        </div>
        
        <div class="property-group">
            <div class="property-group-title">Posição</div>
            <div class="property-item">
                <label class="property-label">X</label>
                <input type="number" class="property-input" id="prop-x" value="${parseInt(component.style.left)}">
            </div>
            <div class="property-item">
                <label class="property-label">Y</label>
                <input type="number" class="property-input" id="prop-y" value="${parseInt(component.style.top)}">
            </div>
        </div>
        
        <div class="property-group">
            <div class="property-group-title">Propriedades Básicas</div>
            ${generateBasicPropertyInputs(componentDef, component)}
        </div>
        
        <div class="property-group">
            <div class="property-group-title collapsible" id="style-header" onclick="toggleStyleSection()" style='color:rgba(151, 193, 244, 1); font-weight:700;'>
                Estilo <span id="style-arrow">▶</span>
            </div>
            <div class="property-section" id="style-section" style="display: none;">
                ${generateStylePropertyInputs(componentDef, component)}
            </div>
        </div>
    `;
    
    // Configurar listeners das propriedades
    setupPropertyListeners();
}

// Helper function to generate a composite color input (text + color picker)
function generateColorInputHTML(property, value, id = '') {
    // If the value is a variable reference (e.g., "<my_var>"), use a default for the color picker
    const isVar = typeof value === 'string' && value.trim().startsWith('<');
    const colorValue = isVar ? '#ffffff' : value; // Default to white if it's a variable
    const textValue = value; // The text input should show the raw value (including variables)

    return `
        <div class="color-input-wrapper">
            <input type="text" class="property-input" data-property="${property}" value="${textValue}" ${id ? `id="${id}"` : ''}>
            <input type="color" class="color-picker-input" value="${colorValue}">
        </div>
    `;
}

// Gerar inputs de propriedades básicas
function generateBasicPropertyInputs(componentDef, component) {
    const element = component.firstElementChild;
    let html = '';
    
    // Propriedades básicas (não relacionadas a estilo)
    const basicProps = ['text', 'placeholder', 'src', 'alt', 'width', 'height'];
    
    Object.keys(componentDef.defaultProps).forEach(key => {
        if (basicProps.includes(key)) {
            const value = getPropertyValue(element, key);
            const inputType = getInputType(key);
            
            if (key === 'src') {
                // Campo especial para imagens com gerenciador
                html += `
                    <div class="property-item">
                        <label class="property-label">Fonte da Imagem</label>
                        <div style="display: flex; gap: 5px;">
                            <input type="text" class="property-input" data-property="${key}" value="${value}" style="flex: 1;">
                            <button type="button" onclick="openImageManager('${key}')" style="padding: 4px 8px; background: #007acc; color: white; border: none; border-radius: 3px; cursor: pointer;">📁</button>
                        </div>
                    </div>
                `;
            } else {
                html += `
                    <div class="property-item">
                        <label class="property-label">${formatPropertyName(key)}</label>
                        <input type="${inputType}" class="property-input" data-property="${key}" value="${value}">
                    </div>
                `;
            }
        }
    });
    
    // Para lista suspensa, adicionar editor de opções
    if (componentDef.type === 'select') {
        html += `
            <div class="property-item">
                <label class="property-label">Opções da Lista</label>
                <button type="button" onclick="editSelectOptions(selectedComponent)" style="width: 100%; padding: 8px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Editar Opções</button>
            </div>
        `;
    }
    
    return html;
}

// Gerar inputs de propriedades de estilo
function generateStylePropertyInputs(componentDef, component) {
    const element = component.firstElementChild;
    let html = '';

    // Propriedades de estilo básicas
    const styleProps = ['backgroundColor', 'color', 'fontSize', 'fontWeight', 'padding', 'margin'];

    // Seção de bordas
    html += `
        <div class="property-subsection">
            <div class="property-subsection-title">Bordas</div>
            <div class="property-item">
                <label class="property-label">Estilo da Borda</label>
                <select class="property-input" data-property="borderStyle">
                    <option value="none" ${getPropertyValue(element, 'borderStyle') === 'none' ? 'selected' : ''}>Nenhuma</option>
                    <option value="solid" ${getPropertyValue(element, 'borderStyle') === 'solid' ? 'selected' : ''}>Sólida</option>
                    <option value="dashed" ${getPropertyValue(element, 'borderStyle') === 'dashed' ? 'selected' : ''}>Tracejada</option>
                    <option value="dotted" ${getPropertyValue(element, 'borderStyle') === 'dotted' ? 'selected' : ''}>Pontilhada</option>
                    <option value="double" ${getPropertyValue(element, 'borderStyle') === 'double' ? 'selected' : ''}>Dupla</option>
                </select>
            </div>
            <div class="property-item">
                <label class="property-label">Largura da Borda</label>
                <input type="text" class="property-input" data-property="borderWidth" value="${getPropertyValue(element, 'borderWidth') || '1px'}" placeholder="1px">
            </div>
            <div class="property-item">
                <label class="property-label">Cor da Borda</label>
                ${generateColorInputHTML('borderColor', getPropertyValue(element, 'borderColor') || '#000000')}
            </div>
            <div class="property-item">
                <label class="property-label">Raio da Borda</label>
                <input type="text" class="property-input" data-property="borderRadius" value="${getPropertyValue(element, 'borderRadius') || '0px'}" placeholder="0px">
            </div>
        </div>
    `;

    // Seção de cores e texto
    html += `
        <div class="property-subsection">
            <div class="property-subsection-title">Cores e Texto</div>
    `;

    styleProps.forEach(key => {
        const value = getPropertyValue(element, key);
        const inputType = getInputType(key);

        html += `
            <div class="property-item">
                <label class="property-label">${formatPropertyName(key)}</label>
        `;

        if (inputType === 'color') {
            html += generateColorInputHTML(key, value);
        } else {
            html += `<input type="${inputType}" class="property-input" data-property="${key}" value="${value}">`;
        }

        html += `</div>`;
    });

    html += `</div>`;

    // Seção de posicionamento e dimensões
    html += `
        <div class="property-subsection">
            <div class="property-subsection-title">Posicionamento</div>
            <div class="property-item">
                <label class="property-label">Z-Index (Camada)</label>
                <input type="number" class="property-input" data-property="zIndex" value="${element.style.zIndex || '1'}" min="1" max="9999">
            </div>
        </div>
    `;

    // Propriedades extras de estilo
    const extraProperties = [
        { key: 'boxShadow', label: 'Sombra', type: 'text', value: getPropertyValue(element, 'boxShadow') || 'none' },
        { key: 'opacity', label: 'Opacidade', type: 'range', value: getPropertyValue(element, 'opacity') || '1', min: '0', max: '1', step: '0.1' },
        { key: 'transform', label: 'Transformação', type: 'text', value: getPropertyValue(element, 'transform') || 'none' },
        { key: 'cursor', label: 'Cursor', type: 'select', value: getPropertyValue(element, 'cursor') || 'default', options: ['default', 'pointer', 'text', 'move', 'not-allowed', 'grab', 'grabbing'] },
        { key: 'textAlign', label: 'Alinhamento do Texto', type: 'select', value: getPropertyValue(element, 'textAlign') || 'left', options: ['left', 'center', 'right', 'justify'] }
    ];

    html += `
        <div class="property-subsection">
            <div class="property-subsection-title">Propriedades Avançadas</div>
    `;

    extraProperties.forEach(prop => {
        if (prop.type === 'select') {
            html += `
                <div class="property-item">
                    <label class="property-label">${prop.label}</label>
                    <select class="property-input" data-property="${prop.key}">
                        ${prop.options.map(option => 
                            `<option value="${option}" ${prop.value === option ? 'selected' : ''}>${option}</option>`
                        ).join('')}
                    </select>
                </div>
            `;
        } else if (prop.type === 'range') {
            html += `
                <div class="property-item">
                    <label class="property-label">${prop.label}</label>
                    <input type="range" class="property-input" data-property="${prop.key}" 
                           value="${prop.value}" min="${prop.min}" max="${prop.max}" step="${prop.step}">
                    <span class="range-value">${prop.value}</span>
                </div>
            `;
        } else {
            html += `
                <div class="property-item">
                    <label class="property-label">${prop.label}</label>
                    <input type="${prop.type}" class="property-input" data-property="${prop.key}" value="${prop.value}">
                </div>
            `;
        }
    });

    html += `</div>`;

    return html;
}

// Função para alternar seção de estilo
function toggleStyleSection() {
    const section = document.getElementById('style-section');
    const arrow = document.getElementById('style-arrow');
    
    if (section.style.display === 'none') {
        section.style.display = 'block';
        arrow.textContent = '▼';
    } else {
        section.style.display = 'none';
        arrow.textContent = '▶';
    }
}

// Obter valor da propriedade
function getPropertyValue(element, property) {
    const wrapper = element.closest('.designer-component');

    // Prioriza o valor bruto do dataset, se existir
    if (wrapper) {
        const propKey = `rawProp${property.charAt(0).toUpperCase() + property.slice(1)}`;
        if (wrapper.dataset[propKey] !== undefined) {
            return wrapper.dataset[propKey];
        }
    }

    // Fallback para a lógica existente se nenhum valor bruto for encontrado
    const computedStyle = window.getComputedStyle(element);
    let value = computedStyle[property];

    if (!value) {
        value = element.style[property];
    }

    // Lógica específica para cada propriedade
    switch (property) {
        case 'text':
            return element.textContent || element.value || '';
        case 'placeholder':
            return element.placeholder || '';
        case 'src':
            return element.src || '';
        case 'alt':
            return element.alt || '';
        case 'checked':
            return element.checked || false;
        case 'backgroundColor':
        case 'color':
        case 'borderColor':
            return rgbToHex(value);
        default:
            return value || '';
    }
}

// Obter tipo de input
function getInputType(property) {
    if (property.includes('color') || property.includes('Color')) return 'color';
    if (property.includes('width') || property.includes('height') || property.includes('size')) return 'text';
    if (property === 'checked') return 'checkbox';
    return 'text';
}

// Formatar nome da propriedade
function formatPropertyName(property) {
    return property.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

// Configurar listeners das propriedades
function setupPropertyListeners() {
    const inputs = document.querySelectorAll('#object-inspector .property-input[data-property]');
    
    inputs.forEach(input => {
        input.addEventListener('input', (e) => {
            updateComponentProperty(e.target.dataset.property, e.target.value);
        });

        // Attach the suggestion listener for text-based inputs
        attachSuggestionListener(input);
    });

    // Logic to sync color text inputs and color pickers
    const colorWrappers = document.querySelectorAll('#object-inspector .color-input-wrapper');
    colorWrappers.forEach(wrapper => {
        const textInput = wrapper.querySelector('input[type="text"].property-input');
        const colorInput = wrapper.querySelector('input[type="color"].color-picker-input');

        if (textInput && colorInput) {
            // Sync from text input to color picker
            textInput.addEventListener('input', (e) => {
                const value = e.target.value;
                // A simple regex to check for valid hex color format (e.g., #fff, #ffffff)
                if (/^#([0-9A-F]{3}){1,2}$/i.test(value)) {
                    colorInput.value = value;
                }
            });

            // Sync from color picker to text input
            colorInput.addEventListener('input', (e) => {
                textInput.value = e.target.value;
                // Dispatch 'input' event on the text input to trigger the main property update listener
                textInput.dispatchEvent(new Event('input', { bubbles: true }));
            });
        }
    });
    
    // Listeners de posição
    const xInput = document.getElementById('prop-x');
    const yInput = document.getElementById('prop-y');
    
    if (xInput) {
        xInput.addEventListener('input', (e) => {
            if (selectedComponent) {
                selectedComponent.style.left = e.target.value + 'px';
            }
        });
    }
    
    if (yInput) {
        yInput.addEventListener('input', (e) => {
            if (selectedComponent) {
                selectedComponent.style.top = e.target.value + 'px';
            }
        });
    }
}

/**
 * Evaluates a mathematical expression using the Shunting-yard algorithm.
 * Handles operator precedence, parentheses, and variable/component property resolution.
 * @param {string} expression The mathematical expression to evaluate.
 * @returns {number|string} The result of the evaluation or an error string.
 */
function evaluateExpression(expression) {
    const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 };
    const operators = '+-*/()';

    // 1. Tokenizer: Splits the expression into numbers, identifiers, and operators.
    const tokenize = (expr) => {
        // Improved regex to handle identifiers, numbers (including floats), and operators.
        // It also filters out empty strings from whitespace splitting.
        return expr.replace(/([+\-*/()])/g, ' $1 ').trim().split(/\s+/);
    };

    const tokens = tokenize(expression);
    const outputQueue = [];
    const operatorStack = [];

    // 2. Shunting-yard algorithm: Converts infix notation to RPN.
    for (const token of tokens) {
        if (!isNaN(parseFloat(token)) && isFinite(token)) {
            outputQueue.push(parseFloat(token));
        } else if (operators.includes(token)) {
            if (token === '(') {
                operatorStack.push(token);
            } else if (token === ')') {
                while (operatorStack.length && operatorStack[operatorStack.length - 1] !== '(') {
                    outputQueue.push(operatorStack.pop());
                }
                if (operatorStack[operatorStack.length - 1] === '(') {
                    operatorStack.pop();
                }
            } else {
                while (
                    operatorStack.length &&
                    precedence[operatorStack[operatorStack.length - 1]] >= precedence[token] &&
                    operatorStack[operatorStack.length - 1] !== '('
                ) {
                    outputQueue.push(operatorStack.pop());
                }
                operatorStack.push(token);
            }
        } else { // It's an identifier
            outputQueue.push(token);
        }
    }
    while (operatorStack.length > 0) {
        outputQueue.push(operatorStack.pop());
    }

    // 3. RPN Evaluator
    const evaluationStack = [];
    const resolveIdentifier = (identifier) => {
        if (identifier.includes('.')) {
            const [componentId, propName] = identifier.split('.');
            const component = document.querySelector(`.designer-component[data-component-id="${componentId}"]`);
            if (component) {
                // Recursively resolve the value, which might be another expression
                const resolvedProp = resolveValueInIDE(getPropertyValue(component.firstElementChild, propName));
                const num = parseFloat(resolvedProp);
                if (isNaN(num)) throw new Error(`Property '${identifier}' is not a number.`);
                return num;
            }
        } else if (projectVariables.hasOwnProperty(identifier)) {
            const val = projectVariables[identifier].value;
             if (typeof val !== 'number') throw new Error(`Variable '${identifier}' is not a number.`);
            return val;
        }
        throw new Error(`Unknown identifier: ${identifier}`);
    };

    for (const token of outputQueue) {
        if (typeof token === 'number') {
            evaluationStack.push(token);
        } else if (operators.includes(token)) {
            const b = evaluationStack.pop();
            const a = evaluationStack.pop();
            switch (token) {
                case '+': evaluationStack.push(a + b); break;
                case '-': evaluationStack.push(a - b); break;
                case '*': evaluationStack.push(a * b); break;
                case '/':
                    if (b === 0) return 'Infinity';
                    evaluationStack.push(a / b);
                    break;
            }
        } else { // It's an identifier
            evaluationStack.push(resolveIdentifier(token));
        }
    }

    if (evaluationStack.length !== 1) {
        throw new Error('Invalid expression');
    }

    return evaluationStack[0];
}

function resolveValueInIDE(value) {
    if (typeof value !== 'string') {
        return value;
    }

    // Quick check to avoid regex on strings without expressions
    if (!value.includes('<') || !value.includes('>')) {
        return value;
    }

    const expressionRegex = /<([^>]+)>/g;

    return value.replace(expressionRegex, (match, expression) => {
        try {
            // If expression is a simple reference, handle it directly to support non-numeric types
            if (!/[-+*/()]/.test(expression)) {
                 if (expression.includes('.')) {
                    const [componentId, propName] = expression.split('.');
                    const component = document.querySelector(`.designer-component[data-component-id="${componentId}"]`);
                    if (component) {
                        const element = component.firstElementChild;
                        if (element) {
                            return getPropertyValue(element, propName);
                        }
                    }
                } else if (projectVariables.hasOwnProperty(expression)) {
                    const variable = projectVariables[expression];
                    if (variable.type === 'object' || variable.type === 'array') {
                        return JSON.stringify(variable.value);
                    }
                    return variable.value;
                }
            }
            // Otherwise, use the full expression evaluator for arithmetic
            return evaluateExpression(expression);
        } catch (error) {
            console.warn(`Error evaluating expression "${expression}":`, error.message);
            return match; // On error, return the original placeholder
        }
    });
}

function applyPropertyToComponent(component, property, value) {
    if (!component) return;
    const element = component.firstElementChild;
    if (!element) return;

    // This is the logic moved from updateComponentProperty
    switch (property) {
        case 'text':
            if (element.tagName === 'LABEL' && element.querySelector('input[type="checkbox"]')) {
                const checkbox = element.querySelector('input[type="checkbox"]');
                const checkboxState = checkbox.checked;
                element.innerHTML = `<input type="checkbox" ${checkboxState ? 'checked' : ''}> ${value}`;
                const newCheckbox = element.querySelector('input[type="checkbox"]');
                newCheckbox.addEventListener('click', (e) => {
                    if (!isInExecutionMode()) e.preventDefault();
                });
            } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.value = value;
            } else {
                element.textContent = value;
            }
            break;
        case 'placeholder': element.placeholder = value; break;
        case 'src': element.src = value; break;
        case 'alt': element.alt = value; break;
        case 'checked':
            if (element.type === 'checkbox' || element.querySelector('input[type="checkbox"]')) {
                const checkbox = element.type === 'checkbox' ? element : element.querySelector('input[type="checkbox"]');
                if (checkbox) checkbox.checked = (value === 'true' || value === true);
            }
            break;
        case 'borderStyle': element.style.borderStyle = value; break;
        case 'borderWidth': element.style.borderWidth = value; break;
        case 'borderColor': element.style.borderColor = value; break;
        case 'borderRadius': element.style.borderRadius = value; break;
        case 'zIndex':
            let zIndexValue = parseInt(value) || 1;
            if (zIndexValue < 1) zIndexValue = 1;
            element.style.zIndex = zIndexValue;
            component.style.zIndex = zIndexValue;
            break;
        default:
            element.style[property] = value;
            break;
    }

    if (property === 'width') component.style.width = value;
    if (property === 'height') component.style.height = value;
}

function updateAllDynamicProperties() {
    const allComponents = document.querySelectorAll('.designer-component');
    allComponents.forEach(component => {
        // The component.dataset object is a map of all data-* attributes.
        for (const key in component.dataset) {
            if (key.startsWith('rawProp')) { // e.g., rawPropBackgroundColor
                const propName = key.substring('rawProp'.length); // -> BackgroundColor
                const propertyName = propName.charAt(0).toLowerCase() + propName.slice(1); // -> backgroundColor
                const rawValue = component.dataset[key];
                
                // Always resolve and apply. This handles both initial application and updates.
                const resolvedValue = resolveValueInIDE(rawValue);
                applyPropertyToComponent(component, propertyName, resolvedValue);
            }
        }
    });
}

// Atualizar propriedade do componente
function updateComponentProperty(property, value) {
    if (!selectedComponent) return;

    // Step 1: Store the raw, unresolved value.
    const propKey = `rawProp${property.charAt(0).toUpperCase() + property.slice(1)}`;
    selectedComponent.dataset[propKey] = value;

    // Step 2: Trigger a global update to resolve all dynamic properties.
    updateAllDynamicProperties();

    // Step 3: Save the state for undo/redo.
    saveState();
}

// Popular o inspetor com configurações globais
function populateGlobalInspector() {
    const inspector = document.getElementById("object-inspector");
    const appBoundary = document.getElementById('app-boundary');

    // Ensure we have default values if they are missing from the project settings
    const currentWidth = globalProjectSettings.width || 800;
    const currentHeight = globalProjectSettings.height || 600;
    const currentBgColor = globalProjectSettings.backgroundColor || '#ffffff';
    const currentOverflow = globalProjectSettings.overflow || 'visible';

    inspector.innerHTML = `
        <div class="property-group">
            <div class="property-group-title">Configurações da Aplicação</div>
             <div class="property-item">
                <label class="property-label">Largura da Tela (px)</label>
                <input type="number" class="property-input" id="global-width" value="${currentWidth}" min="100">
            </div>
            <div class="property-item">
                <label class="property-label">Altura da Tela (px)</label>
                <input type="number" class="property-input" id="global-height" value="${currentHeight}" min="100">
            </div>
            <div class="property-item">
                <label class="property-label">Cor de Fundo</label>
                ${generateColorInputHTML('backgroundColor', currentBgColor, 'global-bg-color')}
            </div>
            <div class="property-item">
                <label class="property-label">Overflow</label>
                <select class="property-input" id="global-overflow">
                    <option value="visible" ${currentOverflow === 'visible' ? 'selected' : ''}>Visível</option>
                    <option value="hidden" ${currentOverflow === 'hidden' ? 'selected' : ''}>Oculto</option>
                    <option value="scroll" ${currentOverflow === 'scroll' ? 'selected' : ''}>Scroll</option>
                    <option value="auto" ${currentOverflow === 'auto' ? 'selected' : ''}>Automático</option>
                </select>
            </div>
        </div>
        <div class="property-group">
            <div class="property-group-title">Eventos Globais</div>
            <button class="btn" onclick="showEventEditorModal(null, 'global', 'global')">Editar Eventos Globais</button>
        </div>
    `;
    
    const applyAppSettings = () => {
        if (appBoundary) {
            appBoundary.style.width = `${globalProjectSettings.width}px`;
            appBoundary.style.height = `${globalProjectSettings.height}px`;
            appBoundary.style.backgroundColor = globalProjectSettings.backgroundColor;
            appBoundary.style.overflow = globalProjectSettings.overflow;
        }
    };

    applyAppSettings();

    const widthInput = document.getElementById('global-width');
    if (widthInput) {
        widthInput.addEventListener('input', (e) => {
            globalProjectSettings.width = parseInt(e.target.value) || 800;
            applyAppSettings();
            saveState();
        });
    }

    const heightInput = document.getElementById('global-height');
    if (heightInput) {
        heightInput.addEventListener('input', (e) => {
            globalProjectSettings.height = parseInt(e.target.value) || 600;
            applyAppSettings();
            saveState();
        });
    }

    const bgColorInput = document.getElementById('global-bg-color');
    if (bgColorInput) {
        const wrapper = bgColorInput.closest('.color-input-wrapper');
        const colorInput = wrapper ? wrapper.querySelector('.color-picker-input') : null;

        // Listener for the text input
        bgColorInput.addEventListener('input', (e) => {
            const value = e.target.value;
            globalProjectSettings.backgroundColor = value;
            if (colorInput && /^#([0-9A-F]{3}){1,2}$/i.test(value)) {
                colorInput.value = value;
            }
            applyAppSettings();
            saveState();
        });

        // Listener for the color picker
        if (colorInput) {
            colorInput.addEventListener('input', (e) => {
                bgColorInput.value = e.target.value;
                // Dispatch event to trigger the text input's listener for a single point of update
                bgColorInput.dispatchEvent(new Event('input', { bubbles: true }));
            });
        }
    }

    const overflowInput = document.getElementById('global-overflow');
    if (overflowInput) {
        overflowInput.addEventListener('input', (e) => {
            globalProjectSettings.overflow = e.target.value;
            applyAppSettings();
            saveState();
        });
    }
}

// Sistema de eventos
const eventSystem = {
    // Eventos disponíveis por tipo de componente
    availableEvents: {
        button: [
            { name: 'click', label: 'Clicado', description: 'Quando o botão for clicado' },
            { name: 'mouseover', label: 'Mouse sobre', description: 'Quando o mouse passar sobre o botão' },
            { name: 'mouseout', label: 'Mouse fora', description: 'Quando o mouse sair do botão' }
        ],
        input: [
            { name: 'input', label: 'Texto alterado', description: 'Quando o texto for alterado' },
            { name: 'focus', label: 'Focado', description: 'Quando o campo receber foco' },
            { name: 'blur', label: 'Desfocado', description: 'Quando o campo perder foco' },
            { name: 'keypress', label: 'Tecla pressionada', description: 'Quando uma tecla for pressionada' }
        ],
        textarea: [
            { name: 'input', label: 'Texto alterado', description: 'Quando o texto for alterado' },
            { name: 'focus', label: 'Focado', description: 'Quando o campo receber foco' },
            { name: 'blur', label: 'Desfocado', description: 'Quando o campo perder foco' }
        ],
        select: [
            { name: 'change', label: 'Seleção alterada', description: 'Quando a seleção for alterada' },
            { name: 'focus', label: 'Focado', description: 'Quando o campo receber foco' },
            { name: 'blur', label: 'Desfocado', description: 'Quando o campo perder foco' }
        ],
        checkbox: [
            { name: 'change', label: 'Estado alterado', description: 'Quando o estado for alterado' },
            { name: 'click', label: 'Clicado', description: 'Quando for clicado' }
        ],
        label: [
            { name: 'click', label: 'Clicado', description: 'Quando o rótulo for clicado' },
            { name: 'mouseover', label: 'Mouse sobre', description: 'Quando o mouse passar sobre' },
            { name: 'mouseout', label: 'Mouse fora', description: 'Quando o mouse sair' }
        ],
        div: [
            { name: 'click', label: 'Clicado', description: 'Quando o painel for clicado' },
            { name: 'mouseover', label: 'Mouse sobre', description: 'Quando o mouse passar sobre' },
            { name: 'mouseout', label: 'Mouse fora', description: 'Quando o mouse sair' }
        ],
        image: [
            { name: 'click', label: 'Clicado', description: 'Quando a imagem for clicada' },
            { name: 'load', label: 'Carregada', description: 'Quando a imagem for carregada' },
            { name: 'error', label: 'Erro ao carregar', description: 'Quando houver erro ao carregar' }
        ],
        global: [
            { name: 'load', label: 'Ao Carregar a Página', description: 'Quando a página termina de carregar' },
            { name: 'unload', label: 'Ao Fechar a Página', description: 'Quando o usuário fecha a página' },
            { name: 'loop', label: 'Loop (Temporizador)', description: 'Executa ações repetidamente em um intervalo de tempo' }
        ]
    },
    
    // Ações disponíveis para elementos
    availableActions: {
        // Ações para elementos de texto (label, input, textarea)
        text: [
            { id: 'change_style', name: 'Alterar Estilo', description: 'Alterar o estilo do elemento' },
            { id: 'change_text', name: 'Alterar Texto', description: 'Mudar o texto do elemento' },
            { id: 'show_hide', name: 'Mostrar/Ocultar', description: 'Mostrar ou ocultar o elemento' },
            { id: 'move_element', name: 'Mover Elemento', description: 'Alterar posição do elemento' },
        ],
        
        // Ações para elementos visuais (div, image, button)
        visual: [
            { id: 'change_style', name: 'Alterar Estilo', description: 'Alterar o estilo do elemento' },
            { id: 'change_text', name: 'Alterar Texto', description: 'Mudar o texto do elemento' },
            { id: 'show_hide', name: 'Mostrar/Ocultar', description: 'Mostrar ou ocultar o elemento' },
            { id: 'move_element', name: 'Mover Elemento', description: 'Alterar posição do elemento' },
        ],
        
        // Ações para inputs (exceto checkbox)
        input: [
            { id: 'change_style', name: 'Alterar Estilo', description: 'Alterar o estilo do elemento' },
            { id: 'change_value', name: 'Alterar Valor', description: 'Mudar o valor do campo' },
            { id: 'clear_value', name: 'Limpar Valor', description: 'Limpar o conteúdo do campo' },
            { id: 'focus_element', name: 'Focar Elemento', description: 'Dar foco ao campo' },
            { id: 'disable_enable', name: 'Habilitar/Desabilitar', description: 'Habilitar ou desabilitar o campo' },
            { id: 'show_hide', name: 'Mostrar/Ocultar', description: 'Mostrar ou ocultar o elemento' },
            { id: 'move_element', name: 'Mover Elemento', description: 'Alterar posição do elemento' },
        ],
        
        // Ações específicas para checkbox
        checkbox: [
            { id: 'change_style', name: 'Alterar Estilo', description: 'Alterar o estilo do elemento' },
            { id: 'change_checkbox_text', name: 'Mudar Texto do Checkbox', description: 'Mudar o texto do elemento checkbox' },
            { id: 'toggle_checkbox', name: 'Alternar Checkbox', description: 'Marcar/desmarcar checkbox' },
            { id: 'disable_enable', name: 'Habilitar/Desabilitar', description: 'Habilitar ou desabilitar o checkbox' },
            { id: 'show_hide', name: 'Mostrar/Ocultar', description: 'Mostrar ou ocultar o elemento' },
            { id: 'move_element', name: 'Mover Elemento', description: 'Alterar posição do elemento' }
        ],
        
        // Ações globais
        global: [
            { id: 'show_alert', name: 'Mostrar Alerta', description: 'Exibir uma mensagem de alerta' },
            { id: 'console_log', name: 'Log no Console', description: 'Escrever mensagem no console do programa' },
            { id: 'redirect_page', name: 'Redirecionar Página', description: 'Navegar para outra página' },
            { id: 'manipulate_variable', name: 'Manipular Variáveis', description: 'Alterar o valor de uma variável' }
        ]
    }
};

// Editar evento do componente
function editComponentEvent(component) {
    if (!component) return;
    
    const componentId = component.dataset.componentId;
    const componentType = component.dataset.componentType;
    
    showEventEditorModal(component, componentId, componentType);
    logToConsole(`Editando eventos do componente ${componentId}`, 'info');
}

// Variavel para guardar o estado dos eventos antes de abrir o modal
let eventsBackup = null;

// Mostrar modal do editor de eventos
function showEventEditorModal(component, componentId, componentType) {
    // Fazer backup do estado atual dos eventos
    eventsBackup = {
        componentEvents: JSON.parse(JSON.stringify(componentEvents)),
        globalEvents: JSON.parse(JSON.stringify(globalEvents))
    };

    const isGlobal = componentType === 'global';
    // Criar modal
    const modal = document.createElement('div');
    modal.id = 'event-editor-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        backdrop-filter: blur(2px);
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background-color: #252526;
        border: 1px solid #3e3e42;
        padding: 0;
        border-radius: 8px;
        width: 90%;
        max-width: 1100px;
        height: 80%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    `;
    
    // Obter eventos disponíveis para este tipo de componente
    const availableEvents = eventSystem.availableEvents[componentType] || [];
    
    // Obter eventos já configurados
    const currentEvents = isGlobal ? globalEvents : getCurrentComponentEvents(componentId);
    
    modalContent.innerHTML = `
        <div style="padding: 20px; border-bottom: 1px solid #3e3e42; background: #333333;">
            <h2 style="margin: 0; color: #00c3ffff;">Editor de Eventos - ${isGlobal ? 'Eventos Globais' : componentId}</h2>
            <p style="margin: 5px 0 0 0; color: #cccccc;">Configure os eventos e ações para ${isGlobal ? 'o projeto' : 'este componente'}</p>
        </div>
        
        <div style="flex: 1; display: flex; overflow: hidden; background-color: #252526;">
            <!-- Lista de eventos -->
            <div style="width: 300px; border-right: 1px solid #3e3e42; overflow-y: auto; background-color: #2d2d30;">
                <div style="padding: 15px; border-bottom: 1px solid #3e3e42; background: #333333;">
                    <h3 style="margin: 0; font-size: 14px; color: #ffffff;">EVENTOS DISPONÍVEIS</h3>
                </div>
                <div id="events-list" style="padding: 10px;">
                    ${availableEvents.map(event => `
                        <div class="event-item" data-event-name="${event.name}" style="
                            padding: 10px;
                            margin-bottom: 8px;
                            border: 1px solid #3e3e42;
                            border-radius: 4px;
                            cursor: pointer;
                            transition: all 0.2s;
                            background-color: #3e3e42;
                            ${currentEvents[event.name] ? 'background: #007acc; border-color: #007acc;' : ''}
                        " onmouseover="this.style.backgroundColor='#4f4f53'" onmouseout="this.style.backgroundColor='${currentEvents[event.name] ? '#007acc' : '#3e3e42'}'">
                            <div style="font-weight: bold; color: #ffffff; margin-bottom: 2px;">${event.label}</div>
                            <div style="font-size: 12px; color: #cccccc;">${event.description}</div>
                            ${currentEvents[event.name] ? `
                                <div style="font-size: 11px; color: #ffffff; margin-top: 4px; display: flex; justify-content: space-between; align-items: center;">
                                    <span>✓ Configurado (${currentEvents[event.name].length} ação/ões)</span>
                                    <button onclick="selectEventForEditing('${event.name}', '${componentType}', '${componentId}')" style="
                                        background: #28a745;
                                        color: white;
                                        border: none;
                                        padding: 2px 6px;
                                        border-radius: 3px;
                                        font-size: 10px;
                                        cursor: pointer;
                                    ">Editar</button>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- Editor de ações -->
            <div style="flex: 1; display: flex; flex-direction: column;">
                <div style="padding: 15px; border-bottom: 1px solid #3e3e42; background: #333333;">
                    <h3 style="margin: 0; font-size: 14px; color: #ffffff;">CONFIGURAR AÇÕES</h3>
                    <div id="selected-event-info" style="margin-top: 5px; font-size: 12px; color: #cccccc;">
                        Selecione um evento à esquerda para configurar suas ações
                    </div>
                </div>
                
                <div id="actions-editor" style="flex: 1; padding: 20px; overflow-y: auto; color: #ffffff;">
                    <div style="text-align: center; color: #999; margin-top: 50px;">
                        <p>Selecione um evento para começar a configurar as ações</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div style="padding: 20px; border-top: 1px solid #3e3e42; background: #333333; text-align: right;">
            <button id="cancel-events" class="btn">Cancelar</button>
            <button id="save-events" class="btn primary">Salvar Eventos</button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Event listeners
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeEventEditorModal(false); // Cancelar
        }
    });
    
    document.getElementById('cancel-events').addEventListener('click', () => closeEventEditorModal(false));
    document.getElementById('save-events').addEventListener('click', () => {
        if (isGlobal) {
            saveGlobalEvents();
        } else {
            saveComponentEvents(componentId);
        }
        closeEventEditorModal(true); // Salvar
    });
    
    // Event listeners para eventos
    document.querySelectorAll('.event-item').forEach(item => {
        item.addEventListener('click', () => {
            selectEventForEditing(item.dataset.eventName, componentType, componentId);
        });
    });

    // Se já houver um evento configurado, selecioná-lo para edição
    const firstConfiguredEvent = Object.keys(currentEvents)[0];
    if (firstConfiguredEvent) {
        selectEventForEditing(firstConfiguredEvent, componentType, componentId);
    }
}

// Fechar modal do editor de eventos
function closeEventEditorModal(isSaving = false) {
    const modal = document.getElementById('event-editor-modal');
    if (modal) {
        modal.remove();
    }

    if (!isSaving && eventsBackup) {
        // Se não estiver salvando (ou seja, cancelou), restaura o backup
        componentEvents = eventsBackup.componentEvents;
        globalEvents = eventsBackup.globalEvents;
    }
    eventsBackup = null; // Limpa o backup
}

function showStyleEditorModal(targetId, existingStyles, callback) {
    const modalId = 'style-editor-modal';
    if (document.getElementById(modalId)) return;

    const targetComponent = document.querySelector(`.designer-component[data-component-id="${targetId}"]`);
    if (!targetComponent) {
        logToConsole(`Elemento alvo "${targetId}" não encontrado para o editor de estilo.`, 'error');
        return;
    }
    const element = targetComponent.firstElementChild;
    if (!element) return;

    const componentType = targetComponent.dataset.componentType;
    const componentDef = componentLibrary.find(c => c.type === componentType);
    if (!componentDef) return;

    const modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'modal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background-color: rgba(0,0,0,0.6); display: flex; justify-content: center;
        align-items: center; z-index: 10002; backdrop-filter: blur(2px);
    `;

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.cssText = `
        max-width: 500px; height: auto; max-height: 80vh; display: flex;
        flex-direction: column;
    `;

    modalContent.innerHTML = `
        <div class="modal-header">
            <h3>Editor de Estilo - ${targetId}</h3>
            <button class="close-btn">&times;</button>
        </div>
        <div class="modal-body" style="max-height: 60vh; overflow-y: auto;">
            ${generateStylePropertyInputs(componentDef, targetComponent)}
        </div>
        <div class="modal-footer">
            <button class="btn btn-cancel">Cancelar</button>
            <button id="btn-save-style-changes" class="btn primary">Salvar Alterações</button>
        </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    const initialStyles = {};
    const inputs = modal.querySelectorAll('.property-input[data-property]');

    inputs.forEach(input => {
        const prop = input.dataset.property;

        // Use existingStyles if provided, otherwise get from the component
        if (existingStyles && existingStyles[prop] !== undefined) {
            initialStyles[prop] = existingStyles[prop];
        } else {
            initialStyles[prop] = getPropertyValue(element, prop);
        }

        input.value = initialStyles[prop];

        // Also update the color picker part of a composite input
        if (input.closest('.color-input-wrapper')) {
            const colorInput = input.closest('.color-input-wrapper').querySelector('.color-picker-input');
            if (colorInput) {
                const isVar = typeof initialStyles[prop] === 'string' && initialStyles[prop].trim().startsWith('<');
                colorInput.value = isVar ? '#ffffff' : initialStyles[prop];
            }
        }
    });

    const closeModal = () => {
        modal.remove();
    };

    modal.querySelector('.close-btn').addEventListener('click', closeModal);
    modal.querySelector('.btn-cancel').addEventListener('click', closeModal);
    modal.querySelector('#btn-save-style-changes').addEventListener('click', () => {
        const changedStyles = {};
        inputs.forEach(input => {
            const prop = input.dataset.property;
            const currentValue = input.value;
            // Only include the style if it has actually changed from the initial state
            if (currentValue !== initialStyles[prop]) {
                changedStyles[prop] = currentValue;
            }
        });

        if (callback) {
            callback(changedStyles);
        }
        closeModal();
    });
}

function showManipulateVariableModal(callback) {
    const modalId = 'manipulate-variable-modal';
    if (document.getElementById(modalId)) return;

    const modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.style.zIndex = '10001'; // Ensure it's on top of the event editor

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.maxWidth = '500px';
    modalContent.style.height = 'auto';

    modalContent.innerHTML = `
        <div class="modal-header">
            <h3>Manipular Variável</h3>
            <button class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
            <div class="property-item">
                <label class="property-label">Variável</label>
                <select id="modal-manip-var-name" class="property-input">
                    ${Object.keys(projectVariables).map(name => `<option value="${name}">${name}</option>`).join('')}
                </select>
            </div>
            <div class="property-item">
                <label class="property-label">Operação</label>
                <select id="modal-manip-var-op" class="property-input">
                    <option value="set">Definir (=)</option>
                    <option value="add">Adicionar (+)</option>
                    <option value="subtract">Subtrair (-)</option>
                    <option value="multiply">Multiplicar (*)</option>
                    <option value="divide">Dividir (/)</option>
                </select>
            </div>
            <div class="property-item">
                <label class="property-label">Valor</label>
                <div style="display: flex; gap: 5px; align-items: center;">
                    <input type="text" id="modal-manip-var-value" class="property-input" style="flex: 1;">
                    <button id="btn-get-prop" class="btn" style="padding: 8px 12px;">Pegar propriedade</button>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-cancel">Cancelar</button>
            <button id="btn-confirm-manip-var" class="btn primary">Confirmar</button>
        </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Attach suggestion listener to the value input
    const valueInput = document.getElementById('modal-manip-var-value');
    attachSuggestionListener(valueInput);

    const closeModal = () => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.remove();
        }
    };

    modal.querySelector('.close-btn').addEventListener('click', closeModal);
    modal.querySelector('.btn-cancel').addEventListener('click', closeModal);

    const opSelect = document.getElementById('modal-manip-var-op');
    const getPropBtn = document.getElementById('btn-get-prop');

    const toggleGetPropButton = () => {
        getPropBtn.style.display = opSelect.value === 'set' ? 'block' : 'none';
    };

    opSelect.addEventListener('change', toggleGetPropButton);
    toggleGetPropButton(); // Set initial state

    getPropBtn.addEventListener('click', () => {
        // A função para mostrar o modal de seleção de propriedade será chamada aqui
        showPropertySelectorModal((propertyReference) => {
            document.getElementById('modal-manip-var-value').value = propertyReference;
        });
    });

    const confirmBtn = document.getElementById('btn-confirm-manip-var');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            const varName = document.getElementById('modal-manip-var-name').value;
            const operation = document.getElementById('modal-manip-var-op').value;
            const value = document.getElementById('modal-manip-var-value').value;

            if (varName) {
                const actionValue = `${varName},${operation},${value}`;
                if (callback) {
                    callback(actionValue);
                }
            }
            closeModal();
        });
    } else {
        console.error("Botão de confirmação do modal de manipulação de variável não encontrado.");
    }
}

function showConditionEditorModal(existingCondition, callback) {
    const modalId = 'condition-editor-modal';
    if (document.getElementById(modalId)) return;

    const modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.style.zIndex = '10002'; // On top of event editor

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.maxWidth = '600px';
    modalContent.style.height = 'auto';

    // Populate targets for the dropdown
    let targetsHTML = '<option value="">Selecione um alvo...</option>';
    // Add variables
    Object.keys(projectVariables).forEach(name => {
        targetsHTML += `<option value="var:${name}">${name} (Variável)</option>`;
    });
    // Add component properties
    const allComponents = document.querySelectorAll('.designer-component');
    allComponents.forEach(component => {
        const componentId = component.dataset.componentId;
        const componentType = component.dataset.componentType;
        const componentDef = componentLibrary.find(c => c.type === componentType);
        if (componentDef) {
            const props = Object.keys(componentDef.defaultProps);
            if (['input', 'textarea', 'select'].includes(componentType)) props.push('value');
            if (componentType === 'checkbox') props.push('checked');

            props.forEach(prop => {
                targetsHTML += `<option value="prop:${componentId}.${prop}">${componentId}.${prop} (Propriedade)</option>`;
            });
        }
    });


    modalContent.innerHTML = `
        <div class="modal-header">
            <h3>Editor de Condição</h3>
            <button class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
            <div class="property-item">
                <label class="property-label">Alvo da Condição</label>
                <select id="modal-cond-target" class="property-input">
                    ${targetsHTML}
                </select>
            </div>
            <div class="property-item">
                <label class="property-label">Operador</label>
                <select id="modal-cond-operator" class="property-input">
                    <option value="==">Igual (==)</option>
                    <option value="!=">Diferente (!=)</option>
                    <option value=">">Maior que (>)</option>
                    <option value="<">Menor que (<)</option>
                    <option value=">=">Maior ou igual que (>=)</option>
                    <option value="<=">Menor ou igual que (<=)</option>
                    <option value="contains">Contém</option>
                    <option value="not_contains">Não contém</option>
                </select>
            </div>
            <div class="property-item">
                <label class="property-label">Valor a Comparar</label>
                <input type="text" id="modal-cond-value" class="property-input">
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-cancel">Cancelar</button>
            <button id="btn-confirm-condition" class="btn primary">Confirmar</button>
        </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Pre-fill if editing
    if (existingCondition) {
        document.getElementById('modal-cond-target').value = existingCondition.target || '';
        document.getElementById('modal-cond-operator').value = existingCondition.operator || '==';
        document.getElementById('modal-cond-value').value = existingCondition.value || '';
    }

    const valueInput = document.getElementById('modal-cond-value');
    attachSuggestionListener(valueInput);

    const closeModal = () => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.remove();
        }
    };

    modal.querySelector('.close-btn').addEventListener('click', closeModal);
    modal.querySelector('.btn-cancel').addEventListener('click', closeModal);

    document.getElementById('btn-confirm-condition').addEventListener('click', () => {
        const target = document.getElementById('modal-cond-target').value;
        const operator = document.getElementById('modal-cond-operator').value;
        const value = document.getElementById('modal-cond-value').value;

        if (target && operator) {
            if (callback) {
                callback({ target, operator, value });
            }
        }
        closeModal();
    });
}

// Selecionar evento para edição
function selectEventForEditing(eventName, componentType, componentId) {
    const isGlobal = componentType === 'global';
    // Salvar evento anterior se existir
    if (currentEditingEvent && currentEditingEvent !== eventName) {
        if (isGlobal) {
            saveCurrentGlobalEventActions(currentEditingEvent);
        } else {
            saveCurrentEventActions(componentId, currentEditingEvent);
        }
    }
    
    // Definir evento atual
    currentEditingEvent = eventName;
    
    // Destacar evento selecionado
    document.querySelectorAll('.event-item').forEach(item => {
        const isSelected = item.dataset.eventName === eventName;
        const isConfigured = item.querySelector('div > span')?.textContent.includes('Configurado');

        item.style.backgroundColor = isSelected ? '#007acc' : (isConfigured ? '#0e639c' : '#3c3c3c');
        item.style.borderColor = isSelected ? '#0099ff' : '#5a5a5a';
        
        // Reset hover styles to re-apply them correctly
        item.onmouseover = function() { this.style.backgroundColor = isSelected ? '#007acc' : '#4a4a4a'; };
        item.onmouseout = function() { this.style.backgroundColor = isSelected ? '#007acc' : (isConfigured ? '#0e639c' : '#3c3c3c'); };
    });
    
    // Atualizar info do evento selecionado
    const eventInfo = eventSystem.availableEvents[componentType].find(e => e.name === eventName);
    document.getElementById('selected-event-info').innerHTML = `
        Configurando: <strong style="color: #569cd6;">${eventInfo.label}</strong> &mdash; <span style="color: #9d9d9d;">${eventInfo.description}</span>
    `;
    
    // Carregar editor de ações
    loadActionsEditor(eventName, componentType, componentId);
}

// Carregar editor de ações
function loadActionsEditor(eventName, componentType, componentId) {
    const actionsEditor = document.getElementById('actions-editor');
    const isGlobal = componentType === 'global';
    
    let currentActions = [];
    let loopInterval = 1000; // Default interval

    if (isGlobal) {
        if (eventName === 'loop') {
            const loopConfig = globalEvents[eventName] || { interval: 1000, actions: [] };
            currentActions = loopConfig.actions || [];
            loopInterval = loopConfig.interval || 1000;
        } else {
            currentActions = globalEvents[eventName] || [];
        }
    } else {
        currentActions = getCurrentEventActions(componentId, eventName);
    }

    const loopIntervalHTML = isGlobal && eventName === 'loop' ? `
        <div class="property-item" style="margin-bottom: 20px; padding: 15px; background: #2d2d30; border-radius: 4px; border: 1px solid #3e3e42;">
            <label class="property-label" style="font-weight: bold; color: #d4d4d4;">Intervalo do Loop (ms):</label>
            <input type="number" id="loop-interval" class="property-input" value="${loopInterval}" style="background: #3c3c3c; border-color: #5a5a5a; color: #d4d4d4; padding: 8px; border-radius: 3px;">
            <small style="color: #9d9d9d; margin-top: 5px; display: block;">Define o tempo em milissegundos entre cada execução das ações.</small>
        </div>
    ` : '';
    
    actionsEditor.innerHTML = `
        ${loopIntervalHTML}
        <div style="margin-bottom: 20px;">
            <h4 style="margin: 0 0 10px 0; color: #569cd6; font-size: 14px; text-transform: uppercase;">Ações para este evento:</h4>
            <div id="actions-list">
                ${currentActions.map((action, index) => renderActionItem(action, index)).join('')}
            </div>
             <button id="add-action" class="btn primary" style="margin-top: 10px;">
                + Adicionar Ação
            </button>
        </div>
        
        <div id="action-selector" style="display: none; margin-top: 20px; padding: 20px; background: #2d2d30; border-radius: 6px; border: 1px solid #3e3e42;">
            <h4 style="margin: 0 0 15px 0; color: #569cd6; font-size: 14px; text-transform: uppercase;">Selecionar Ação:</h4>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #d4d4d4; font-size: 12px;">Elemento Alvo:</label>
                <select id="target-element" class="property-input" style="width: 100%;">
                    <option value="">Selecione um elemento...</option>
                    ${getAllComponentsForSelection(componentId).map(comp => 
                        `<option value="${comp.id}">${comp.id} (${comp.type})</option>`
                    ).join('')}
                    <option value="global">Ação Global</option>
                </select>
            </div>
            <div id="available-actions" style="margin-bottom: 15px;">
                <!-- Ações serão carregadas dinamicamente -->
            </div>
            <div style="text-align: right; margin-top: 20px; border-top: 1px solid #3e3e42; padding-top: 15px;">
                <button id="cancel-action" class="btn">Cancelar</button>
                <button id="confirm-action" class="btn primary" style="margin-left: 8px;">Adicionar</button>
            </div>
        </div>
    `;
    
    // Event listeners
    document.getElementById('add-action').addEventListener('click', showActionSelector);
    
    // Configurar listeners para ações existentes
    setupActionListeners(eventName, componentType, componentId, currentActions);

    // Drag and Drop para reordenar ações
    const actionsList = document.getElementById('actions-list');
    let draggedItem = null;

    actionsList.addEventListener('dragstart', e => {
        draggedItem = e.target;
        e.target.classList.add('dragging');
    });

    actionsList.addEventListener('dragend', e => {
        e.target.classList.remove('dragging');
        draggedItem = null;
    });

    actionsList.addEventListener('dragover', e => {
        e.preventDefault(); // Necessário para permitir o drop
    });

    actionsList.addEventListener('drop', e => {
        e.preventDefault();
        if (!draggedItem) return;

        const afterElement = getDragAfterElement(actionsList, e.clientY);
        if (afterElement == null) {
            actionsList.appendChild(draggedItem);
        } else {
            actionsList.insertBefore(draggedItem, afterElement);
        }

        // Re-indexar todos os itens
        const items = actionsList.querySelectorAll('.action-item');
        items.forEach((item, index) => {
            item.dataset.index = index;
            // Atualizar também o data-index nos botões internos se necessário
            item.querySelectorAll('[data-index]').forEach(btn => {
                btn.dataset.index = index;
            });
        });
    });

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.action-item:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
}

// Helper to highlight variables and truncate long values
function formatActionValue(value) {
    if (typeof value !== 'string') {
        value = String(value || '');
    }

    // Highlight variables/properties/expressions. Use a specific color.
    let formattedValue = value.replace(/<([^>]+)>/g, '<span style="color: #c586c0; font-weight: bold;">&lt;$1&gt;</span>');

    // Truncate if necessary
    if (value.length > 50) {
        let truncated = value.substring(0, 47) + '...';
        // Re-highlight after truncating
        return truncated.replace(/<([^>]+)>/g, '<span style="color: #c586c0; font-weight: bold;">&lt;$1&gt;</span>');
    }

    return formattedValue;
}

// Renderizar item de ação
function renderActionItem(action, index) {
    const escapedValue = (action.value || '').replace(/"/g, '&quot;');
    const escapedCondition = action.condition ? JSON.stringify(action.condition).replace(/'/g, "\\'") : '';
    let actionTitle = '';
    let actionDetails = '';

    const highlight = (val) => formatActionValue(val);

    switch (action.actionType) {
        case 'manipulate_variable':
            const [varName, operation, ...valueParts] = (action.value || ',,').split(',');
            const value = valueParts.join(','); // Re-join in case value has commas
            const target = `<span style="color: #9cdcfe;">${varName}</span>`;
            const val = highlight(value);
            switch (operation) {
                case 'set':
                    if (value.includes('<') && value.includes('.')) {
                        actionTitle = 'Manipulação de variável | Propriedade de objeto';
                        const [obj, prop] = value.replace(/[<>]/g, '').split('.');
                        actionDetails = `Definir ${target} para a propriedade <span style="color: #4ec9b0;">${prop}</span> de <span style="color: #ce9178;">${obj}</span>`;
                    } else {
                        actionTitle = 'Manipulação de variável | Definir';
                        actionDetails = `Definir ${target} para ${val}`;
                    }
                    break;
                case 'add':
                    actionTitle = 'Manipulação de variável | Adicionar';
                    actionDetails = `Adicionar ${val} para ${target}`;
                    break;
                case 'subtract':
                    actionTitle = 'Manipulação de variável | Diminuir';
                    actionDetails = `Diminuir ${val} de ${target}`;
                    break;
                case 'multiply':
                    actionTitle = 'Manipulação de variável | Multiplicar';
                    actionDetails = `Multiplicar ${val} com ${target}`;
                    break;
                case 'divide':
                    actionTitle = 'Manipulação de variável | Dividir';
                    actionDetails = `Dividir ${val} de ${target}`;
                    break;
                default:
                    actionTitle = 'Manipulação de variável';
                    actionDetails = `Operação desconhecida em ${target}`;
            }
            break;

        case 'change_text':
            actionTitle = 'Alterar texto';
            actionDetails = `Mudar texto de <span style="color: #4ec9b0;">${action.targetId}</span> para ${highlight(action.value)}`;
            break;

        case 'show_hide':
            actionTitle = 'Mostrar/Ocultar';
            let operationText = action.value;
            if(action.value === 'show') operationText = 'Mostrar';
            if(action.value === 'hide') operationText = 'Ocultar';
            if(action.value === 'toggle') operationText = 'Alternar visibilidade de';
            actionDetails = `${operationText} <span style="color: #4ec9b0;">${action.targetId}</span>`;
            break;

        case 'show_alert':
            actionTitle = 'Mostrar Alerta';
            actionDetails = `Exibir alerta com texto: ${highlight(action.value)}`;
            break;

        case 'console_log':
            actionTitle = 'Log no Console';
            actionDetails = `Escrever no console: ${highlight(action.value)}`;
            break;

        default:
            // Fallback for other actions
            actionTitle = action.actionName || action.actionType.replace(/_/g, ' '); // Use actionName or format actionType
            actionDetails = `Alvo: <span style="color: #4ec9b0;">${action.targetId || 'Global'}</span> | Valor: ${highlight(action.value)}`;
            break;
    }

    let conditionDetails = '';
    let conditionButtonClass = '';
    if (action.condition && action.condition.target) {
        const { target, operator, value } = action.condition;
        // Sanitize the operator to prevent injection issues, although it comes from a select menu
        const safeOperator = ['==', '!=', '>', '<', '>=', '<=', 'contains', 'not_contains'].includes(operator) ? operator : '==';
        const targetName = target.startsWith('var:') ? target.substring(4) : target.substring(5);
        conditionDetails = `
            <div style="font-size: 11px; color: #569cd6; margin-top: 5px; padding-top: 5px; border-top: 1px solid #4a4a4a;">
                <strong>Condição:</strong> Se ${targetName} ${safeOperator} ${highlight(value)}
            </div>
        `;
        conditionButtonClass = 'active';
    }

    return `
        <div class="action-item" draggable="true" data-index="${index}" data-target-id="${action.targetId || 'global'}" data-action-type="${action.actionType}" data-action-value="${escapedValue}" data-action-condition='${escapedCondition}' style="
            padding: 12px;
            margin-bottom: 8px;
            border: 1px solid #5a5a5a;
            border-radius: 6px;
            background: #3c3c3c;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.2s;
        " onmouseover="this.style.backgroundColor='#4a4a4a'" onmouseout="this.style.backgroundColor='#3c3c3c'">
            <div>
                <div style="font-weight: bold; color: #d4d4d4; margin-bottom: 4px; cursor: move;">${actionTitle}</div>
                <div style="font-size: 12px; color: #cccccc;">
                   ${actionDetails}
                </div>
                ${conditionDetails}
            </div>
            <div style="display: flex; gap: 5px;">
                <button class="condition-action btn ${conditionButtonClass}" data-index="${index}">Condição</button>
                <button class="edit-action btn" data-index="${index}">Editar</button>
                <button class="remove-action btn" data-index="${index}" style="background-color: #dc3545;">Remover</button>
            </div>
        </div>
    `;
}

// Mostrar seletor de ação
function showActionSelector(actionToEdit = null) {
    const actionSelector = document.getElementById('action-selector');
    actionSelector.style.display = 'block';

    const confirmButton = document.getElementById('confirm-action');
    const title = actionSelector.querySelector('h4');

    if (actionToEdit) {
        title.textContent = 'Editar Ação';
        confirmButton.textContent = 'Salvar Alterações';
    } else {
        title.textContent = 'Selecionar Ação';
        confirmButton.textContent = 'Adicionar';
    }

    // Preencher os campos se estiver editando
    if (actionToEdit) {
        const targetElementSelect = document.getElementById('target-element');
        targetElementSelect.value = actionToEdit.targetId || 'global';
        
        // Disparar o evento 'change' para carregar as ações disponíveis
        updateAvailableActions(actionToEdit);

    } else {
        // Limpar campos se estiver adicionando uma nova
        document.getElementById('target-element').value = '';
        document.getElementById('available-actions').innerHTML = '';
    }
    
    // Event listeners
    document.getElementById('target-element').addEventListener('change', () => updateAvailableActions());
    document.getElementById('cancel-action').addEventListener('click', hideActionSelector);
    // Remover listener antigo para evitar duplicação
    const newConfirmButton = confirmButton.cloneNode(true);
    confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
    newConfirmButton.addEventListener('click', () => saveAction(actionToEdit));
}

// Esconder seletor de ação
function hideActionSelector() {
    document.getElementById('action-selector').style.display = 'none';
    editingActionIndex = null; // Limpar o índice de edição
}

// Atualizar ações disponíveis baseado no elemento alvo
function updateAvailableActions(actionToEdit = null) {
    const targetSelect = document.getElementById('target-element');
    const targetId = targetSelect.value;
    const actionsContainer = document.getElementById('available-actions');
    
    if (!targetId) {
        actionsContainer.innerHTML = '';
        return;
    }
    
    let availableActions = [];
    
    if (targetId === 'global') {
        availableActions = eventSystem.availableActions.global;
    } else {
        // Determinar tipo de ações baseado no tipo do elemento alvo
        const targetComponent = document.querySelector(`[data-component-id="${targetId}"]`);
        if (targetComponent) {
            const targetType = targetComponent.dataset.componentType;
            
            if (['label'].includes(targetType)) {
                availableActions = eventSystem.availableActions.text;
            } else if (targetType === 'checkbox') {
                availableActions = eventSystem.availableActions.checkbox;
            } else if (['input', 'textarea', 'select'].includes(targetType)) {
                availableActions = eventSystem.availableActions.input;
            } else if (['div', 'image', 'button'].includes(targetType)) {
                availableActions = eventSystem.availableActions.visual;
            } else {
                availableActions = eventSystem.availableActions.visual;
            }
        }
    }
    
    actionsContainer.innerHTML = `
        <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #d4d4d4; font-size: 12px;">Ação:</label>
        <select id="action-type" class="property-input" style="width: 100%; margin-bottom: 10px;">
            <option value="">Selecione uma ação...</option>
            ${availableActions.map(action => 
                `<option value="${action.id}">${action.name} - ${action.description}</option>`
            ).join('')}
        </select>
        <div id="action-parameters" style="margin-top: 15px; border-top: 1px solid #3e3e42; padding-top: 15px;">
            <!-- Parâmetros serão carregados dinamicamente -->
        </div>
    `;
    
    document.getElementById('action-type').addEventListener('change', () => updateActionParameters());

    if (actionToEdit) {
        const actionTypeSelect = document.getElementById('action-type');
        actionTypeSelect.value = actionToEdit.actionType;
        updateActionParameters(actionToEdit.value);
    }
}

// Atualizar parâmetros da ação
function updateActionParameters(valueToSet = null) {
    const actionType = document.getElementById('action-type').value;
    const parametersContainer = document.getElementById('action-parameters');
    
    if (!actionType) {
        parametersContainer.innerHTML = '';
        return;
    }
    
    // Gerar campos de parâmetros baseado no tipo de ação
    let parametersHTML = '';
    
    switch (actionType) {
        case 'change_style':
            const targetId = document.getElementById('target-element').value;
            const escapedValueToSet = (valueToSet || '{}').replace(/"/g, '&quot;');
            parametersHTML = `
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Estilos a serem alterados:</label>
                <input type="hidden" id="action-value" value="${escapedValueToSet}">
                <button type="button" id="open-style-editor" class="btn primary" style="width: 100%; padding: 8px;">Abrir Editor de Estilo</button>
                <div id="style-preview" style="margin-top: 10px; font-size: 12px; color: #9d9d9d; max-height: 50px; overflow-y: auto;">...</div>
            `;
            parametersContainer.innerHTML = parametersHTML;

            const updatePreview = (styles) => {
                const previewDiv = document.getElementById('style-preview');
                const styleCount = Object.keys(styles).length;
                if (styleCount === 0) {
                    previewDiv.textContent = 'Nenhuma alteração de estilo definida.';
                } else {
                    previewDiv.innerHTML = `<strong>${styleCount} alteração(ões):</strong> ` + Object.entries(styles).map(([k, v]) => `${k}: ${v}`).join(', ');
                }
            };
            
            let existingStyles = {};
            try {
                existingStyles = JSON.parse(valueToSet || '{}');
            } catch (e) {
                logToConsole(`Erro ao parsear estilos existentes: ${e.message}`, 'warning');
            }
            updatePreview(existingStyles);

            document.getElementById('open-style-editor').addEventListener('click', () => {
                let currentStyles = {};
                try {
                    currentStyles = JSON.parse(document.getElementById('action-value').value || '{}');
                } catch (e) {
                     logToConsole(`Erro ao parsear estilos atuais do input: ${e.message}`, 'warning');
                }

                showStyleEditorModal(targetId, currentStyles, (changedStyles) => {
                    const valueInput = document.getElementById('action-value');
                    const newStyles = { ...currentStyles, ...changedStyles };
                    valueInput.value = JSON.stringify(newStyles);
                    updatePreview(newStyles);
                });
            });
            return;

        case 'change_text':
        case 'change_value':
        case 'show_alert':
        case 'show_custom_alert':
        case 'change_checkbox_text':
        case 'console_log':
            parametersHTML = `
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Valor:</label>
                <input type="text" id="action-value" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" value="${valueToSet || ''}">
            `;
            break;
        case 'move_element':
            const posValues = valueToSet ? valueToSet.split(',') : ['100', '100'];
            parametersHTML = `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Nova posição X (px):</label>
                        <input type="number" id="action-value-x" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" value="${posValues[0]}">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Nova posição Y (px):</label>
                        <input type="number" id="action-value-y" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" value="${posValues[1]}">
                    </div>
                </div>
            `;
            break;
        case 'show_hide':
        case 'toggle_checkbox':
        case 'disable_enable':
            parametersHTML = `
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Ação:</label>
                <select id="action-value" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    ${actionType === 'show_hide' ? `
                        <option value="show" ${valueToSet === 'show' ? 'selected' : ''}>Mostrar</option>
                        <option value="hide" ${valueToSet === 'hide' ? 'selected' : ''}>Ocultar</option>
                        <option value="toggle" ${valueToSet === 'toggle' ? 'selected' : ''}>Alternar</option>
                    ` : actionType === 'toggle_checkbox' ? `
                        <option value="check" ${valueToSet === 'check' ? 'selected' : ''}>Marcar</option>
                        <option value="uncheck" ${valueToSet === 'uncheck' ? 'selected' : ''}>Desmarcar</option>
                        <option value="toggle" ${valueToSet === 'toggle' ? 'selected' : ''}>Alternar</option>
                    ` : `
                        <option value="enable" ${valueToSet === 'enable' ? 'selected' : ''}>Habilitar</option>
                        <option value="disable" ${valueToSet === 'disable' ? 'selected' : ''}>Desabilitar</option>
                    `}
                </select>
            `;
            break;
        case 'redirect_page':
            parametersHTML = `
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">URL:</label>
                <input type="url" id="action-value" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" value="${valueToSet || ''}">
            `;
            break;
        case 'manipulate_variable':
            parametersHTML = `
                <input type="hidden" id="action-value" value="${valueToSet || ''}">
                <button type="button" onclick="showManipulateVariableModal(value => document.getElementById('action-value').value = value)" style="width: 100%; padding: 8px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Abrir Editor de Variáveis</button>
            `;
            break;
        default:
            parametersHTML = '';
    }
    
    parametersContainer.innerHTML = parametersHTML;

    // Add event listener for suggestions on the main value input
    const actionValueInput = document.getElementById('action-value');
    attachSuggestionListener(actionValueInput);
}

// Gerar código de evento
function generateEventCode(componentId, componentType) {
    let eventName = 'onClick';
    
    switch (componentType) {
        case 'input':
        case 'textarea':
            eventName = 'onChange';
            break;
        case 'select':
            eventName = 'onChange';
            break;
        default:
            eventName = 'onClick';
    }
    
    return `// Evento ${eventName} para ${componentId}
function ${componentId}_${eventName}(event) {
    // Adicione sua lógica aqui
    console.log('${eventName} disparado para ${componentId}');
    
    // Exemplo: obter o elemento
    const element = event.target;
    
    // Exemplo: obter valor (para inputs)
    // const value = element.value;
    
    // Exemplo: alterar propriedades
    // element.style.backgroundColor = 'red';
    
    // Seu código personalizado aqui...
}

// Registrar o evento
document.addEventListener('DOMContentLoaded', function() {
    const element = document.getElementById('${componentId}');
    if (element) {
        element.addEventListener('${eventName.toLowerCase().substring(2)}', ${componentId}_${eventName});
    }
});`;
}

// Templates de projeto
const projectTemplates = [
    {
        id: 'blank',
        name: 'Projeto em Branco',
        description: 'Projeto vazio para começar do zero',
        globalSettings: {
            width: 800,
            height: 600,
            backgroundColor: '#ffffff'
        },
        components: []
    },
    {
        id: 'form',
        name: 'Formulário de Contato',
        description: 'Template com formulário básico',
        globalSettings: {
            width: 450,
            height: 450,
            backgroundColor: '#f0f0f0'
        },
        components: [
            {
                id: 'label_1',
                type: 'label',
                position: { x: 50, y: 50 },
                size: { width: 'auto', height: 'auto' },
                properties: { text: 'Nome:', fontSize: '16px', fontWeight: 'bold', color: '#000000' },
                events: {}
            },
            {
                id: 'input_1',
                type: 'input',
                position: { x: 50, y: 80 },
                size: { width: '300px', height: '30px' },
                properties: { placeholder: 'Digite seu nome...', fontSize: '14px' },
                events: {}
            },
            {
                id: 'label_2',
                type: 'label',
                position: { x: 50, y: 130 },
                size: { width: 'auto', height: 'auto' },
                properties: { text: 'Email:', fontSize: '16px', fontWeight: 'bold', color: '#000000' },
                events: {}
            },
            {
                id: 'input_2',
                type: 'input',
                position: { x: 50, y: 160 },
                size: { width: '300px', height: '30px' },
                properties: { placeholder: 'Digite seu email...', fontSize: '14px' },
                events: {}
            },
            {
                id: 'label_3',
                type: 'label',
                position: { x: 50, y: 210 },
                size: { width: 'auto', height: 'auto' },
                properties: { text: 'Mensagem:', fontSize: '16px', fontWeight: 'bold', color: '#000000' },
                events: {}
            },
            {
                id: 'textarea_1',
                type: 'textarea',
                position: { x: 50, y: 240 },
                size: { width: '300px', height: '100px' },
                properties: { placeholder: 'Digite sua mensagem...', fontSize: '14px' },
                events: {}
            },
            {
                id: 'button_1',
                type: 'button',
                position: { x: 50, y: 360 },
                size: { width: '100px', height: '35px' },
                properties: { text: 'Enviar', backgroundColor: '#007acc', color: '#ffffff' },
                events: {}
            }
        ]
    },
    {
        id: 'dashboard',
        name: 'Dashboard Simples',
        description: 'Template com layout de dashboard',
        globalSettings: {
            width: 800,
            height: 600,
            backgroundColor: '#000000ff'
        },
        components: [
            {
                id: 'div_1',
                type: 'div',
                position: { x: 20, y: 20 },
                size: { width: '760px', height: '60px' },
                properties: { backgroundColor: '#000000', borderRadius: '8px' },
                events: {}
            },
            {
                id: 'label_1',
                type: 'label',
                position: { x: 40, y: 40 },
                size: { width: 'auto', height: 'auto' },
                properties: { text: 'Dashboard', fontSize: '24px', fontWeight: 'bold', color: '#ffffff' },
                events: {}
            },
            {
                id: 'div_2',
                type: 'div',
                position: { x: 20, y: 100 },
                size: { width: '240px', height: '150px' },
                properties: { backgroundColor: '#3498db', borderRadius: '8px' },
                events: {}
            },
            {
                id: 'label_2',
                type: 'label',
                position: { x: 40, y: 120 },
                size: { width: 'auto', height: 'auto' },
                properties: { text: 'Vendas', fontSize: '18px', fontWeight: 'bold', color: '#ffffff' },
                events: {}
            },
            {
                id: 'label_3',
                type: 'label',
                position: { x: 40, y: 150 },
                size: { width: 'auto', height: 'auto' },
                properties: { text: 'R$ 12.500', fontSize: '32px', fontWeight: 'bold', color: '#ffffff' },
                events: {}
            },
            {
                id: 'div_3',
                type: 'div',
                position: { x: 280, y: 100 },
                size: { width: '240px', height: '150px' },
                properties: { backgroundColor: '#e74c3c', borderRadius: '8px' },
                events: {}
            },
            {
                id: 'label_4',
                type: 'label',
                position: { x: 300, y: 120 },
                size: { width: 'auto', height: 'auto' },
                properties: { text: 'Pedidos', fontSize: '18px', fontWeight: 'bold', color: '#ffffff' },
                events: {}
            },
            {
                id: 'label_5',
                type: 'label',
                position: { x: 300, y: 150 },
                size: { width: 'auto', height: 'auto' },
                properties: { text: '47', fontSize: '32px', fontWeight: 'bold', color: '#ffffff' },
                events: {}
            },
            {
                id: 'div_4',
                type: 'div',
                position: { x: 540, y: 100 },
                size: { width: '240px', height: '150px' },
                properties: { backgroundColor: '#27ae60', borderRadius: '8px' },
                events: {}
            },
            {
                id: 'label_6',
                type: 'label',
                position: { x: 560, y: 120 },
                size: { width: 'auto', height: 'auto' },
                properties: { text: 'Clientes', fontSize: '18px', fontWeight: 'bold', color: '#ffffff' },
                events: {}
            },
            {
                id: 'label_7',
                type: 'label',
                position: { x: 560, y: 150 },
                size: { width: 'auto', height: 'auto' },
                properties: { text: '1.234', fontSize: '32px', fontWeight: 'bold', color: '#ffffff' },
                events: {}
            }
        ]
    }
];

// Funções da toolbar
function newProject() {
    showTemplateSelectionModal();
}

// Mostrar modal de seleção de template
function showTemplateSelectionModal() {
    // Criar modal dinamicamente
    const modal = document.createElement('div');
    modal.id = 'template-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 8px;
        max-width: 600px;
        width: 90%;
        max-height: 80%;
        overflow-y: auto;
    `;
    
    modalContent.innerHTML = `
        <h2 style="margin-top: 0; color: #333;">Escolher Template</h2>
        <p style="color: #666; margin-bottom: 20px;">Selecione um template para começar seu projeto:</p>
        <div id="template-list" style="display: grid; gap: 15px;">
            ${projectTemplates.map(template => `
                <div class="template-item" data-template-id="${template.id}" style="
                    border: 2px solid #ddd;
                    border-radius: 8px;
                    padding: 15px;
                    cursor: pointer;
                    transition: all 0.3s;
                " onmouseover="this.style.borderColor='#007acc'" onmouseout="this.style.borderColor='#ddd'">
                    <h3 style="margin: 0 0 8px 0; color: #333;">${template.name}</h3>
                    <p style="margin: 0; color: #666; font-size: 14px;">${template.description}</p>
                    <small style="color: #999;">${template.components.length} componentes</small>
                </div>
            `).join('')}
        </div>
        <div style="margin-top: 20px; text-align: right;">
            <button id="cancel-template" style="
                background: #ccc;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                margin-right: 10px;
                cursor: pointer;
            ">Cancelar</button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Event listeners
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeTemplateModal();
        }
    });
    
    document.getElementById('cancel-template').addEventListener('click', closeTemplateModal);
    
    // Template selection
    document.querySelectorAll('.template-item').forEach(item => {
        item.addEventListener('click', () => {
            const templateId = item.dataset.templateId;
            createProjectFromTemplate(templateId);
            closeTemplateModal();
        });
    });
}

// Fechar modal de template
function closeTemplateModal() {
    const modal = document.getElementById('template-modal');
    if (modal) {
        modal.remove();
    }
}

// Criar projeto a partir de template
async function createProjectFromTemplate(templateId) {
    const template = projectTemplates.find(t => t.id === templateId);
    if (!template) return;
    
    if (currentProject || document.querySelectorAll('.designer-component').length > 0 || Object.keys(projectVariables).length > 0) {
        const confirmed = await showCustomConfirm('Criar Novo Projeto', 'Todas as alterações não salvas serão perdidas. Deseja continuar?');
        if (!confirmed) {
            return;
        }
    }
    
    // Limpar tudo
    await clearAll(false);

    // O estado já foi resetado pelo clearAll.
    // Agora, apenas carregamos os componentes do template.

    // Aplicar configurações globais do template, se existirem
    if (template.globalSettings) {
        Object.assign(globalProjectSettings, template.globalSettings);
        const canvas = document.getElementById('designer-canvas');
        if (canvas && template.globalSettings.backgroundColor) {
            canvas.style.backgroundColor = template.globalSettings.backgroundColor;
        }
        populateGlobalInspector(); // Atualiza o inspetor com a nova cor
    }
    
    // Carregar componentes do template
    if (template.components.length > 0) {
        loadProjectComponents(template.components);
        
        // Atualizar contador baseado nos componentes carregados
        const maxId = Math.max(...template.components.map(c => {
            const match = c.id.match(/_(\d+)$/);
            return match ? parseInt(match[1]) : 0;
        }));
        componentCounter = maxId;
    }
    
    // Salvar estado inicial
    saveState();
    
    logToConsole(`Novo projeto criado usando template: ${template.name}`, 'success');
}

async function openProject(projectPath) {
    try {
        let filePath = typeof projectPath === 'string' ? projectPath : null;

        if (!filePath && ipcRenderer) {
            const result = await ipcRenderer.invoke("show-open-dialog", {
                filters: [{ name: "Projetos KreatorJS", extensions: ["kjs"] }, { name: "Todos os arquivos", extensions: ["*"] }],
                properties: ["openFile"]
            });

            if (result.canceled || result.filePaths.length === 0) return;
            filePath = result.filePaths[0];
        } else if (!filePath) {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.kjs';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const projectData = JSON.parse(e.target.result);
                            loadProjectFromData(projectData);
                            updateUI()
                            logToConsole(`Projeto carregado: ${file.name}`, "success");
                        } catch (error) {
                            logToConsole(`Erro ao analisar o arquivo de projeto (JSON inválido): ${error.message}`, "error");
                            showCustomAlert('Erro ao Abrir Projeto', 'O arquivo de projeto selecionado está corrompido ou em um formato inválido.');
                        }
                    };
                    reader.readAsText(file);
                }
            };
            input.click();
            return;
        }

        if (ipcRenderer && filePath) {
            const readResult = await ipcRenderer.invoke("read-file", filePath);

            if (!readResult.success) {
                logToConsole(`Erro ao abrir projeto: ${readResult.error}`, "error");
                return;
            }

            try {
                const projectData = JSON.parse(readResult.content);
                loadProjectFromData(projectData);
                updateUI()

                currentProject = { path: filePath, data: projectData };
                logToConsole(`Projeto carregado: ${filePath}`, "success");
            } catch (error) {
                logToConsole(`Erro ao analisar o arquivo de projeto (JSON inválido): ${error.message}`, "error");
                showCustomAlert('Erro ao Abrir Projeto', 'O arquivo de projeto selecionado está corrompido ou em um formato inválido.');
            }
        }
    } catch (error) {
        logToConsole(`Erro ao abrir projeto: ${error.message}`, "error");
    }
}

// Função auxiliar para carregar projeto a partir dos dados
function loadProjectFromData(projectData) {
    // Limpar estado atual antes de carregar o novo
    clearAll(false);

    // Carregar configurações globais, se existirem
    if (projectData.globalSettings) {
        globalProjectSettings = projectData.globalSettings;
    }

    // Aplicar configurações globais na UI
    const canvas = document.getElementById('designer-canvas');
    if (canvas) {
        canvas.style.backgroundColor = globalProjectSettings.backgroundColor || '#ffffff';
        canvas.style.overflow = globalProjectSettings.overflow || 'visible';
    }
    
    // Carregar componentes
    loadProjectComponents(projectData.components);
    
    componentCounter = projectData.componentCounter || 0;
    
    // Carregar eventos
    componentEvents = projectData.events || {};
    globalEvents = projectData.globalEvents || {};

    // Carregar variáveis
    projectVariables = projectData.variables || {};
    renderVariableList();

    // Atualizar o inspetor de objetos para refletir o estado carregado (global)
    populateGlobalInspector();
}

async function saveProject() {
    try {
        const existingPath = currentProject?.path;
        const projectData = collectProjectData();
        const jsonContent = JSON.stringify(projectData, null, 2);

        // "Save" logic (for existing projects in Electron)
        if (existingPath && isElectron) {
            const saveResult = await ipcRenderer.invoke("save-file", existingPath, jsonContent);
            if (saveResult.success) {
                currentProject.data = projectData; // Just update the data object
                logToConsole(`Projeto salvo: ${existingPath}`, "success");
            } else {
                logToConsole(`Erro ao salvar projeto: ${saveResult.error}`, "error");
                showCustomAlert('Erro ao Salvar', `Não foi possível salvar o arquivo: ${saveResult.error}`);
            }
        } else {
            // "Save As" logic (for new projects or web version)
            if (isElectron) {
                const result = await ipcRenderer.invoke("show-save-dialog", {
                    defaultPath: "meu-projeto.kjs",
                    filters: [{ name: "Projetos KreatorJS", extensions: ["kjs"] }],
                });

                if (result.canceled) return;
                
                const newPath = result.filePath;
                const saveResult = await ipcRenderer.invoke("save-file", newPath, jsonContent);

                if (saveResult.success) {
                    currentProject = { path: newPath, data: projectData };
                    logToConsole(`Projeto salvo em: ${newPath}`, "success");
                } else {
                    logToConsole(`Erro ao salvar novo projeto: ${saveResult.error}`, "error");
                    showCustomAlert('Erro ao Salvar', `Não foi possível salvar o arquivo: ${saveResult.error}`);
                }
            } else {
                // Web version: always downloads the file
                const blob = new Blob([jsonContent], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'projeto.kjs';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                logToConsole("Projeto baixado como projeto.kjs", "success");
            }
        }
    } catch (error) {
        logToConsole(`Erro inesperado ao salvar projeto: ${error.message}`, "error");
        showCustomAlert('Erro Inesperado', `Ocorreu um erro ao salvar: ${error.message}`);
    }
}

function runProject() {
    // Gerar e executar o projeto
    const htmlCode = generateHTML();
    const jsCode = generateJavaScriptWithEvents();
    const { width, height, backgroundColor, overflow } = globalProjectSettings;
    
    // Criar janela de preview
    const previewWindow = window.open('', '_blank', `width=${width || 800},height=${height || 600}`);
    previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Preview - KreatorJS</title>
            <style>
                body { 
                    margin: 0; 
                    font-family: Arial, sans-serif; 
                    background-color: ${backgroundColor};
                    overflow: ${overflow || 'visible'};
                }
            </style>
        </head>
        <body>
            ${htmlCode}
            <script>${jsCode}</script>
        </body>
        </html>
    `);
    previewWindow.document.close();

    // Adicionar um listener para mensagens da janela de preview
    window.addEventListener('message', (event) => {
        if (event.source === previewWindow) {
            const { type, message, logType } = event.data;
            if (type === 'kreatorjs-log') {
                logToConsole(message, logType);
            }
        }
    });
    
    logToConsole('Projeto executado em nova janela', 'success');
}

function packageProject() {
    // Implementar empacotamento
    logToConsole('Funcionalidade de empacotamento em desenvolvimento', 'warning');
}

// Gerar código HTML
function generateHTML() {
    const canvas = document.getElementById('designer-canvas');
    const components = canvas.querySelectorAll('.designer-component');
    
    let html = '<div style="position: relative; width: 100%; height: 100vh;">\n';
    
    components.forEach(component => {
        const element = component.firstElementChild;
        
        // Usar style.left e style.top para obter a posição não escalonada
        const x = parseInt(component.style.left) || 0;
        const y = parseInt(component.style.top) || 0;
        
        // Clonar elemento e adicionar posicionamento
        const clone = element.cloneNode(true);
        clone.id = component.dataset.componentId;
        clone.style.position = 'absolute';
        clone.style.left = x + 'px';
        clone.style.top = y + 'px';
        
        html += '  ' + clone.outerHTML + '\n';
    });
    
    html += '</div>';
    return html;
}

// Exportar código
function exportCode(type) {
    let code, title;
    
    if (type === 'html') {
        code = generateHTML();
        title = 'HTML Gerado';
    } else if (type === 'js') {
        code = generateJavaScriptWithEvents();
        title = 'JavaScript Gerado';
    }
    
    showCodeModal(title, code);
}

// Mostrar modal de código
function showCodeModal(title, code) {
    const modal = document.getElementById('code-modal');
    const modalTitle = document.getElementById('modal-title');
    const codeEditor = document.getElementById('code-editor');
    
    modalTitle.textContent = title;
    codeEditor.value = code;
    modal.style.display = 'block';
}

// Fechar modal de código
function closeCodeModal() {
    document.getElementById('code-modal').style.display = 'none';
}

// Copiar código
function copyCode() {
    const codeEditor = document.getElementById('code-editor');
    codeEditor.select();
    document.execCommand('copy');
    logToConsole('Código copiado para a área de transferência', 'success');
}

// Salvar código
async function saveCode() {
    const codeEditor = document.getElementById('code-editor');
    const title = document.getElementById('modal-title').textContent;
    
    const extension = title.includes('HTML') ? 'html' : 'js';
    const defaultName = `projeto.${extension}`;
    
    try {
        const result = await ipcRenderer.invoke('show-save-dialog', {
            defaultPath: defaultName,
            filters: [
                { name: extension.toUpperCase(), extensions: [extension] },
                { name: 'Todos os arquivos', extensions: ['*'] }
            ]
        });
        
        if (!result.canceled) {
            const saveResult = await ipcRenderer.invoke('save-file', result.filePath, codeEditor.value);
            
            if (saveResult.success) {
                logToConsole(`Arquivo salvo: ${result.filePath}`, 'success');
                closeCodeModal();
            } else {
                logToConsole(`Erro ao salvar arquivo: ${saveResult.error}`, 'error');
            }
        }
    } catch (error) {
        logToConsole(`Erro ao salvar arquivo: ${error.message}`, 'error');
    }
}

// Outras funções utilitárias
function toggleGrid() {
    const canvas = document.getElementById('designer-canvas');
    canvas.classList.toggle('show-grid');
}

async function clearDesigner(confirm = true) {
    const doClear = confirm ? await window.showCustomConfirm('Limpar Designer', 'Todos os componentes serão removidos. Deseja continuar?') : true;
    if (doClear) {
        const canvas = document.getElementById('designer-canvas');
        const components = canvas.querySelectorAll('.designer-component');
        components.forEach(component => component.remove());
        
        const placeholder = canvas.querySelector('.canvas-placeholder');
        if (placeholder) {
            placeholder.style.display = 'block';
        }
        
        selectComponent(null);
        populateGlobalInspector();
        saveState();
        renderComponentTree();
        logToConsole('Designer limpo', 'success');
        document.body.focus()
        closeAddVariableModal(); // Garante que o modal seja fechado
    }
}

async function clearAll(confirm = true) {
    const doClear = confirm ? await window.showCustomConfirm('Limpar Tudo', 'Limpar todo o projeto? Isso removerá todos os componentes e variáveis.') : true;
    if (doClear) {
        // Limpar canvas
        const canvas = document.getElementById('designer-canvas');
        const components = canvas.querySelectorAll('.designer-component');
        components.forEach(component => component.remove());
        const placeholder = canvas.querySelector('.canvas-placeholder');
        if (placeholder) {
            placeholder.style.display = 'block';
        }
        selectComponent(null);
        
        // Resetar estado do projeto
        currentProject = null;
        componentCounter = 0;
        undoStack = [];
        redoStack = [];
        projectVariables = {};
        componentEvents = {};
        globalEvents = {};
        globalProjectSettings = { width: 800, height: 600, backgroundColor: '#ffffff', overflow: 'visible' }; // Redefinido para o padrão

        // Aplicar redefinição na UI
        if (canvas) {
            canvas.style.backgroundColor = globalProjectSettings.backgroundColor;
            canvas.style.overflow = globalProjectSettings.overflow;
        }
        
        // Atualizar UIs
        renderVariableList();
        populateGlobalInspector(); // Isso irá ler os valores redefinidos de globalProjectSettings
        renderComponentTree();
        logToConsole('Projeto limpo e estado reiniciado.', 'success');
        
        // Salvar o estado limpo para o histórico de undo
        saveState();
    }
}

function clearConsole() {
    const console = document.getElementById('console-output');
    console.innerHTML = '<div class="console-line">Console limpo</div>';
}

// Sistema de undo/redo
function saveState() {
    const state = {
        componentsHTML: document.getElementById('designer-canvas').innerHTML,
        projectVariables: JSON.parse(JSON.stringify(projectVariables)),
        componentEvents: JSON.parse(JSON.stringify(componentEvents)),
        globalEvents: JSON.parse(JSON.stringify(globalEvents)),
        globalProjectSettings: JSON.parse(JSON.stringify(globalProjectSettings)),
        componentCounter: componentCounter
    };
    
    undoStack.push(state);
    
    // Limitar tamanho do stack
    if (undoStack.length > 50) {
        undoStack.shift();
    }
    
    // Limpar redo stack
    redoStack = [];
}

function restoreState(state) {
    const canvas = document.getElementById('designer-canvas');
    canvas.innerHTML = state.componentsHTML;

    projectVariables = state.projectVariables;
    componentEvents = state.componentEvents;
    globalEvents = state.globalEvents;
    globalProjectSettings = state.globalProjectSettings;
    componentCounter = state.componentCounter;

    // Reaplicar configurações globais na UI
    canvas.style.backgroundColor = globalProjectSettings.backgroundColor || '#ffffff';
    canvas.style.overflow = globalProjectSettings.overflow || 'visible';
    
    // Reconfigurar eventos e atualizar UI
    setupComponentEventsAfterRestore();
    renderVariableList();
    selectComponent(null); // Deseleciona qualquer componente e atualiza o inspetor para o estado global
}

function undo() {
    if (undoStack.length > 1) {
        const currentState = undoStack.pop();
        redoStack.push(currentState);
        
        const previousState = undoStack[undoStack.length - 1];
        restoreState(previousState);
        
        logToConsole('Ação desfeita', 'info');
    }
}

function redo() {
    if (redoStack.length > 0) {
        const state = redoStack.pop();
        undoStack.push(state);
        
        restoreState(state);
        
        logToConsole('Ação refeita', 'info');
    }
}

function setupComponentEventsAfterRestore() {
    const components = document.querySelectorAll('.designer-component');
    components.forEach(setupComponentEvents);
}

// Manipulação de teclado
function handleKeyboard(e) {
    if (e.code === 'Space' && !isPanning && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        isSpacePressed = true;
        const visualDesigner = document.getElementById('visual-designer');
        if (visualDesigner) visualDesigner.style.cursor = 'grab';
    }

    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 'z':
                e.preventDefault();
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
                break;
            case 'y':
                e.preventDefault();
                redo();
                break;
            case 's':
                e.preventDefault();
                saveProject();
                break;
            case 'n':
                e.preventDefault();
                newProject();
                break;
        }
    }
    
    // Delete para remover componente selecionado
    if (e.key === 'Delete' && selectedComponent) {
        selectedComponent.remove();
        selectComponent(null);
        saveState();
        logToConsole('Componente removido', 'info');
    }
}

// Drag para mover componentes
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

function startDrag(e) {
    if (e.target.classList.contains('resize-handle')) return;
    
    isDragging = true;
    const rect = e.currentTarget.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
    
    e.preventDefault();
}

function drag(e) {
    if (!isDragging || !selectedComponent) return;
    
    const canvas = document.getElementById('designer-canvas');
    const canvasRect = canvas.getBoundingClientRect();
    
    const x = e.clientX - canvasRect.left - dragOffset.x;
    const y = e.clientY - canvasRect.top - dragOffset.y;
    
    selectedComponent.style.left = Math.max(0, x) + 'px';
    selectedComponent.style.top = Math.max(0, y) + 'px';
    
    // Atualizar inspetor
    const xInput = document.getElementById('prop-x');
    const yInput = document.getElementById('prop-y');
    if (xInput) xInput.value = Math.max(0, x);
    if (yInput) yInput.value = Math.max(0, y);
}

function stopDrag() {
    if (isDragging) {
        isDragging = false;
        saveState();
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', stopDrag);
    }
}

// Redimensionamento de componentes
let isResizing = false;

function startResize(e) {
    isResizing = true;
    e.stopPropagation();
    
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResize);
    
    e.preventDefault();
}

function resize(e) {
    if (!isResizing || !selectedComponent) return;
    
    const canvas = document.getElementById('designer-canvas');
    const canvasRect = canvas.getBoundingClientRect();
    const componentRect = selectedComponent.getBoundingClientRect();
    
    const width = e.clientX - componentRect.left;
    const height = e.clientY - componentRect.top;
    
    if (width > 20) {
        selectedComponent.style.width = width + 'px';
        selectedComponent.firstElementChild.style.width = width + 'px';
    }
    
    if (height > 20) {
        selectedComponent.style.height = height + 'px';
        selectedComponent.firstElementChild.style.height = height + 'px';
    }
}

function stopResize() {
    if (isResizing) {
        isResizing = false;
        saveState();
        
        // Atualizar inspetor
        if (selectedComponent) {
            populateObjectInspector(selectedComponent);
        }
        
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResize);
    }
}

// Redimensionamento de painéis
function setupPanelResize() {
    // Configurar redimensionamento horizontal entre painéis
    const leftPanel = document.getElementById('left-panel');
    const centerPanel = document.getElementById('center-panel');
    const rightPanel = document.getElementById('right-panel');
    const bottomPanel = document.getElementById('bottom-panel');
    
    // Criar divisores redimensionáveis
    createResizer(leftPanel, centerPanel, 'horizontal');
    createResizer(centerPanel, rightPanel, 'horizontal');
    createResizer(document.getElementById('main-container'), bottomPanel, 'vertical');
}

function createResizer(panel1, panel2, direction) {
    const resizer = document.createElement('div');
    resizer.className = `panel-resizer ${direction}`;
    resizer.style.cssText = `
        position: absolute;
        background: #ddd;
        cursor: ${direction === 'horizontal' ? 'col-resize' : 'row-resize'};
        z-index: 1000;
        ${direction === 'horizontal' ? 'width: 4px; height: 100%; top: 0;' : 'height: 4px; width: 100%; left: 0;'}
    `;
    
    // Posicionar o resizer
    if (direction === 'horizontal') {
        resizer.style.left = panel1.offsetWidth + 'px';
        panel1.parentNode.appendChild(resizer);
    } else {
        resizer.style.top = panel1.offsetHeight + 'px';
        panel1.parentNode.appendChild(resizer);
    }
    
    let isResizing = false;
    
    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
        
        const handleMouseMove = (e) => {
            if (!isResizing) return;
            
            if (direction === 'horizontal') {
                const containerWidth = panel1.parentNode.offsetWidth;
                const newPanel1Width = Math.max(200, Math.min(containerWidth - 400, e.clientX - panel1.offsetLeft));
                const newPanel2Width = containerWidth - newPanel1Width - (rightPanel ? rightPanel.offsetWidth : 0);
                
                panel1.style.width = newPanel1Width + 'px';
                if (panel2 !== rightPanel) {
                    panel2.style.width = newPanel2Width + 'px';
                }
                resizer.style.left = newPanel1Width + 'px';
            } else {
                const containerHeight = window.innerHeight - 60; // Subtrair altura da toolbar
                const newPanel1Height = Math.max(300, Math.min(containerHeight - 200, e.clientY - 60));
                const newPanel2Height = containerHeight - newPanel1Height;
                
                panel1.style.height = newPanel1Height + 'px';
                panel2.style.height = newPanel2Height + 'px';
                resizer.style.top = newPanel1Height + 'px';
            }
        };
        
        const handleMouseUp = () => {
            isResizing = false;
            document.body.style.cursor = '';
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
        e.preventDefault();
    });
}

// Renderizar o Visor de Componentes
function renderComponentTree() {
    const treeContent = document.getElementById('component-tree-content');
    if (!treeContent) return;

    treeContent.innerHTML = '';
    const components = document.querySelectorAll('.designer-component');

    if (components.length === 0) {
        treeContent.innerHTML = '<p style="color: #9d9d9d; font-size: 12px; text-align: center; padding: 10px;">Nenhum componente no projeto.</p>';
        return;
    }

    components.forEach(component => {
        const componentId = component.dataset.componentId;
        const componentType = component.dataset.componentType;
        const item = document.createElement('div');
        item.className = 'component-tree-item';
        item.textContent = `${componentId} (${componentType})`;
        item.dataset.componentId = componentId;

        if (selectedComponent === component) {
            item.classList.add('selected');
        }

        item.addEventListener('click', () => {
            const targetComponent = document.querySelector(`.designer-component[data-component-id="${componentId}"]`);
            if (targetComponent) {
                selectComponent(targetComponent);
                targetComponent.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });

        treeContent.appendChild(item);
    });
}

// Atualizar interface
function updateUI() {
    renderComponentTree();
    // Atualizar estado dos botões e interface
}

// Log para console
function logToConsole(message, type = 'info') {
    const consoleOutput = document.getElementById('console-output');
    if (!consoleOutput) {
        // Fallback para console do navegador se o elemento não existir
        console.log(`[KreatorJS] ${message}`);
        return;
    }
    
    const line = document.createElement('div');
    line.className = `console-line ${type}`;
    line.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    
    consoleOutput.appendChild(line);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
    
    // Também mostrar no console do navegador para debug
    console.log(`[KreatorJS] ${message}`);
}

// Coletar dados do projeto atual
function collectProjectData() {
    const canvas = document.getElementById("designer-canvas");
    const components = canvas.querySelectorAll(".designer-component");
    
    const projectData = {
        version: "1.0.0",
        name: currentProject?.data?.name || "Projeto sem nome",
        description: currentProject?.data?.description || "",
        componentCounter: componentCounter,
        globalSettings: globalProjectSettings,
        components: [],
        events: componentEvents || {},
        globalEvents: globalEvents || {},
        variables: projectVariables || {}
    };
    
    components.forEach(component => {
        const componentData = {
            id: component.dataset.componentId,
            type: component.dataset.componentType,
            position: {
                x: parseInt(component.style.left) || 0,
                y: parseInt(component.style.top) || 0
            },
            size: {
                width: component.style.width || "auto",
                height: component.style.height || "auto"
            },
            properties: extractComponentProperties(component),
            events: extractComponentEvents(component)
        };
        
        projectData.components.push(componentData);
    });
    
    return projectData;
}

// Extrair propriedades do componente
function extractComponentProperties(component) {
    const element = component.firstElementChild;
    const componentType = component.dataset.componentType;
    const componentDef = componentLibrary.find(c => c.type === componentType);
    
    if (!componentDef) return {};
    
    const properties = {};
    
    Object.keys(componentDef.defaultProps).forEach(key => {
        properties[key] = getPropertyValue(element, key);
    });
    
    return properties;
}

// Extrair eventos do componente
function extractComponentEvents(component) {
    const componentId = component.dataset.componentId;
    return componentEvents[componentId] || {};
}

// Carregar componentes do projeto
function loadProjectComponents(components) {
    const canvas = document.getElementById('designer-canvas');
    
    // Esconder placeholder
    const placeholder = canvas.querySelector('.canvas-placeholder');
    if (placeholder) {
        placeholder.style.display = 'none';
    }
    
    components.forEach(componentData => {
        const componentDef = componentLibrary.find(c => c.type === componentData.type);
        if (!componentDef) return;
        
        // Criar wrapper do componente
        const wrapper = document.createElement('div');
        wrapper.className = 'designer-component';
        wrapper.dataset.componentId = componentData.id;
        wrapper.dataset.componentType = componentData.type;
        wrapper.style.left = componentData.position.x + 'px';
        wrapper.style.top = componentData.position.y + 'px';
        wrapper.style.width = componentData.size.width;
        wrapper.style.height = componentData.size.height;
        
        // Gerar HTML do componente
        const html = generateComponentHTML(componentDef, componentData.properties);
        wrapper.innerHTML = html + '<div class="resize-handle"></div>';
        
        // Aplicar propriedades
        applyComponentStyles(wrapper, componentData.properties);
        
        // Configurar eventos
        setupComponentEvents(wrapper);
        
        // Adicionar ao canvas
        canvas.appendChild(wrapper);
    });
    
    // Atualizar contador
    if (components.length > 0) {
        const maxId = Math.max(...components.map(c => {
            const match = c.id.match(/_(\d+)$/);
            return match ? parseInt(match[1]) : 0;
        }));
        componentCounter = Math.max(componentCounter, maxId);
    }
}

// Exportar projeto completo
async function exportCompleteProject() {
    try {
        const result = await ipcRenderer.invoke('show-save-dialog', {
            defaultPath: 'projeto-completo.zip',
            filters: [
                { name: 'Arquivo ZIP', extensions: ['zip'] },
                { name: 'Todos os arquivos', extensions: ['*'] }
            ]
        });
        
        if (result.canceled) return;
        
        // Gerar arquivos do projeto
        const htmlCode = generateCompleteHTML();
        const jsCode = generateJavaScript();
        const cssCode = generateCSS();
        const projectData = collectProjectData();
        
        // Criar estrutura de arquivos (simulada)
        const files = {
            'index.html': htmlCode,
            'script.js': jsCode,
            'style.css': cssCode,
            'projeto.kreator': JSON.stringify(projectData, null, 2),
            'README.md': generateReadme()
        };
        
        // Por enquanto, salvar apenas o HTML principal
        const saveResult = await ipcRenderer.invoke('save-file', result.filePath.replace('.zip', '.html'), htmlCode);
        
        if (saveResult.success) {
            logToConsole(`Projeto exportado: ${result.filePath.replace('.zip', '.html')}`, 'success');
        } else {
            logToConsole(`Erro ao exportar projeto: ${saveResult.error}`, 'error');
        }
        
    } catch (error) {
        logToConsole(`Erro ao exportar projeto: ${error.message}`, 'error');
    }
}

// Gerar HTML completo
function generateCompleteHTML() {
    const htmlContent = generateHTML();
    const jsCode = generateJavaScript();
    const cssCode = generateCSS();
    const bgColor = globalProjectSettings.backgroundColor;
    
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${currentProject?.data?.name || 'Projeto KreatorJS'}</title>
    <style>
        body {
            background-color: ${bgColor};
        }
        ${cssCode}
    </style>
</head>
<body>
    ${htmlContent}
    <script>
        ${jsCode}
    </script>
</body>
</html>`;
}

// Gerar CSS
function generateCSS() {
    return `/* CSS gerado pelo KreatorJS */
body {
    margin: 0;
    padding: 0;
    font-family: Arial, sans-serif;
    background-color: #f5f5f5;
}

.designer-component {
    position: absolute;
}

/* Estilos responsivos */
@media (max-width: 768px) {
    body {
        padding: 10px;
    }
}`;
}

// Gerar README
function generateReadme() {
    return `# ${currentProject?.data?.name || 'Projeto KreatorJS'}

${currentProject?.data?.description || 'Projeto criado com KreatorJS - IDE Visual para JavaScript'}

## Como usar

1. Abra o arquivo \`index.html\` em um navegador web
2. O projeto será executado automaticamente

## Arquivos

- \`index.html\` - Arquivo principal da aplicação
- \`script.js\` - Código JavaScript
- \`style.css\` - Estilos CSS
- \`projeto.kreator\` - Arquivo do projeto (para edição no KreatorJS)

## Desenvolvido com

- KreatorJS v1.0.0
- HTML5, CSS3, JavaScript

---
Gerado automaticamente pelo KreatorJS
`;
}


// Variável global para armazenar eventos dos componentes
let componentEvents = {};

// Obter eventos atuais do componente
function getCurrentComponentEvents(componentId) {
    return componentEvents[componentId] || {};
}

// Obter ações de um evento específico
function getCurrentEventActions(componentId, eventName) {
    const events = componentEvents[componentId] || {};
    return events[eventName] || [];
}

// Obter todos os componentes para seleção (exceto o atual)
function getAllComponentsForSelection(currentComponentId) {
    const canvas = document.getElementById('designer-canvas');
    const components = canvas.querySelectorAll('.designer-component');
    const result = [];
    
    components.forEach(component => {
        const id = component.dataset.componentId;
        const type = component.dataset.componentType;
        
        if (id !== currentComponentId) {
            result.push({ id, type });
        }
    });
    
    return result;
}

// Configurar listeners para ações existentes
function setupActionListeners(eventName, componentType, componentId, currentActions) {
    // Listener para remover ação
    document.querySelectorAll('.remove-action').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            removeAction(index);
        });
    });

    // Listener para editar ação
    document.querySelectorAll('.edit-action').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            editAction(index, currentActions);
        });
    });

    // Listener para o botão de condição
    document.querySelectorAll('.condition-action').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index, 10);
            const action = currentActions[index];

            if (!action) {
                console.error("Ação não encontrada para o índice:", index);
                return;
            }

            showConditionEditorModal(action.condition, (newCondition) => {
                // Se o usuário limpou a condição, o objeto pode estar vazio.
                if (newCondition && newCondition.target) {
                    action.condition = newCondition;
                } else {
                    delete action.condition; // Remove a propriedade de condição
                }
                
                // Re-render the list to show the changes
                loadActionsEditor(eventName, componentType, componentId);
                saveState(); // Salva o estado para undo/redo
            });
        });
    });
}

// Editar uma ação existente
function editAction(index, currentActions) {
    const actionToEdit = currentActions[index];
    if (!actionToEdit) {
        console.error("Ação para editar não encontrada no índice:", index);
        return;
    }

    editingActionIndex = index; // Marcar que estamos editando

    // Passar o objeto de ação inteiro, que inclui a condição
    showActionSelector(actionToEdit);
}

// Remover ação
function removeAction(index) {
    const actionsList = document.getElementById('actions-list');
    const actionItems = actionsList.querySelectorAll('.action-item');
    
    if (actionItems[index]) {
        actionItems[index].remove();
        
        // Reindexar os itens restantes
        const remainingItems = actionsList.querySelectorAll('.action-item');
        remainingItems.forEach((item, newIndex) => {
            item.dataset.index = newIndex;
            const removeButton = item.querySelector('.remove-action');
            if (removeButton) {
                removeButton.dataset.index = newIndex;
            }
        });
        saveState();
    }
}

// Adicionar ou atualizar uma ação
function saveAction(originalAction = null) {
    const targetElement = document.getElementById('target-element').value;
    const actionType = document.getElementById('action-type').value;
    let actionValue = '';

    if (actionType === 'move_element') {
        const xValue = document.getElementById('action-value-x')?.value || '0';
        const yValue = document.getElementById('action-value-y')?.value || '0';
        actionValue = `${xValue},${yValue}`;
    } else {
        actionValue = document.getElementById('action-value')?.value || '';
    }
    
    if (!targetElement || !actionType) {
        alert('Por favor, selecione um elemento alvo e uma ação.');
        return;
    }
    
    const newAction = {
        targetId: targetElement === 'global' ? null : targetElement,
        actionType: actionType,
        value: actionValue,
        condition: originalAction ? originalAction.condition : undefined
    };
    
    const isGlobal = !selectedComponent;
    const componentId = isGlobal ? 'global' : selectedComponent.dataset.componentId;
    const componentType = isGlobal ? 'global' : selectedComponent.dataset.componentType;
    const eventName = currentEditingEvent;

    let actions;
    if (isGlobal) {
        actions = (eventName === 'loop') ? globalEvents[eventName].actions : globalEvents[eventName];
    } else {
        if (!componentEvents[componentId]) componentEvents[componentId] = {};
        if (!componentEvents[componentId][eventName]) componentEvents[componentId][eventName] = [];
        actions = componentEvents[componentId][eventName];
    }

    if (editingActionIndex !== null) {
        if (actions) actions[editingActionIndex] = newAction;
    } else {
        if (actions) actions.push(newAction);
    }
    
    loadActionsEditor(eventName, componentType, componentId);
    saveState();
    hideActionSelector();
}

// Variável global para armazenar o evento atualmente sendo editado
let currentEditingEvent = null;
let editingActionIndex = null; // <<< Nova variável

// Salvar eventos do componente
async function saveComponentEvents(componentId) {
    if (currentEditingEvent) {
        saveCurrentEventActions(componentId, currentEditingEvent);
    }

    const allErrors = [];
    const events = componentEvents[componentId] || {};
    for (const eventName in events) {
        for (const action of events[eventName]) {
            const result = validateActionReferences(action.value);
            if (!result.isValid) {
                allErrors.push(...result.errors.map(e => `No evento "${eventName}": ${e}`));
            }
        }
    }

    if (allErrors.length > 0) {
        const errorList = allErrors.join('\n - ');
        const confirmed = await showCustomConfirm(
            'Aviso de Referência Inválida',
            `Foram encontradas referências inválidas nas ações configuradas:\n - ${errorList}\n\nIsso pode causar erros na execução do projeto. Deseja salvar mesmo assim?`
        );
        if (!confirmed) {
            // Restaura o estado para antes de abrir o modal
            if(eventsBackup) closeEventEditorModal(false); 
            return;
        }
    }
    
    const eventCount = Object.keys(events).length;
    logToConsole(`Eventos salvos para ${componentId}: ${eventCount} evento(s) configurado(s)`, 'success');
    
    if (selectedComponent && selectedComponent.dataset.componentId === componentId) {
        populateObjectInspector(selectedComponent);
    }
}

// Salvar eventos globais
async function saveGlobalEvents() {
    if (currentEditingEvent) {
        saveCurrentGlobalEventActions(currentEditingEvent);
    }

    const allErrors = [];
    for (const eventName in globalEvents) {
        for (const action of globalEvents[eventName]) {
            const result = validateActionReferences(action.value);
            if (!result.isValid) {
                allErrors.push(...result.errors.map(e => `No evento "${eventName}": ${e}`));
            }
        }
    }

    if (allErrors.length > 0) {
        const errorList = allErrors.join('\n - ');
        const confirmed = await showCustomConfirm(
            'Aviso de Referência Inválida',
            `Foram encontradas referências inválidas nas ações configuradas:\n - ${errorList}\n\nIsso pode causar erros na execução do projeto. Deseja salvar mesmo assim?`
        );
        if (!confirmed) {
            if(eventsBackup) closeEventEditorModal(false);
            return;
        }
    }

    const eventCount = Object.keys(globalEvents).length;
    logToConsole(`Eventos globais salvos: ${eventCount} evento(s) configurado(s)`, 'success');
}

// Salvar ações do evento atual
function saveCurrentEventActions(componentId, eventName) {
    const actionsEditor = document.getElementById('actions-editor');
    const actionItems = actionsEditor.querySelectorAll('.action-item');
    const actions = [];
    
    actionItems.forEach(actionItem => {
        const conditionStr = actionItem.dataset.actionCondition;
        let condition = null;
        // O valor pode ser 'undefined' se o atributo não existir.
        if (conditionStr && conditionStr !== 'undefined') {
            try {
                condition = JSON.parse(conditionStr);
            } catch (e) {
                console.error('Falha ao analisar a condição da ação:', e);
            }
        }

        const actionData = {
            targetId: actionItem.dataset.targetId === 'global' ? null : actionItem.dataset.targetId,
            actionType: actionItem.dataset.actionType,
            actionName: actionItem.querySelector('div:first-child').textContent,
            value: actionItem.dataset.actionValue,
            condition: condition // Adicionar a condição ao objeto da ação
        };
        actions.push(actionData);
    });
    
    // Inicializar objeto de eventos se não existir
    if (!componentEvents[componentId]) {
        componentEvents[componentId] = {};
    }
    
    // Salvar ou remover evento baseado nas ações
    if (actions.length > 0) {
        componentEvents[componentId][eventName] = actions;
    } else {
        delete componentEvents[componentId][eventName];
    }
}

// Salvar ações do evento global atual
function saveCurrentGlobalEventActions(eventName) {
    const actionsEditor = document.getElementById('actions-editor');
    const actionItems = actionsEditor.querySelectorAll('.action-item');
    const actions = [];

    actionItems.forEach(actionItem => {
        const conditionStr = actionItem.dataset.actionCondition;
        let condition = null;
        if (conditionStr && conditionStr !== 'undefined') {
            try {
                condition = JSON.parse(conditionStr);
            } catch (e) {
                console.error('Falha ao analisar a condição da ação:', e);
            }
        }

        const actionData = {
            targetId: actionItem.dataset.targetId === 'global' ? null : actionItem.dataset.targetId,
            actionType: actionItem.dataset.actionType,
            actionName: actionItem.querySelector('div:first-child').textContent,
            value: actionItem.dataset.actionValue,
            condition: condition // Adicionar a condição ao objeto da ação
        };
        actions.push(actionData);
    });

    if (eventName === 'loop') {
        if (actions.length > 0) {
            const intervalInput = document.getElementById('loop-interval');
            const interval = intervalInput ? parseInt(intervalInput.value, 10) : 1000;
            globalEvents.loop = {
                interval: isNaN(interval) ? 1000 : interval,
                actions: actions
            };
        } else {
            delete globalEvents.loop;
        }
    } else {
        // Salvar ou remover evento global baseado nas ações
        if (actions.length > 0) {
            globalEvents[eventName] = actions;
        } else {
            delete globalEvents[eventName];
        }
    }
}

// Extrair dados da ação de um elemento DOM (removido, agora os dados são lidos diretamente do dataset)

// Função para validar referências em uma string de ação
function validateActionReferences(value) {
    if (typeof value !== 'string') {
        return { isValid: true, errors: [] };
    }

    const referenceRegex = /<([a-zA-Z0-9_.]+)>/g;
    const matches = [...value.matchAll(referenceRegex)];
    const errors = [];

    if (matches.length === 0) {
        return { isValid: true, errors: [] };
    }

    for (const match of matches) {
        const ref = match[1];
        if (ref.includes('.')) {
            const [id, prop] = ref.split('.');
            const component = document.querySelector(`.designer-component[data-component-id="${id}"]`);
            if (!component) {
                errors.push(`Componente com ID "${id}" não encontrado.`);
            } else {
                const componentType = component.dataset.componentType;
                const componentDef = componentLibrary.find(c => c.type === componentType);
                if (!componentDef || !componentDef.defaultProps.hasOwnProperty(prop)) {
                    // Simples checagem, pode ser melhorada para incluir props dinâmicas
                    // console.warn(`Propriedade "${prop}" pode não ser válida para o componente "${id}".`);
                }
            }
        } else {
            if (!projectVariables.hasOwnProperty(ref)) {
                errors.push(`Variável de projeto "${ref}" não encontrada.`);
            }
        }
    }

    return { isValid: errors.length === 0, errors };
}

// Gerar JavaScript com eventos configurados
function generateJavaScriptWithEvents() {
    const canvas = document.getElementById('designer-canvas');
    const components = canvas.querySelectorAll('.designer-component');
    
    let js = '// Código JavaScript gerado pelo KreatorJS\n\n';

    // Adicionar variáveis do projeto
    js += `let projectVariables = ${JSON.stringify(projectVariables, null, 2)};\n\n`;
    
    // Adicionar funções utilitárias
    js += `// Funções utilitárias
function getElementById(id) {
    return document.getElementById(id);
}

function rgbToHex(rgb) {
    if (!rgb || !rgb.includes('rgb')) return rgb;
    const result = /^rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)$/.exec(rgb);
    if (!result) return rgb;
    const r = parseInt(result[1], 10);
    const g = parseInt(result[2], 10);
    const b = parseInt(result[3], 10);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

function getPropertyValue(element, property) {
    if (!element) return '';
    const computedStyle = window.getComputedStyle(element);
    let value = computedStyle[property];
    if (!value) value = element.style[property];
    
    switch (property) {
        case 'text': return element.textContent || element.value || '';
        case 'value': return element.value || '';
        case 'placeholder': return element.placeholder || '';
        case 'src': return element.src || '';
        case 'alt': return element.alt || '';
        case 'checked': return element.checked || false;
        case 'backgroundColor':
        case 'color':
        case 'borderColor':
            return rgbToHex(value);
        default:
            return value || '';
    }
}

function showElement(id) {
    const element = getElementById(id);
    if (element) element.style.display = 'block';
}

function hideElement(id) {
    const element = getElementById(id);
    if (element) element.style.display = 'none';
}

function toggleElement(id) {
    const element = getElementById(id);
    if (element) {
        element.style.display = element.style.display === 'none' ? 'block' : 'none';
    }
}

function changeText(id, text) {
    const element = getElementById(id);
    if (element) {
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            element.value = text;
        } else if (element.tagName === 'LABEL' && element.querySelector('input[type="checkbox"]')) {
            const checkbox = element.querySelector('input[type="checkbox"]');
            const isChecked = checkbox.checked;
            element.innerHTML = '<input type="checkbox"' + (isChecked ? ' checked' : '') + '> ' + text;
        } else {
            element.textContent = text;
        }
    }
}

function applyStyles(id, styles) {
    const element = getElementById(id);
    if (!element) return;
    try {
        const styleObject = (typeof styles === 'string') ? JSON.parse(styles) : styles;
        for (const prop in styleObject) {
            if (Object.prototype.hasOwnProperty.call(styleObject, prop)) {
                element.style[prop] = styleObject[prop];
            }
        }
    } catch (e) {
        console.error('Erro ao aplicar estilos: JSON inválido.', styles);
    }
}

function moveElement(id, x, y) {
    const element = getElementById(id);
    if (element) {
        element.style.position = 'absolute';
        element.style.left = x + 'px';
        element.style.top = y + 'px';
    }
}

function clearValue(id) {
    const element = getElementById(id);
    if (element && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA')) {
        element.value = '';
    }
}

function focusElement(id) {
    const element = getElementById(id);
    if (element) element.focus();
}

function disableElement(id) {
    const element = getElementById(id);
    if (element) element.disabled = true;
}

function enableElement(id) {
    const element = getElementById(id);
    if (element) element.disabled = false;
}

function manipulateVariable(name, operation, value) {
    if (projectVariables.hasOwnProperty(name)) {
        let currentValue = projectVariables[name].value;
        let newValue = value;

        // O valor já foi resolvido por resolveValue, então podemos usá-lo diretamente.
        const numValue = parseFloat(newValue);

        switch (operation) {
            case 'set':
                projectVariables[name].value = (projectVariables[name].type === 'number' && !isNaN(numValue)) ? numValue : newValue;
                break;
            case 'add':
                projectVariables[name].value = parseFloat(currentValue) + numValue;
                break;
            case 'subtract':
                projectVariables[name].value = parseFloat(currentValue) - numValue;
                break;
            case 'multiply':
                projectVariables[name].value = parseFloat(currentValue) * numValue;
                break;
            case 'divide':
                projectVariables[name].value = parseFloat(currentValue) / numValue;
                break;
        }
    }
}

function showCustomConfirm(title, text) {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-confirm-modal');
        const titleEl = document.getElementById('confirm-modal-title');
        const textEl = document.getElementById('confirm-modal-text');
        const okBtn = document.getElementById('confirm-modal-ok');
        const cancelBtn = document.getElementById('confirm-modal-cancel');
        const closeBtn = document.getElementById('confirm-modal-close');

        titleEl.textContent = title;
        textEl.textContent = text;

        modal.style.display = 'block';

        const close = (value) => {
            modal.style.display = 'none';
            resolve(value);
        };

        okBtn.onclick = () => close(true);
        cancelBtn.onclick = () => close(false);
        closeBtn.onclick = () => close(false);
    });
}

function logToConsoleInPreview(message, type = 'info') {
    if (window.opener) {
        window.opener.postMessage({
            type: 'kreatorjs-log',
            message: message,
            logType: type
        }, '*');
    }
    console.log('[Preview] ' + message);
}

// Eventos dos componentes
`;
    
    // Funções de Eventos Globais
    Object.keys(globalEvents).forEach(eventName => {
        if (eventName === 'loop') return; // Skip loop event, it's handled separately

        const actions = globalEvents[eventName];
        js += `
// Evento Global: ${eventName}
function global_${eventName}(event) {
    console.log('Evento global ${eventName} disparado');
`;
        actions.forEach(action => {
            js += generateActionCode(action);
        });
        js += `}

`;
    });

    components.forEach(component => {
        const componentId = component.dataset.componentId;
        const events = componentEvents[componentId] || {};
        
        Object.keys(events).forEach(eventName => {
            const actions = events[eventName];
            
            js += `
// Evento ${eventName} para ${componentId}
function ${componentId}_${eventName}(event) {
    console.log('Evento ${eventName} disparado para ${componentId}');
    
`;
            
            actions.forEach(action => {
                js += generateActionCode(action);
            });
            
            js += `}

`;
        });
    });
    
    // Adicionar código de inicialização
    js += `
// Inicialização dos eventos
document.addEventListener('DOMContentLoaded', function() {
`;

    // Eventos de Componentes
    components.forEach(component => {
        const componentId = component.dataset.componentId;
        const events = componentEvents[componentId] || {};
        
        Object.keys(events).forEach(eventName => {
            js += `    const ${componentId}_element = getElementById('${componentId}');
    if (${componentId}_element) {
        ${componentId}_element.addEventListener('${eventName}', ${componentId}_${eventName});
    }
`;
        });
    });

    // Eventos Globais
    Object.keys(globalEvents).forEach(eventName => {
        if (eventName === 'loop') return; // Already handled
        js += `    window.addEventListener('${eventName}', global_${eventName});\n`;
    });

    // Loop Global
    if (globalEvents.loop && globalEvents.loop.actions && globalEvents.loop.actions.length > 0) {
        js += `
    const loopActions = () => {
${globalEvents.loop.actions.map(action => generateActionCode(action)).join('')}
    };
    setInterval(loopActions, ${globalEvents.loop.interval || 1000});
`;
    }
    
    js += '});';
    
    return js;
}

// Gerar código para uma ação específica
function generateActionCode(action) {
    // Helper functions (resolveValue, generateCodeForExpression) are defined here,
    // just like in the original function, so they are available in this scope.

    /**
     * Generates a JavaScript code string for a given value, which can be a literal,
     * a simple variable/property reference, or a complex arithmetic expression.
     * @param {*} value The value to process.
     * @returns {string} A string of JavaScript code that will produce the value at runtime.
     */
    function resolveValue(value) {
        if (typeof value !== 'string') {
            return `'${String(value || '').replace(/'/g, "\\'")}'`;
        }
        if (!value.includes('<')) {
            return `'${value.replace(/'/g, "\\'")}'`;
        }

        const expressionRegex = /<([^>]+)>/g;
        let result = [];
        let lastIndex = 0;
        let match;

        while ((match = expressionRegex.exec(value)) !== null) {
            if (match.index > lastIndex) {
                result.push(`'${value.substring(lastIndex, match.index).replace(/'/g, "\\'")}'`);
            }
            const expression = match[1].trim();
            const expressionCode = generateCodeForExpression(expression);
            result.push(`(${expressionCode})`);
            lastIndex = match.index + match[0].length;
        }

        if (lastIndex < value.length) {
            result.push(`'${value.substring(lastIndex).replace(/'/g, "\\'")}'`);
        }

        return result.join(' + ');
    }

    /**
     * Generates a self-contained JavaScript code string for a single expression
     * found inside <...>.
     * @param {string} expression The expression string (e.g., "var1 + var2 / 2").
     * @returns {string} A string of JavaScript code.
     */
    function generateCodeForExpression(expression) {
        if (!/[-+*/()]/.test(expression)) {
            if (expression.includes('.')) {
                const [id, prop] = expression.split('.');
                return `getPropertyValue(getElementById('${id}'), '${prop}')`;
            }
            return `projectVariables['${expression}'].value`;
        }

        const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 };
        const operators = '+-*/()';
        const tokenize = (expr) => expr.replace(/([+\-*/()])/g, ' $1 ').trim().split(/\s+/);
        const tokens = tokenize(expression);
        const outputQueue = [], operatorStack = [];

        for (const token of tokens) {
            if (!isNaN(parseFloat(token)) && isFinite(token)) {
                outputQueue.push(token);
            } else if (operators.includes(token)) {
                if (token === '(') operatorStack.push(token);
                else if (token === ')') {
                    while (operatorStack.length && operatorStack[operatorStack.length - 1] !== '(') {
                        outputQueue.push(operatorStack.pop());
                    }
                    operatorStack.pop();
                } else {
                    while (operatorStack.length && precedence[operatorStack[operatorStack.length - 1]] >= precedence[token] && operatorStack[operatorStack.length - 1] !== '(') {
                        outputQueue.push(operatorStack.pop());
                    }
                    operatorStack.push(token);
                }
            } else {
                outputQueue.push(token);
            }
        }
        while (operatorStack.length > 0) outputQueue.push(operatorStack.pop());

        const codeStack = [];
        const resolveIdentifierCode = (identifier) => {
            if (identifier.includes('.')) {
                const [id, prop] = identifier.split('.');
                return `parseFloat(getPropertyValue(getElementById('${id}'), '${prop}'))`;
            }
            return `projectVariables['${identifier}'].value`;
        };

        for (const token of outputQueue) {
            if (!operators.includes(token)) {
                codeStack.push(!isNaN(parseFloat(token)) && isFinite(token) ? token : resolveIdentifierCode(token));
            } else {
                const b = codeStack.pop();
                const a = codeStack.pop();
                codeStack.push(`(${a} ${token} ${b})`);
            }
        }
        return codeStack[0] || '""';
    }

    let actionLogic = '';
    const resolvedValue = resolveValue(action.value || '');

    if (!action.targetId) {
        // Ação global
        switch (action.actionType) {
            case 'show_alert':
                actionLogic = `    alert(${resolvedValue});\n`;
                break;
            case 'console_log':
                actionLogic = `    window.logToConsoleInPreview(${resolvedValue}, 'info');\n`;
                break;
            case 'redirect_page':
                actionLogic = `    window.location.href = ${resolvedValue};\n`;
                break;
            case 'manipulate_variable':
                if (action.value && action.value.includes(',')) {
                    const [varName, operation, ...valueParts] = action.value.split(',');
                    const value = valueParts.join(',');
                    const resolvedManipulationValue = resolveValue(value);
                    actionLogic = `    manipulateVariable('${varName}', '${operation}', ${resolvedManipulationValue});\n`;
                }
                break;
        }
    } else {
        // Ação em elemento específico
        switch (action.actionType) {
            case 'change_style':
                actionLogic = `    applyStyles('${action.targetId}', ${resolvedValue});\n`;
                break;
            case 'change_text':
            case 'change_value':
            case 'change_checkbox_text':
                actionLogic = `    changeText('${action.targetId}', ${resolvedValue});\n`;
                break;
            case 'toggle_checkbox':
                if (action.value === 'check') {
                    actionLogic = `    const checkbox_${action.targetId} = getElementById('${action.targetId}').querySelector('input[type="checkbox"]'); if (checkbox_${action.targetId}) checkbox_${action.targetId}.checked = true;\n`;
                } else if (action.value === 'uncheck') {
                    actionLogic = `    const checkbox_${action.targetId} = getElementById('${action.targetId}').querySelector('input[type="checkbox"]'); if (checkbox_${action.targetId}) checkbox_${action.targetId}.checked = false;\n`;
                } else {
                    actionLogic = `    const checkbox_${action.targetId} = getElementById('${action.targetId}').querySelector('input[type="checkbox"]'); if (checkbox_${action.targetId}) checkbox_${action.targetId}.checked = !checkbox_${action.targetId}.checked;\n`;
                }
                break;
            case 'move_element':
                if (action.value && action.value.includes(',')) {
                    const [x, y] = action.value.split(',');
                    actionLogic = `    moveElement('${action.targetId}', ${x}, ${y});\n`;
                }
                break;
            case 'show_hide':
                if (action.value === 'show') actionLogic = `    showElement('${action.targetId}');\n`;
                else if (action.value === 'hide') actionLogic = `    hideElement('${action.targetId}');\n`;
                else actionLogic = `    toggleElement('${action.targetId}');\n`;
                break;
            case 'clear_value':
                actionLogic = `    clearValue('${action.targetId}');\n`;
                break;
            case 'focus_element':
                actionLogic = `    focusElement('${action.targetId}');\n`;
                break;
            case 'disable_enable':
                if (action.value === 'enable') actionLogic = `    enableElement('${action.targetId}');\n`;
                else if (action.value === 'disable') actionLogic = `    disableElement('${action.targetId}');\n`;
                break;
        }
    }

    // Se não houver lógica de ação, não retorne nada.
    if (!actionLogic) {
        return '';
    }

    // Envolver a lógica da ação em uma verificação de condição, se houver uma.
    if (action.condition && action.condition.target) {
        const { target, operator, value } = action.condition;
        let targetValueCode = '';

        if (target.startsWith('var:')) {
            const varName = target.substring(4);
            targetValueCode = `projectVariables['${varName}'].value`;
        } else if (target.startsWith('prop:')) {
            const [componentId, propName] = target.substring(5).split('.');
            targetValueCode = `getPropertyValue(getElementById('${componentId}'), '${propName}')`;
        }

        if (targetValueCode) {
            const comparisonValueCode = resolveValue(value || '');
            
            const numericOperators = ['>', '<', '>=', '<='];
            const isNumericComparison = numericOperators.includes(operator);

            const leftOperand = isNumericComparison ? `parseFloat(${targetValueCode})` : `String(${targetValueCode})`;
            const rightOperand = isNumericComparison ? `parseFloat(${comparisonValueCode})` : `String(${comparisonValueCode})`;
            
            let conditionExpression;
            if (operator === 'contains') {
                conditionExpression = `${leftOperand}.includes(${rightOperand})`;
            } else if (operator === 'not_contains') {
                conditionExpression = `!${leftOperand}.includes(${rightOperand})`;
            } else {
                conditionExpression = `${leftOperand} ${operator} ${rightOperand}`;
            }
            
            const indentedActionLogic = actionLogic.trim().split('\n').map(line => `        ${line}`).join('\n');
            return `    if (${conditionExpression}) {\n${indentedActionLogic}\n    }\n`;
        }
    }

    return actionLogic;
}

// Modal de seleção de propriedade
function showPropertySelectorModal(callback) {
    const modalId = 'property-selector-modal';
    if (document.getElementById(modalId)) return;

    const modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.style.zIndex = '10002'; // On top of the variable modal

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.maxWidth = '600px';
    modalContent.style.height = 'auto';

    modalContent.innerHTML = `
        <div class="modal-header">
            <h3>Pegar Propriedade de Componente</h3>
            <button class="close-btn">&times;</button>
        </div>
        <div class="modal-body" style="display: flex; gap: 20px;">
            <div style="flex: 1;">
                <label class="property-label">Componente</label>
                <select id="prop-selector-component" class="property-input" size="10">
                    ${getAllComponentsForSelection().map(comp => `<option value="${comp.id}">${comp.id} (${comp.type})</option>`).join('')}
                </select>
            </div>
            <div style="flex: 1;">
                <label class="property-label">Propriedade</label>
                <select id="prop-selector-property" class="property-input" size="10" disabled>
                    <!-- Propriedades serão carregadas aqui -->
                </select>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-cancel">Cancelar</button>
            <button id="btn-confirm-prop-select" class="btn primary" disabled>Confirmar</button>
        </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    const closeModal = () => modal.remove();

    const componentSelect = document.getElementById('prop-selector-component');
    const propertySelect = document.getElementById('prop-selector-property');
    const confirmBtn = document.getElementById('btn-confirm-prop-select');

    componentSelect.addEventListener('change', () => {
        const componentId = componentSelect.value;
        const component = document.querySelector(`.designer-component[data-component-id="${componentId}"]`);
        propertySelect.innerHTML = '';
        propertySelect.disabled = true;
        confirmBtn.disabled = true;

        if (component) {
            const componentType = component.dataset.componentType;
            const componentDef = componentLibrary.find(c => c.type === componentType);
            if (componentDef) {
                const props = Object.keys(componentDef.defaultProps);
                // Adicionar propriedades dinâmicas como 'value' ou 'checked'
                if (['input', 'textarea', 'select'].includes(componentType)) props.push('value');
                if (componentType === 'checkbox') props.push('checked');
                
                propertySelect.innerHTML = props.map(prop => `<option value="${prop}">${prop}</option>`).join('');
                propertySelect.disabled = false;
            }
        }
    });

    propertySelect.addEventListener('change', () => {
        confirmBtn.disabled = !propertySelect.value;
    });

    confirmBtn.addEventListener('click', () => {
        const componentId = componentSelect.value;
        const property = propertySelect.value;
        if (componentId && property) {
            callback(`<${componentId}.${property}>`);
            closeModal();
        }
    });

    modal.querySelector('.close-btn').addEventListener('click', closeModal);
    modal.querySelector('.btn-cancel').addEventListener('click', closeModal);
}

// Atualizar função de geração de JavaScript
function generateJavaScript() {
    return generateJavaScriptWithEvents();
}

// Manipuladores de Pan e Zoom
function handleWheelZoom(e) {
    e.preventDefault();
    const visualDesigner = document.getElementById('visual-designer');
    if (!visualDesigner) return;

    const rect = visualDesigner.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = 1.1;
    const oldScale = canvasScale;

    if (e.deltaY < 0) {
        canvasScale *= zoomFactor; // Zoom in
    } else {
        canvasScale /= zoomFactor; // Zoom out
    }

    // Clamp scale to a reasonable range
    canvasScale = Math.max(0.1, Math.min(canvasScale, 5));
    
    // Adjust pan to zoom towards the mouse pointer
    canvasPanX = mouseX - (mouseX - canvasPanX) * (canvasScale / oldScale);
    canvasPanY = mouseY - (mouseY - canvasPanY) * (canvasScale / oldScale);

    updateCanvasTransform();
}

function handlePanStart(e) {
    const visualDesigner = document.getElementById('visual-designer');
    if (!visualDesigner) return;

    // Pan with middle mouse button OR space + left click, as long as it's within the designer
    if (visualDesigner.contains(e.target)) {
        if (e.button === 1 || (e.button === 0 && isSpacePressed)) {
            e.preventDefault();
            isPanning = true;
            lastMousePos = { x: e.clientX, y: e.clientY };
            visualDesigner.style.cursor = 'grabbing';
        }
    }
}

function handlePanMove(e) {
    if (isPanning) {
        e.preventDefault();
        const deltaX = e.clientX - lastMousePos.x;
        const deltaY = e.clientY - lastMousePos.y;

        canvasPanX += deltaX;
        canvasPanY += deltaY;

        lastMousePos = { x: e.clientX, y: e.clientY };
        updateCanvasTransform();
    }
}

function handlePanEnd(e) {
    if (isPanning) {
        e.preventDefault();
        isPanning = false;
        const visualDesigner = document.getElementById('visual-designer');
        if (visualDesigner) {
            visualDesigner.style.cursor = isSpacePressed ? 'grab' : 'default';
        }
    }
}





// Gerenciador de imagens
let imageLibrary = {};

function openImageManager(propertyKey) {
    // Criar modal do gerenciador de imagens
    const modal = document.createElement('div');
    modal.id = 'image-manager-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 0;
        border-radius: 8px;
        width: 90%;
        max-width: 800px;
        height: 80%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    `;
    
    modalContent.innerHTML = `
        <div style="padding: 20px; border-bottom: 1px solid #ddd; background: #f8f9fa;">
            <h2 style="margin: 0; color: #333;">Gerenciador de Imagens</h2>
            <p style="margin: 5px 0 0 0; color: #666;">Gerencie suas imagens para usar nos componentes</p>
        </div>
        
        <div style="flex: 1; display: flex; overflow: hidden;">
            <!-- Lista de imagens -->
            <div style="flex: 1; padding: 20px; overflow-y: auto;">
                <div style="margin-bottom: 15px;">
                    <input type="file" id="image-upload" accept="image/*" style="display: none;">
                    <button id="btn-add-image" style="
                        background: #28a745;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 4px;
                        cursor: pointer;
                        margin-right: 10px;
                    ">📁 Adicionar Imagem</button>
                    <button id="btn-add-url" style="
                        background: #007acc;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 4px;
                        cursor: pointer;
                    ">🔗 Adicionar por URL</button>
                </div>
                
                <div id="images-grid" style="
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                    gap: 15px;
                ">
                    ${generateImagesGrid()}
                </div>
            </div>
        </div>
        
        <div style="padding: 20px; border-top: 1px solid #ddd; background: #f8f9fa; text-align: right;">
            <button id="btn-close-manager" style="
                background: #ccc;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                cursor: pointer;
            ">Fechar</button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Armazenar propriedade para uso posterior
    modal.dataset.propertyKey = propertyKey;
    
    // Event listeners
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeImageManager();
        }
    });
    
    // Botão adicionar imagem
    document.getElementById('btn-add-image').addEventListener('click', () => {
        document.getElementById('image-upload').click();
    });
    
    // Upload de arquivo
    document.getElementById('image-upload').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageData = {
                    id: 'img_' + Date.now(),
                    name: file.name.replace(/\.[^/.]+$/, ""), // Remove extensão
                    src: e.target.result,
                    type: 'file'
                };
                
                imageLibrary[imageData.id] = imageData;
                refreshImagesGrid();
                logToConsole(`Imagem adicionada: ${imageData.name}`, 'success');
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Botão adicionar por URL
    document.getElementById('btn-add-url').addEventListener('click', () => {
        const url = prompt('Digite a URL da imagem:');
        if (url) {
            const imageData = {
                id: 'img_' + Date.now(),
                name: 'Imagem URL',
                src: url,
                type: 'url'
            };
            
            imageLibrary[imageData.id] = imageData;
            refreshImagesGrid();
            logToConsole(`Imagem por URL adicionada: ${imageData.name}`, 'success');
        }
    });
    
    // Botão fechar
    document.getElementById('btn-close-manager').addEventListener('click', closeImageManager);
}

function generateImagesGrid() {
    if (Object.keys(imageLibrary).length === 0) {
        return '<div style="grid-column: 1/-1; text-align: center; color: #666; padding: 40px;">Nenhuma imagem adicionada ainda</div>';
    }
    
    return Object.values(imageLibrary).map(image => `
        <div class="image-item" data-image-id="${image.id}" style="
            border: 2px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
            cursor: pointer;
            transition: all 0.2s;
            background: white;
        " onmouseover="this.style.borderColor='#007acc'" onmouseout="this.style.borderColor='#ddd'">
            <img src="${image.src}" alt="${image.name}" style="
                width: 100%;
                height: 100px;
                object-fit: cover;
                display: block;
            ">
            <div style="padding: 8px;">
                <div style="font-size: 12px; font-weight: bold; color: #333; margin-bottom: 4px;">
                    ${image.name}
                </div>
                <div style="display: flex; gap: 4px;">
                    <button onclick="selectImage('${image.id}')" style="
                        flex: 1;
                        background: #28a745;
                        color: white;
                        border: none;
                        padding: 4px 8px;
                        border-radius: 3px;
                        font-size: 11px;
                        cursor: pointer;
                    ">Usar</button>
                    <button onclick="editImageName('${image.id}')" style="
                        background: #007acc;
                        color: white;
                        border: none;
                        padding: 4px 8px;
                        border-radius: 3px;
                        font-size: 11px;
                        cursor: pointer;
                    ">✏️</button>
                    <button onclick="removeImage('${image.id}')" style="
                        background: #dc3545;
                        color: white;
                        border: none;
                        padding: 4px 8px;
                        border-radius: 3px;
                        font-size: 11px;
                        cursor: pointer;
                    ">🗑️</button>
                </div>
            </div>
        </div>
    `).join('');
}

function refreshImagesGrid() {
    const grid = document.getElementById('images-grid');
    if (grid) {
        grid.innerHTML = generateImagesGrid();
    }
}

function selectImage(imageId) {
    const modal = document.getElementById('image-manager-modal');
    const propertyKey = modal.dataset.propertyKey;
    const image = imageLibrary[imageId];
    
    if (image && selectedComponent) {
        // Atualizar propriedade do componente
        updateComponentProperty(propertyKey, image.src);
        
        // Atualizar input no inspetor
        const input = document.querySelector(`[data-property="${propertyKey}"]`);
        if (input) {
            input.value = image.src;
        }
        
        logToConsole(`Imagem "${image.name}" aplicada ao componente`, 'success');
    }
    
    closeImageManager();
}

function editImageName(imageId) {
    const image = imageLibrary[imageId];
    if (image) {
        const newName = prompt('Novo nome da imagem:', image.name);
        if (newName && newName.trim()) {
            image.name = newName.trim();
            refreshImagesGrid();
            logToConsole(`Nome da imagem alterado para: ${newName}`, 'success');
        }
    }
}

function removeImage(imageId) {
    const image = imageLibrary[imageId];
    if (image && confirm(`Remover a imagem "${image.name}"?`)) {
        delete imageLibrary[imageId];
        refreshImagesGrid();
        logToConsole(`Imagem "${image.name}" removida`, 'success');
    }
}

function closeImageManager() {
    const modal = document.getElementById('image-manager-modal');
    if (modal) {
        modal.remove();
    }
}

// Editor de opções para lista suspensa
let tempSelectOptions = [];

function editSelectOptions(component) {
    if (!component || component.dataset.componentType !== 'select') return;
    
    const selectElement = component.firstElementChild;
    tempSelectOptions = Array.from(selectElement.options).map(option => ({
        value: option.value,
        text: option.textContent
    }));
    
    // Criar modal do editor de opções
    const modal = document.createElement('div');
    modal.id = 'select-options-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 0;
        border-radius: 8px;
        width: 90%;
        max-width: 600px;
        height: 70%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    `;
    
    modalContent.innerHTML = `
        <div style="padding: 20px; border-bottom: 1px solid #ddd; background: #f8f9fa;">
            <h2 style="margin: 0; color: #333;">Editor de Opções - Lista Suspensa</h2>
            <p style="margin: 5px 0 0 0; color: #666;">Configure as opções da lista suspensa</p>
        </div>
        
        <div style="flex: 1; padding: 20px; overflow-y: auto;">
            <div style="margin-bottom: 15px;">
                <button onclick="addSelectOption()" style="
                    background: #28a745;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 4px;
                    cursor: pointer;
                ">+ Adicionar Opção</button>
            </div>
            
            <div id="options-list">
                ${generateOptionsEditor(tempSelectOptions)}
            </div>
        </div>
        
        <div style="padding: 20px; border-top: 1px solid #ddd; background: #f8f9fa; text-align: right;">
            <button onclick="closeSelectOptionsEditor()" style="
                background: #ccc;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                margin-right: 10px;
                cursor: pointer;
            ">Cancelar</button>
            <button onclick="saveSelectOptions()" style="
                background: #007acc;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                cursor: pointer;
            ">Salvar Opções</button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Event listeners
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeSelectOptionsEditor();
        }
    });
}

function generateOptionsEditor(options) {
    let html = '';
    
    options.forEach((option, index) => {
        html += `
            <div class="option-item" data-index="${index}" style="
                display: flex;
                gap: 10px;
                margin-bottom: 10px;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
                align-items: center;
            ">
                <div style="flex: 1;">
                    <input type="text" placeholder="Texto da opção" value="${option.text}" 
                           onchange="updateOptionText(${index}, this.value)"
                           style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                </div>
                <div style="display: flex; flex-direction: column; gap: 5px;">
                    <button onclick="moveOptionUp(${index})" style="
                        background: #007acc;
                        color: white;
                        border: none;
                        padding: 5px 8px;
                        border-radius: 3px;
                        cursor: pointer;
                        font-size: 12px;
                    ">↑</button>
                    <button onclick="moveOptionDown(${index})" style="
                        background: #007acc;
                        color: white;
                        border: none;
                        padding: 5px 8px;
                        border-radius: 3px;
                        cursor: pointer;
                        font-size: 12px;
                    ">↓</button>
                    <button onclick="removeSelectOption(${index})" style="
                        background: #dc3545;
                        color: white;
                        border: none;
                        padding: 5px 8px;
                        border-radius: 3px;
                        cursor: pointer;
                        font-size: 12px;
                    ">🗑️</button>
                </div>
            </div>
        `;
    });
    
    if (options.length === 0) {
        html = '<div style="text-align: center; color: #999; margin-top: 50px;">Nenhuma opção adicionada ainda</div>';
    }
    
    return html;
}

function addSelectOption() {
    tempSelectOptions.push({
        text: 'Nova Opção',
        value: 'nova_opcao_' + (tempSelectOptions.length + 1)
    });
    refreshOptionsEditor();
}

function updateOptionText(index, text) {
    if (tempSelectOptions[index]) {
        tempSelectOptions[index].text = text;
        // Usar o texto como valor também (simplificado)
        tempSelectOptions[index].value = text.toLowerCase().replace(/\s+/g, '_');
    }
}

function updateOptionValue(index, value) {
    if (tempSelectOptions[index]) {
        tempSelectOptions[index].value = value;
    }
}

function moveOptionUp(index) {
    if (index > 0) {
        const temp = tempSelectOptions[index];
        tempSelectOptions[index] = tempSelectOptions[index - 1];
        tempSelectOptions[index - 1] = temp;
        refreshOptionsEditor();
    }
}

function moveOptionDown(index) {
    if (index < tempSelectOptions.length - 1) {
        const temp = tempSelectOptions[index];
        tempSelectOptions[index] = tempSelectOptions[index + 1];
        tempSelectOptions[index + 1] = temp;
        refreshOptionsEditor();
    }
}

function removeSelectOption(index) {
    tempSelectOptions.splice(index, 1);
    refreshOptionsEditor();
}

function refreshOptionsEditor() {
    const optionsList = document.getElementById('options-list');
    if (optionsList) {
        optionsList.innerHTML = generateOptionsEditor(tempSelectOptions);
    }
}

function saveSelectOptions() {
    if (!selectedComponent || selectedComponent.dataset.componentType !== 'select') return;
    
    const selectElement = selectedComponent.firstElementChild;
    
    // Limpar opções existentes
    selectElement.innerHTML = '';
    
    // Adicionar novas opções
    tempSelectOptions.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.text;
        selectElement.appendChild(optionElement);
    });
    
    closeSelectOptionsEditor();
    logToConsole(`Opções da lista suspensa atualizadas: ${tempSelectOptions.length} opção(ões)`, 'success');
}

function closeSelectOptionsEditor() {
    const modal = document.getElementById('select-options-modal');
    if (modal) {
        modal.remove();
    }
    tempSelectOptions = [];
}

// Gerenciamento de Variáveis
function initializeVariablesPanel() {
    const variablesContent = document.getElementById('variables-content');
    variablesContent.innerHTML = `
        <div id="variable-list" style="margin-bottom: 10px; height: calc(100% - 50px); overflow-y: auto;">
            <!-- As variáveis serão listadas aqui -->
        </div>
        <div id="variable-actions" style="padding-top: 4px; border-top: 1px solid #3e3e42; display: flex; gap: 5px;">
            <button id="btn-show-add-var-modal" class="btn primary" style="flex: 1;">Adicionar Variável</button>
            <button id="btn-show-edit-vars-modal" class="btn" style="flex: 1;">Editar Variáveis</button>
        </div>
    `;

    setupVariableButtonListener();
    renderVariableList();
}

function setupVariableButtonListener() {
    const addButton = document.getElementById('btn-show-add-var-modal');
    if (addButton) {
        addButton.removeEventListener('click', showAddVariableModal);
        addButton.addEventListener('click', showAddVariableModal);
    }
}

function addVariable() {
    const nameInput = document.getElementById('modal-var-name');
    const valueInput = document.getElementById('modal-var-value');
    const typeInput = document.getElementById('modal-var-type');

    if (!nameInput || !valueInput || !typeInput) {
        logToConsole('Erro: Não foi possível encontrar os campos do modal.', 'error');
        return;
    }

    const name = nameInput.value.trim();
    const value = valueInput.value;
    const type = typeInput.value;

    if (!name || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
        showCustomAlert('Erro de Validação', 'Nome de variável inválido. Use apenas letras, números e underscores, e não comece com um número.');
        return;
    }

    if (projectVariables[name]) {
        showCustomAlert('Erro de Validação', `A variável "${name}" já existe.`);
        return;
    }

    let parsedValue;
    try {
        switch (type) {
            case 'string':
                parsedValue = String(value);
                break;
            case 'number':
                parsedValue = Number(value);
                if (isNaN(parsedValue)) throw new Error('Valor inválido para número');
                break;
            case 'boolean':
                parsedValue = value.toLowerCase() === 'true' || value === '1';
                break;
            case 'object':
                parsedValue = JSON.parse(value || '{}');
                break;
            case 'array':
                parsedValue = JSON.parse(value || '[]');
                if (!Array.isArray(parsedValue)) throw new Error('Valor inválido para array');
                break;
        }
    } catch (e) {
        showCustomAlert('Erro de Validação', `Erro ao processar valor da variável: ${e.message}`);
        return;
    }

    projectVariables[name] = { type, value: parsedValue };

    logToConsole(`Variável "${name}" adicionada com sucesso.`, 'success');
    renderVariableList();
    updateAllDynamicProperties(); // Update components that might use this new variable
    
    // Limpar campos para a próxima variável
    nameInput.value = '';
    valueInput.value = '';
    closeAddVariableModal()
}

function renderVariableList() {
    const variableList = document.getElementById('variable-list');
    variableList.innerHTML = '';

    if (Object.keys(projectVariables).length === 0) {
        variableList.innerHTML = '<p style="color: #9d9d9d; font-size: 12px; text-align: center;">Nenhuma variável definida.</p>';
        return;
    }

    for (const name in projectVariables) {
        const variable = projectVariables[name];
        const item = document.createElement('div');
        item.style.cssText = 'padding: 8px; border-bottom: 1px solid #3e3e42; font-size: 12px; display: flex; justify-content: space-between; align-items: center;';

        let displayValue = JSON.stringify(variable.value);
        if (displayValue.length > 20) {
            displayValue = displayValue.substring(0, 20) + '...';
        }

        item.innerHTML = `
            <div>
                <strong style="color: #9cdcfe;">${name}</strong>
                <span style="color: #ce9178;">(${variable.type})</span>
                <span style="color: #b5cea8;">= ${displayValue}</span>
            </div>
            <button onclick="removeVariable('${name}')" style="background: #dc3545; color: white; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer;">🗑️</button>
        `;
        variableList.appendChild(item);
    }
}

async function removeVariable(name, confirm = true) {
    const remover = confirm ? await window.showCustomConfirm("Remover Variável",`Tem certeza que deseja remover a variável "${name}"?`) : true
    if (remover) {
        delete projectVariables[name];
        logToConsole(`Variável "${name}" removida.`, 'info');
        renderVariableList();
        updateAllDynamicProperties(); // Update components that might have used this variable
        refreshEditVariableList()
    }
}

function showAddVariableModal() {
    const modalId = 'add-variable-modal';
    if (document.getElementById(modalId)) return;

    const modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.style.zIndex = '1001';

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.maxWidth = '400px';
    modalContent.style.height = 'auto';

    modalContent.innerHTML = `
        <div class="modal-header">
            <h3>Adicionar Variável</h3>
            <button class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
            <div class="property-item">
                <label class="property-label">Nome da Variável</label>
                <input type="text" id="modal-var-name" class="property-input">
            </div>
            <div class="property-item">
                <label class="property-label">Valor Inicial</label>
                <input type="text" id="modal-var-value" class="property-input">
                <div id="variable-example" style="font-size: 11px; color: #9d9d9d; margin-top: 5px; display: none;"></div>
            </div>
            <div class="property-item">
                <label class="property-label">Tipo</label>
                <select id="modal-var-type" class="property-input">
                    <option value="string">Texto (String)</option>
                    <option value="number">Número (Number)</option>
                    <option value="boolean">Booleano (Boolean)</option>
                    <option value="object">Objeto (Object)</option>
                    <option value="array">Array</option>
                </select>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-cancel">Cancelar</button>
            <button id="btn-confirm-add-var" class="btn primary">Adicionar</button>
        </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    const closeModalHandler = () => {
        closeAddVariableModal();
    };

    modal.querySelector(".close-btn").addEventListener("click", closeModalHandler);
    modal.querySelector(".btn-cancel").addEventListener("click", closeModalHandler);
    modal.querySelector("#btn-confirm-add-var").addEventListener("click", addVariable);

    // Limpar campos ao abrir o modal
    const nameInput = document.getElementById("modal-var-name");
    const valueInput = document.getElementById("modal-var-value");
    const typeInput = document.getElementById("modal-var-type");

    if (nameInput) nameInput.value = "";
    if (valueInput) valueInput.value = "";
    if (typeInput) typeInput.value = "string"; // Default para string

    // Focar no primeiro input após um pequeno delay para garantir que o modal esteja visível
    setTimeout(() => {
        if (nameInput) nameInput.focus();
    }, 100);

    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            closeModalHandler();
        }
    });

    // Adicionar listener para o tipo de variável
    const varTypeSelect = document.getElementById('modal-var-type');
    const exampleDiv = document.getElementById('variable-example');
    if (varTypeSelect && exampleDiv) {
        const examples = {
            string: 'Exemplo: "Olá, mundo"',
            number: 'Exemplo: 123',
            boolean: 'Exemplo: true',
            object: 'Exemplo: {"chave": "valor"}',
            array: 'Exemplo: ["item1", "item2", 2, 4]'
        };

        const updateExample = () => {
            const selectedType = varTypeSelect.value;
            if (examples[selectedType]) {
                exampleDiv.textContent = examples[selectedType];
                exampleDiv.style.display = 'block';
            } else {
                exampleDiv.style.display = 'none';
            }
        };

        varTypeSelect.addEventListener('change', updateExample);
        // Show example for the default selected type
        updateExample();
    }
}

function closeAddVariableModal() {
    const modal = document.getElementById('add-variable-modal');
    if (modal) {
        modal.remove();
    }
}

function showEditVariablesModal() {
    const modalId = 'edit-variables-modal';
    if (document.getElementById(modalId)) return;

    const modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'modal';
    
    // Estilos mais específicos para garantir que o modal apareça
    modal.style.cssText = `
        display: flex !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background-color: rgba(0, 0, 0, 0.7) !important;
        justify-content: center !important;
        align-items: center !important;
        z-index: 1001 !important;
        backdrop-filter: blur(2px) !important;
    `;

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.cssText = `
        background-color: #252526 !important;
        border: 1px solid #3e3e42 !important;
        border-radius: 6px !important;
        max-width: 600px !important;
        width: 90% !important;
        height: auto !important;
        max-height: 80vh !important;
        overflow: hidden !important;
        display: flex !important;
        flex-direction: column !important;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3) !important;
    `;

    modalContent.innerHTML = `
        <div class="modal-header">
            <h3>Editar Variáveis do Projeto</h3>
            <button class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
            <div id="edit-variable-list" style="max-height: 400px; overflow-y: auto; border: 1px solid #3e3e42; border-radius: 4px; padding: 10px;">
                ${generateEditVariableList()}
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-cancel">Fechar</button>
        </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    const closeModalHandler = () => {
        closeEditVariablesModal();
    };

    modal.querySelector(".close-btn").addEventListener("click", closeModalHandler);
    modal.querySelector(".btn-cancel").addEventListener("click", closeModalHandler);

    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            closeModalHandler();
        }
    });
}

function closeEditVariablesModal() {
    const modal = document.getElementById('edit-variables-modal');
    if (modal) {
        modal.remove();
    }
    renderVariableList(); // Atualiza a lista de variáveis no painel principal
}

function generateEditVariableList() {
    let html = '';
    if (Object.keys(projectVariables).length === 0) {
        html = '<p style="color: #9d9d9d; font-size: 12px; text-align: center; padding: 20px;">Nenhuma variável definida.</p>';
    } else {
        for (const name in projectVariables) {
            const variable = projectVariables[name];
            let displayValue = JSON.stringify(variable.value);
            if (displayValue.length > 30) {
                displayValue = displayValue.substring(0, 30) + '...';
            }
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #3e3e42;">
                    <div>
                        <strong style="color: #9cdcfe;">${name}</strong>
                        <span style="color: #ce9178;">(${variable.type})</span>
                        <span style="color: #b5cea8;">= ${displayValue}</span>
                    </div>
                    <div>
                        <button onclick="editVariable('${name}')" style="background: #007acc; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; margin-right: 5px;">✏️</button>
                        <button onclick="removeVariable('${name}')" style="background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer;">🗑️</button>
                    </div>
                </div>
            `;
        }
    }
    return html;
}

function refreshEditVariableList() {
    const list = document.getElementById('edit-variable-list');
    if (list) {
        list.innerHTML = generateEditVariableList();
    }
}

function editVariable(name) {
    const variable = projectVariables[name];
    if (!variable) return;

    const modalId = 'edit-single-variable-modal';
    if (document.getElementById(modalId)) return;

    const modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'modal';
    
    // Estilos mais específicos para garantir que o modal apareça
    modal.style.cssText = `
        display: flex !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background-color: rgba(0, 0, 0, 0.7) !important;
        justify-content: center !important;
        align-items: center !important;
        z-index: 1002 !important;
        backdrop-filter: blur(2px) !important;
    `;

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.cssText = `
        background-color: #252526 !important;
        border: 1px solid #3e3e42 !important;
        border-radius: 6px !important;
        max-width: 400px !important;
        width: 90% !important;
        height: auto !important;
        max-height: 80vh !important;
        overflow: hidden !important;
        display: flex !important;
        flex-direction: column !important;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3) !important;
    `;

    const valueForInput = variable.type === 'string' ? variable.value : JSON.stringify(variable.value);

    modalContent.innerHTML = `
        <div class="modal-header">
            <h3>Editar Variável: ${name}</h3>
            <button class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
            <div class="property-item">
                <label class="property-label">Nome da Variável</label>
                <input type="text" id="modal-edit-var-name" class="property-input" value="${name}" readonly>
            </div>
            <div class="property-item">
                <label class="property-label">Valor</label>
                <input type="text" id="modal-edit-var-value" class="property-input" value="${valueForInput.replace(/"/g, '&quot;')}">
            </div>
            <div class="property-item">
                <label class="property-label">Tipo</label>
                <select id="modal-edit-var-type" class="property-input">
                    <option value="string" ${variable.type === 'string' ? 'selected' : ''}>Texto (String)</option>
                    <option value="number" ${variable.type === 'number' ? 'selected' : ''}>Número (Number)</option>
                    <option value="boolean" ${variable.type === 'boolean' ? 'selected' : ''}>Booleano (Boolean)</option>
                    <option value="object" ${variable.type === 'object' ? 'selected' : ''}>Objeto (Object)</option>
                    <option value="array" ${variable.type === 'array' ? 'selected' : ''}>Array</option>
                </select>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-cancel">Cancelar</button>
            <button id="btn-confirm-edit-var" class="btn primary">Salvar</button>
        </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    const closeModalHandler = () => {
        closeEditSingleVariableModal();
    };

    modal.querySelector(".close-btn").addEventListener("click", closeModalHandler);
    modal.querySelector(".btn-cancel").addEventListener("click", closeModalHandler);
    modal.querySelector("#btn-confirm-edit-var").addEventListener("click", () => {
        const newValue = document.getElementById('modal-edit-var-value').value;
        const newType = document.getElementById('modal-edit-var-type').value;
        
        let parsedValue;
        try {
            switch (newType) {
                case 'string':
                    parsedValue = String(newValue);
                    break;
                case 'number':
                    parsedValue = Number(newValue);
                    if (isNaN(parsedValue)) throw new Error('Valor inválido para número');
                    break;
                case 'boolean':
                    parsedValue = newValue.toLowerCase() === 'true' || newValue === '1';
                    break;
                case 'object':
                    parsedValue = JSON.parse(newValue || '{}');
                    break;
                case 'array':
                    parsedValue = JSON.parse(newValue || '[]');
                    if (!Array.isArray(parsedValue)) throw new Error('Valor inválido para array');
                    break;
            }
        } catch (e) {
            showCustomAlert('Erro de Validação', `Erro ao processar valor da variável: ${e.message}`);
            return;
        }

        projectVariables[name] = { type: newType, value: parsedValue };
        logToConsole(`Variável "${name}" atualizada com sucesso.`, 'success');
        refreshEditVariableList();
        updateAllDynamicProperties(); // Update components that might use this variable
        closeEditSingleVariableModal();
    });

    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            closeModalHandler();
        }
    });
}

function closeEditSingleVariableModal() {
    const modal = document.getElementById('edit-single-variable-modal');
    if (modal) {
        modal.remove();
    }
}

// --- Helper function to attach suggestion listeners ---
function attachSuggestionListener(inputElement) {
    if (!inputElement || inputElement.tagName !== 'INPUT' || !['text', 'url'].includes(inputElement.type)) {
        return;
    }

    const show = (filter = '') => {
        // Use a small timeout to handle asynchronous input events gracefully
        setTimeout(() => showSuggestions(inputElement, filter), 50);
    };

    const handleInput = (e) => {
        const value = e.target.value;
        const cursorPos = e.target.selectionStart;

        const lastOpenBracket = value.lastIndexOf('<', cursorPos - 1);
        const lastCloseBracket = value.lastIndexOf('>', cursorPos - 1);

        // Hide suggestions if we are not inside a <...> block
        if (lastOpenBracket === -1 || lastOpenBracket < lastCloseBracket) {
            hideSuggestions();
            return;
        }

        // Find the start of the current word/token the user is typing
        const textInside = value.substring(lastOpenBracket + 1, cursorPos);
        const lastDelimiterIndex = Math.max(
            textInside.lastIndexOf(' '),
            textInside.lastIndexOf('+'),
            textInside.lastIndexOf('-'),
            textInside.lastIndexOf('*'),
            textInside.lastIndexOf('/'),
            textInside.lastIndexOf('(')
        );

        const filterText = textInside.substring(lastDelimiterIndex + 1);

        // Hide suggestions if the user just typed a space/operator,
        // but show all suggestions if the expression is empty (right after '<').
        if (filterText === '' && textInside.length > 0) {
            hideSuggestions();
        } else {
            show(filterText);
        }
    };

    const handleKeyDown = (e) => {
        if (suggestionsContainer) {
            if (e.key === 'Escape') {
                hideSuggestions();
                e.stopPropagation(); // Prevent modal from closing if any
            }
            // Future enhancement: Add ArrowUp, ArrowDown, Enter to navigate suggestions
        }
    };

    const handleBlur = () => {
        // Delay hiding to allow a click on a suggestion item
        setTimeout(() => {
            if (suggestionsContainer && !suggestionsContainer.matches(':hover')) {
                hideSuggestions();
            }
        }, 150);
    };

    // Add all necessary listeners
    inputElement.addEventListener('input', handleInput);
    inputElement.addEventListener('keydown', handleKeyDown);
    inputElement.addEventListener('blur', handleBlur);
}

// --- Suggestions Dropdown Functions ---
let suggestionsContainer = null;

function hideSuggestions() {
    if (suggestionsContainer) {
        suggestionsContainer.remove();
        suggestionsContainer = null;
    }
}

function showSuggestions(inputElement, filterText = '') {
    hideSuggestions(); // Remove any existing suggestions

    const suggestions = [];

    // 1. Get project variables
    Object.keys(projectVariables).forEach(varName => {
        const variable = projectVariables[varName];
        let displayValue = JSON.stringify(variable.value);
        if (displayValue.length > 25) {
            displayValue = displayValue.substring(0, 25) + '...';
        }
        suggestions.push({
            name: varName,
            value: `(valor: ${displayValue})`,
            insertText: `<${varName}>`
        });
    });

    // 2. Get component properties
    const allComponents = document.querySelectorAll('.designer-component');
    allComponents.forEach(component => {
        const componentId = component.dataset.componentId;
        const componentType = component.dataset.componentType;
        const componentDef = componentLibrary.find(c => c.type === componentType);
        
        if (componentDef) {
            const props = Object.keys(componentDef.defaultProps);
            if (['input', 'textarea', 'select'].includes(componentType)) props.push('value');
            if (componentType === 'checkbox') props.push('checked');

            props.forEach(prop => {
                suggestions.push({
                    name: `${componentId}.${prop}`,
                    value: `(propriedade de ${componentType})`,
                    insertText: `<${componentId}.${prop}>`
                });
            });
        }
    });

    const filteredSuggestions = suggestions.filter(s => 
        s.name.toLowerCase().startsWith(filterText.toLowerCase())
    );

    if (filteredSuggestions.length === 0) {
        return; // Do not show the container if there are no suggestions
    }

    // Create container
    suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'suggestions-container';
    
    // Create and append items
    filteredSuggestions.forEach(suggestion => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.innerHTML = `
            <span class="suggestion-name">${suggestion.name}</span>
            <span class="suggestion-value">${suggestion.value}</span>
        `;
        item.addEventListener('mousedown', (e) => {
            e.preventDefault(); // Prevent input from losing focus
            const currentVal = inputElement.value;
            const cursorPos = inputElement.selectionStart;
            const lastOpenBracket = currentVal.lastIndexOf('<', cursorPos - 1);
            
            if (lastOpenBracket !== -1) {
                // To replace the filter text, we need to know what it was
                const textToReplace = currentVal.substring(lastOpenBracket, cursorPos);
                const newValue = currentVal.substring(0, lastOpenBracket) + suggestion.insertText + currentVal.substring(cursorPos);
                inputElement.value = newValue;
                inputElement.focus();
                const newCursorPos = lastOpenBracket + suggestion.insertText.length;
                inputElement.setSelectionRange(newCursorPos, newCursorPos);
            }
            hideSuggestions();
        });
        suggestionsContainer.appendChild(item);
    });

    // Position and append to body
    document.body.appendChild(suggestionsContainer);
    const rect = inputElement.getBoundingClientRect();
    suggestionsContainer.style.left = `${rect.left}px`;
    suggestionsContainer.style.top = `${rect.bottom + 2}px`;
    suggestionsContainer.style.width = `${rect.width}px`;

    // Add listener to close on outside click
    const clickOutsideHandler = (event) => {
        if (suggestionsContainer && !suggestionsContainer.contains(event.target) && event.target !== inputElement) {
            hideSuggestions();
            document.removeEventListener('mousedown', clickOutsideHandler);
        }
    };
    // Use setTimeout to avoid the same click that opened the suggestions from closing it
    setTimeout(() => {
        document.addEventListener('mousedown', clickOutsideHandler);
    }, 0);
}


// Atualizar setupVariableButtonListener para incluir o novo botão
function setupVariableButtonListener() {
    const addButton = document.getElementById('btn-show-add-var-modal');
    const editButton = document.getElementById('btn-show-edit-vars-modal');

    if (addButton) {
        addButton.removeEventListener('click', showAddVariableModal);
        addButton.addEventListener('click', showAddVariableModal);
    }
    if (editButton) {
        editButton.removeEventListener('click', showEditVariablesModal);
        editButton.addEventListener('click', showEditVariablesModal);
    }
}