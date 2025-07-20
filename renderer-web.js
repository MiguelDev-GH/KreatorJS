// KreatorJS - Web Version (sem Electron)
// Lógica principal da IDE adaptada para navegador

// Estado global da aplicação
let currentProject = null;
let selectedComponent = null;
let componentCounter = 0;
let undoStack = [];
let redoStack = [];

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
    }
];

// Sistema de eventos
const eventSystem = {
    availableEvents: {
        button: [
            { name: 'click', label: 'Clicado', description: 'Quando o botão for clicado' },
            { name: 'mouseover', label: 'Mouse sobre', description: 'Quando o mouse passar sobre o botão' },
            { name: 'mouseout', label: 'Mouse fora', description: 'Quando o mouse sair do botão' }
        ],
        input: [
            { name: 'input', label: 'Texto alterado', description: 'Quando o texto for alterado' },
            { name: 'focus', label: 'Focado', description: 'Quando o campo receber foco' },
            { name: 'blur', label: 'Desfocado', description: 'Quando o campo perder foco' }
        ],
        textarea: [
            { name: 'input', label: 'Texto alterado', description: 'Quando o texto for alterado' },
            { name: 'focus', label: 'Focado', description: 'Quando o campo receber foco' },
            { name: 'blur', label: 'Desfocado', description: 'Quando o campo perder foco' }
        ],
        label: [
            { name: 'click', label: 'Clicado', description: 'Quando o rótulo for clicado' },
            { name: 'mouseover', label: 'Mouse sobre', description: 'Quando o mouse passar sobre' }
        ],
        div: [
            { name: 'click', label: 'Clicado', description: 'Quando o painel for clicado' },
            { name: 'mouseover', label: 'Mouse sobre', description: 'Quando o mouse passar sobre' }
        ],
        image: [
            { name: 'click', label: 'Clicado', description: 'Quando a imagem for clicada' },
            { name: 'load', label: 'Carregada', description: 'Quando a imagem for carregada' }
        ]
    },
    
    availableActions: {
        text: [
            { id: 'change_text', name: 'Alterar texto', description: 'Mudar o texto do elemento' },
            { id: 'change_color', name: 'Alterar cor', description: 'Mudar a cor do texto' },
            { id: 'show_hide', name: 'Mostrar/Ocultar', description: 'Mostrar ou ocultar o elemento' }
        ],
        visual: [
            { id: 'change_background', name: 'Alterar fundo', description: 'Mudar cor de fundo' },
            { id: 'show_hide', name: 'Mostrar/Ocultar', description: 'Mostrar ou ocultar o elemento' }
        ],
        input: [
            { id: 'change_value', name: 'Alterar valor', description: 'Mudar o valor do campo' },
            { id: 'clear_value', name: 'Limpar valor', description: 'Limpar o conteúdo do campo' },
            { id: 'show_hide', name: 'Mostrar/Ocultar', description: 'Mostrar ou ocultar o elemento' }
        ],
        global: [
            { id: 'show_alert', name: 'Mostrar alerta', description: 'Exibir uma mensagem de alerta' },
            { id: 'console_log', name: 'Log no console', description: 'Escrever mensagem no console' }
        ]
    }
};

// Variável global para armazenar eventos dos componentes
let componentEvents = {};

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', () => {
    initializeIDE();
    setupEventListeners();
    populateComponentPalette();
    logToConsole('KreatorJS inicializado com sucesso!', 'success');
});

// Inicializar a IDE
function initializeIDE() {
    const canvas = document.getElementById('designer-canvas');
    setupDesignerCanvas(canvas);
    updateUI();
}

// Configurar listeners de eventos
function setupEventListeners() {
    document.getElementById('btn-new').addEventListener('click', newProject);
    document.getElementById('btn-open').addEventListener('click', openProject);
    document.getElementById('btn-save').addEventListener('click', saveProject);
    document.getElementById('btn-run').addEventListener('click', runProject);
    document.getElementById('btn-package').addEventListener('click', packageProject);
    
    document.getElementById('btn-grid').addEventListener('click', toggleGrid);
    document.getElementById('btn-clear').addEventListener('click', clearDesigner);
    document.getElementById('btn-clear-console').addEventListener('click', clearConsole);
    
    document.getElementById('modal-close').addEventListener('click', closeCodeModal);
    document.getElementById('btn-copy-code').addEventListener('click', copyCode);
    document.getElementById('btn-save-code').addEventListener('click', saveCode);
    
    document.addEventListener('keydown', handleKeyboard);
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
        
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
        
        palette.appendChild(item);
    });
}

// Configurar canvas do designer
function setupDesignerCanvas(canvas) {
    canvas.addEventListener('dragover', handleDragOver);
    canvas.addEventListener('drop', handleDrop);
    canvas.addEventListener('dragleave', handleDragLeave);
    
    canvas.addEventListener('click', (e) => {
        if (e.target === canvas) {
            selectComponent(null);
        }
    });
}

// Manipuladores de drag and drop
function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.componentType);
    e.target.classList.add('dragging');
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const componentType = e.dataTransfer.getData('text/plain');
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    createComponent(componentType, x, y);
}

// Criar componente no designer
function createComponent(type, x, y) {
    const componentDef = componentLibrary.find(c => c.type === type);
    if (!componentDef) return;
    
    componentCounter++;
    const componentId = `${type}_${componentCounter}`;
    
    const wrapper = document.createElement('div');
    wrapper.className = 'designer-component';
    wrapper.dataset.componentId = componentId;
    wrapper.dataset.componentType = type;
    wrapper.style.left = x + 'px';
    wrapper.style.top = y + 'px';
    
    const props = { ...componentDef.defaultProps };
    const html = generateComponentHTML(componentDef, props);
    wrapper.innerHTML = html + '<div class="resize-handle"></div>';
    
    applyComponentStyles(wrapper, props);
    setupComponentEvents(wrapper);
    
    const canvas = document.getElementById('designer-canvas');
    const placeholder = canvas.querySelector('.canvas-placeholder');
    if (placeholder) {
        placeholder.style.display = 'none';
    }
    
    canvas.appendChild(wrapper);
    selectComponent(wrapper);
    saveState();
    
    logToConsole(`Componente ${componentDef.name} adicionado (ID: ${componentId})`, 'success');
}

// Gerar HTML do componente
function generateComponentHTML(componentDef, props) {
    let html = componentDef.html;
    
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
    
    Object.keys(props).forEach(key => {
        if (key !== 'text' && key !== 'placeholder' && key !== 'src' && key !== 'alt') {
            element.style[key] = props[key];
        }
    });
    
    if (props.width) wrapper.style.width = props.width;
    if (props.height) wrapper.style.height = props.height;
}

// Configurar eventos do componente
function setupComponentEvents(wrapper) {
    wrapper.addEventListener('click', (e) => {
        e.stopPropagation();
        selectComponent(wrapper);
    });
    
    wrapper.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        editComponentEvent(wrapper);
    });
    
    wrapper.addEventListener('mousedown', startDrag);
    
    const resizeHandle = wrapper.querySelector('.resize-handle');
    if (resizeHandle) {
        resizeHandle.addEventListener('mousedown', startResize);
    }
}

// Selecionar componente
function selectComponent(component) {
    document.querySelectorAll('.designer-component.selected').forEach(el => {
        el.classList.remove('selected');
    });
    
    selectedComponent = component;
    
    if (component) {
        component.classList.add('selected');
        populateObjectInspector(component);
    } else {
        clearObjectInspector();
    }
}

// Popular inspetor de objetos
function populateObjectInspector(component) {
    const inspector = document.getElementById('object-inspector');
    const componentType = component.dataset.componentType;
    const componentDef = componentLibrary.find(c => c.type === componentType);
    
    if (!componentDef) return;
    
    inspector.innerHTML = `
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
            <div class="property-group-title">Propriedades Básicas</div>
            ${generateBasicPropertyInputs(componentDef, component)}
        </div>
        
        <div class="property-group collapsible">
            <div class="property-group-title collapsible-header" onclick="togglePropertyGroup(this)">
                <span>Estilo</span>
                <span class="collapse-icon">▼</span>
            </div>
            <div class="property-group-content">
                ${generateStylePropertyInputs(componentDef, component)}
            </div>
        </div>
        
        <div class="property-group">
            <div class="property-group-title">Eventos</div>
            <button class="btn" onclick="editComponentEvent(selectedComponent)">Editar Eventos</button>
            <div class="event-count">
                ${getEventCount(component.dataset.componentId)} evento(s) configurado(s)
            </div>
        </div>
    `;
    
    setupPropertyListeners();
}

// Gerar inputs de propriedades básicas
function generateBasicPropertyInputs(componentDef, component) {
    const element = component.firstElementChild;
    const basicProps = ['text', 'placeholder', 'src', 'alt', 'width', 'height'];
    let html = '';
    
    Object.keys(componentDef.defaultProps).forEach(key => {
        if (basicProps.includes(key)) {
            const value = getPropertyValue(element, key);
            const inputType = getInputType(key);
            
            html += `
                <div class="property-item">
                    <label class="property-label">${formatPropertyName(key)}</label>
                    <input type="${inputType}" class="property-input" data-property="${key}" value="${value}">
                </div>
            `;
        }
    });
    
    return html;
}

// Gerar inputs de propriedades de estilo
function generateStylePropertyInputs(componentDef, component) {
    const element = component.firstElementChild;
    const styleProps = [
        'backgroundColor', 'color', 'border', 'borderRadius', 'fontSize', 
        'fontWeight', 'padding', 'margin', 'textAlign', 'boxShadow',
        'opacity', 'transform', 'transition', 'cursor', 'overflow'
    ];
    let html = '';
    
    // Propriedades existentes do componente
    Object.keys(componentDef.defaultProps).forEach(key => {
        if (styleProps.includes(key)) {
            const value = getPropertyValue(element, key);
            const inputType = getInputType(key);
            
            html += `
                <div class="property-item">
                    <label class="property-label">${formatPropertyName(key)}</label>
                    <input type="${inputType}" class="property-input" data-property="${key}" value="${value}">
                </div>
            `;
        }
    });
    
    // Propriedades de estilo adicionais
    const additionalStyleProps = [
        { key: 'margin', label: 'Margem', defaultValue: '0px' },
        { key: 'textAlign', label: 'Alinhamento do Texto', defaultValue: 'left' },
        { key: 'boxShadow', label: 'Sombra', defaultValue: 'none' },
        { key: 'opacity', label: 'Opacidade', defaultValue: '1' },
        { key: 'transform', label: 'Transformação', defaultValue: 'none' },
        { key: 'transition', label: 'Transição', defaultValue: 'none' },
        { key: 'cursor', label: 'Cursor', defaultValue: 'default' },
        { key: 'overflow', label: 'Overflow', defaultValue: 'visible' }
    ];
    
    additionalStyleProps.forEach(prop => {
        if (!Object.keys(componentDef.defaultProps).includes(prop.key)) {
            const value = element.style[prop.key] || prop.defaultValue;
            const inputType = getInputType(prop.key);
            
            html += `
                <div class="property-item">
                    <label class="property-label">${prop.label}</label>
                    <input type="${inputType}" class="property-input" data-property="${prop.key}" value="${value}">
                </div>
            `;
        }
    });
    
    // Seletores especiais para algumas propriedades
    html += `
        <div class="property-item">
            <label class="property-label">Alinhamento do Texto</label>
            <select class="property-input" data-property="textAlign">
                <option value="left">Esquerda</option>
                <option value="center">Centro</option>
                <option value="right">Direita</option>
                <option value="justify">Justificado</option>
            </select>
        </div>
        
        <div class="property-item">
            <label class="property-label">Cursor</label>
            <select class="property-input" data-property="cursor">
                <option value="default">Padrão</option>
                <option value="pointer">Ponteiro</option>
                <option value="text">Texto</option>
                <option value="move">Mover</option>
                <option value="not-allowed">Não Permitido</option>
            </select>
        </div>
        
        <div class="property-item">
            <label class="property-label">Overflow</label>
            <select class="property-input" data-property="overflow">
                <option value="visible">Visível</option>
                <option value="hidden">Oculto</option>
                <option value="scroll">Scroll</option>
                <option value="auto">Automático</option>
            </select>
        </div>
    `;
    
    return html;
}

// Alternar grupo de propriedades
function togglePropertyGroup(header) {
    const content = header.nextElementSibling;
    const icon = header.querySelector('.collapse-icon');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.textContent = '▼';
    } else {
        content.style.display = 'none';
        icon.textContent = '▶';
    }
}

// Obter contagem de eventos
function getEventCount(componentId) {
    return componentEvents[componentId] ? componentEvents[componentId].length : 0;
}

// Gerar inputs de propriedades
function generatePropertyInputs(componentDef, component) {
    const element = component.firstElementChild;
    let html = '';
    
    Object.keys(componentDef.defaultProps).forEach(key => {
        const value = getPropertyValue(element, key);
        const inputType = getInputType(key);
        
        html += `
            <div class="property-item">
                <label class="property-label">${formatPropertyName(key)}</label>
                <input type="${inputType}" class="property-input" data-property="${key}" value="${value}">
            </div>
        `;
    });
    
    return html;
}

// Obter valor da propriedade
function getPropertyValue(element, property) {
    switch (property) {
        case 'text':
            return element.textContent || element.value || '';
        case 'placeholder':
            return element.placeholder || '';
        case 'src':
            return element.src || '';
        case 'alt':
            return element.alt || '';
        default:
            return element.style[property] || '';
    }
}

// Obter tipo de input
function getInputType(property) {
    if (property.includes('color') || property.includes('Color')) return 'color';
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
    });
}

// Atualizar propriedade do componente
function updateComponentProperty(property, value) {
    if (!selectedComponent) return;
    
    const element = selectedComponent.firstElementChild;
    if (!element) return;
    
    switch (property) {
        case 'text':
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.value = value;
            } else {
                element.textContent = value;
            }
            break;
        case 'placeholder':
            element.placeholder = value;
            break;
        case 'src':
            element.src = value;
            break;
        case 'alt':
            element.alt = value;
            break;
        default:
            element.style[property] = value;
            break;
    }
    
    if (property === 'width') {
        selectedComponent.style.width = value;
    }
    if (property === 'height') {
        selectedComponent.style.height = value;
    }
}

// Limpar inspetor de objetos
function clearObjectInspector() {
    const inspector = document.getElementById('object-inspector');
    inspector.innerHTML = `
        <div class="inspector-placeholder">
            <p>Selecione um componente para editar suas propriedades</p>
        </div>
    `;
}

// Editar evento do componente
function editComponentEvent(component) {
    if (!component) return;
    
    const componentId = component.dataset.componentId;
    const componentType = component.dataset.componentType;
    
    showEventEditor(componentId, componentType);
}

// Mostrar editor de eventos
function showEventEditor(componentId, componentType) {
    const availableEvents = eventSystem.availableEvents[componentType] || [];
    const existingEvents = componentEvents[componentId] || [];
    
    // Criar modal de eventos
    const modal = document.createElement('div');
    modal.className = 'event-modal';
    modal.innerHTML = `
        <div class="event-modal-content">
            <div class="event-modal-header">
                <h3>Editor de Eventos - ${componentId}</h3>
                <button class="close-btn" onclick="closeEventModal()">&times;</button>
            </div>
            <div class="event-modal-body">
                <div class="event-section">
                    <h4>Eventos Disponíveis</h4>
                    <div class="event-list">
                        ${availableEvents.map(event => `
                            <div class="event-item" onclick="addEvent('${componentId}', '${event.name}')">
                                <strong>${event.label}</strong>
                                <p>${event.description}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="event-section">
                    <h4>Eventos Configurados</h4>
                    <div class="configured-events" id="configured-events-${componentId}">
                        ${generateConfiguredEventsList(componentId, existingEvents)}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    logToConsole(`Editor de eventos aberto para ${componentId}`, 'info');
}

// Gerar lista de eventos configurados
function generateConfiguredEventsList(componentId, events) {
    if (events.length === 0) {
        return '<p class="no-events">Nenhum evento configurado</p>';
    }
    
    return events.map((event, index) => `
        <div class="configured-event">
            <div class="event-header">
                <strong>${event.eventType}</strong>
                <button class="remove-event-btn" onclick="removeEvent('${componentId}', ${index})">×</button>
            </div>
            <div class="event-details">
                <p><strong>Alvo:</strong> ${event.targetId}</p>
                <p><strong>Ação:</strong> ${event.action}</p>
                <p><strong>Valor:</strong> ${event.value || 'N/A'}</p>
            </div>
        </div>
    `).join('');
}

// Adicionar evento
function addEvent(componentId, eventType) {
    showActionSelector(componentId, eventType);
}

// Mostrar seletor de ação
function showActionSelector(componentId, eventType) {
    const canvas = document.getElementById('designer-canvas');
    const components = canvas.querySelectorAll('.designer-component');
    
    const targetOptions = Array.from(components).map(comp => ({
        id: comp.dataset.componentId,
        type: comp.dataset.componentType,
        name: `${comp.dataset.componentType}_${comp.dataset.componentId.split('_')[1]}`
    }));
    
    const actionModal = document.createElement('div');
    actionModal.className = 'action-modal';
    actionModal.innerHTML = `
        <div class="action-modal-content">
            <div class="action-modal-header">
                <h3>Configurar Ação para Evento: ${eventType}</h3>
                <button class="close-btn" onclick="closeActionModal()">&times;</button>
            </div>
            <div class="action-modal-body">
                <div class="action-form">
                    <div class="form-group">
                        <label>Elemento Alvo:</label>
                        <select id="target-select">
                            <option value="">Selecione um elemento</option>
                            ${targetOptions.map(target => `
                                <option value="${target.id}">${target.name} (${target.type})</option>
                            `).join('')}
                            <option value="global">Ação Global</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Ação:</label>
                        <select id="action-select" onchange="updateActionOptions()">
                            <option value="">Selecione uma ação</option>
                        </select>
                    </div>
                    
                    <div class="form-group" id="value-group" style="display: none;">
                        <label>Valor:</label>
                        <input type="text" id="action-value" placeholder="Digite o valor">
                    </div>
                    
                    <div class="form-actions">
                        <button onclick="saveEventAction('${componentId}', '${eventType}')" class="btn primary">Salvar Evento</button>
                        <button onclick="closeActionModal()" class="btn">Cancelar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(actionModal);
    
    // Configurar listener para mudança de alvo
    document.getElementById('target-select').addEventListener('change', updateActionOptions);
}

// Atualizar opções de ação baseado no alvo
function updateActionOptions() {
    const targetSelect = document.getElementById('target-select');
    const actionSelect = document.getElementById('action-select');
    const targetId = targetSelect.value;
    
    actionSelect.innerHTML = '<option value="">Selecione uma ação</option>';
    
    if (targetId === 'global') {
        eventSystem.availableActions.global.forEach(action => {
            actionSelect.innerHTML += `<option value="${action.id}">${action.name}</option>`;
        });
    } else if (targetId) {
        const targetElement = document.querySelector(`[data-component-id="${targetId}"]`);
        if (targetElement) {
            const targetType = targetElement.dataset.componentType;
            
            // Adicionar ações baseadas no tipo do elemento
            if (targetType === 'input' || targetType === 'textarea') {
                eventSystem.availableActions.input.forEach(action => {
                    actionSelect.innerHTML += `<option value="${action.id}">${action.name}</option>`;
                });
            } else {
                eventSystem.availableActions.text.forEach(action => {
                    actionSelect.innerHTML += `<option value="${action.id}">${action.name}</option>`;
                });
                eventSystem.availableActions.visual.forEach(action => {
                    actionSelect.innerHTML += `<option value="${action.id}">${action.name}</option>`;
                });
            }
        }
    }
    
    // Mostrar/ocultar campo de valor baseado na ação
    actionSelect.addEventListener('change', () => {
        const valueGroup = document.getElementById('value-group');
        const actionValue = actionSelect.value;
        
        if (actionValue && actionValue !== 'show_hide') {
            valueGroup.style.display = 'block';
        } else {
            valueGroup.style.display = 'none';
        }
    });
}

// Salvar ação do evento
function saveEventAction(componentId, eventType) {
    const targetId = document.getElementById('target-select').value;
    const action = document.getElementById('action-select').value;
    const value = document.getElementById('action-value').value;
    
    if (!targetId || !action) {
        alert('Por favor, selecione um alvo e uma ação');
        return;
    }
    
    if (!componentEvents[componentId]) {
        componentEvents[componentId] = [];
    }
    
    const eventConfig = {
        eventType: eventType,
        targetId: targetId,
        action: action,
        value: value
    };
    
    componentEvents[componentId].push(eventConfig);
    
    // Aplicar evento ao elemento
    applyEventToComponent(componentId, eventConfig);
    
    // Atualizar lista de eventos configurados
    const configuredEventsDiv = document.getElementById(`configured-events-${componentId}`);
    if (configuredEventsDiv) {
        configuredEventsDiv.innerHTML = generateConfiguredEventsList(componentId, componentEvents[componentId]);
    }
    
    closeActionModal();
    logToConsole(`Evento ${eventType} adicionado ao componente ${componentId}`, 'success');
}

// Aplicar evento ao componente
function applyEventToComponent(componentId, eventConfig) {
    const component = document.querySelector(`[data-component-id="${componentId}"]`);
    if (!component) return;
    
    const element = component.firstElementChild;
    if (!element) return;
    
    element.addEventListener(eventConfig.eventType, () => {
        executeEventAction(eventConfig);
    });
}

// Executar ação do evento
function executeEventAction(eventConfig) {
    if (eventConfig.targetId === 'global') {
        executeGlobalAction(eventConfig);
    } else {
        executeElementAction(eventConfig);
    }
}

// Executar ação global
function executeGlobalAction(eventConfig) {
    switch (eventConfig.action) {
        case 'show_alert':
            alert(eventConfig.value || 'Alerta do KreatorJS!');
            break;
        case 'console_log':
            console.log(eventConfig.value || 'Log do KreatorJS');
            logToConsole(eventConfig.value || 'Log do KreatorJS', 'info');
            break;
    }
}

// Executar ação em elemento
function executeElementAction(eventConfig) {
    const targetComponent = document.querySelector(`[data-component-id="${eventConfig.targetId}"]`);
    if (!targetComponent) return;
    
    const targetElement = targetComponent.firstElementChild;
    if (!targetElement) return;
    
    switch (eventConfig.action) {
        case 'change_text':
            if (targetElement.tagName === 'INPUT' || targetElement.tagName === 'TEXTAREA') {
                targetElement.value = eventConfig.value;
            } else {
                targetElement.textContent = eventConfig.value;
            }
            break;
        case 'change_color':
            targetElement.style.color = eventConfig.value;
            break;
        case 'change_background':
            targetElement.style.backgroundColor = eventConfig.value;
            break;
        case 'show_hide':
            targetComponent.style.display = targetComponent.style.display === 'none' ? 'block' : 'none';
            break;
        case 'change_value':
            if (targetElement.tagName === 'INPUT' || targetElement.tagName === 'TEXTAREA') {
                targetElement.value = eventConfig.value;
            }
            break;
        case 'clear_value':
            if (targetElement.tagName === 'INPUT' || targetElement.tagName === 'TEXTAREA') {
                targetElement.value = '';
            }
            break;
    }
}

// Remover evento
function removeEvent(componentId, eventIndex) {
    if (componentEvents[componentId] && componentEvents[componentId][eventIndex]) {
        componentEvents[componentId].splice(eventIndex, 1);
        
        // Atualizar lista de eventos configurados
        const configuredEventsDiv = document.getElementById(`configured-events-${componentId}`);
        if (configuredEventsDiv) {
            configuredEventsDiv.innerHTML = generateConfiguredEventsList(componentId, componentEvents[componentId]);
        }
        
        logToConsole(`Evento removido do componente ${componentId}`, 'info');
    }
}

// Fechar modais
function closeEventModal() {
    const modal = document.querySelector('.event-modal');
    if (modal) {
        modal.remove();
    }
}

function closeActionModal() {
    const modal = document.querySelector('.action-modal');
    if (modal) {
        modal.remove();
    }
}

// Funções da toolbar
function newProject() {
    if (confirm('Criar novo projeto? Todas as alterações não salvas serão perdidas.')) {
        clearDesigner();
        currentProject = null;
        componentCounter = 0;
        undoStack = [];
        redoStack = [];
        logToConsole('Novo projeto criado', 'success');
    }
}

function openProject() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".kreator.kjs";
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const projectData = JSON.parse(event.target.result);
                loadProjectData(projectData);
                logToConsole("Projeto carregado com sucesso!", "success");
            } catch (error) {
                logToConsole("Erro ao carregar projeto: " + error.message, "error");
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function saveProject() {
    const projectData = collectProjectData();
    const dataStr = JSON.stringify(projectData, null, 2);
    
    // Criar download do arquivo
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'projeto.kreator.kjs';
    a.click();
    URL.revokeObjectURL(url);
    
    logToConsole('Projeto salvo como download', 'success');
}

function runProject() {
    const htmlCode = generateHTML();
    const jsCode = generateJavaScript();
    
    const previewWindow = window.open('', '_blank', 'width=800,height=600');
    previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Preview - KreatorJS</title>
            <style>
                body { margin: 20px; font-family: Arial, sans-serif; }
            </style>
        </head>
        <body>
            ${htmlCode}
            <script>${jsCode}</script>
        </body>
        </html>
    `);
    previewWindow.document.close();
    
    logToConsole('Projeto executado em nova janela', 'success');
}

function packageProject() {
    alert('Funcionalidade de empacotamento em desenvolvimento na versão web!');
}

// Gerar código HTML
function generateHTML() {
    const canvas = document.getElementById('designer-canvas');
    const components = canvas.querySelectorAll('.designer-component');
    
    let html = '<div style="position: relative; width: 100%; height: 100vh;">\n';
    
    components.forEach(component => {
        const element = component.firstElementChild;
        const rect = component.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        
        const x = rect.left - canvasRect.left;
        const y = rect.top - canvasRect.top;
        
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

// Gerar código JavaScript
function generateJavaScript() {
    return '// Código JavaScript gerado pelo KreatorJS\nconsole.log("Aplicação carregada!");';
}

// Coletar dados do projeto atual
function collectProjectData() {
    const canvas = document.getElementById('designer-canvas');
    const components = canvas.querySelectorAll('.designer-component');
    
    const projectData = {
        version: '1.0.0',
        name: 'Projeto KreatorJS',
        componentCounter: componentCounter,
        components: []
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
                width: component.style.width || 'auto',
                height: component.style.height || 'auto'
            },
            properties: extractComponentProperties(component),
            events: componentEvents[component.dataset.componentId] || []
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

// Outras funções utilitárias
function toggleGrid() {
    const canvas = document.getElementById('designer-canvas');
    canvas.style.backgroundImage = canvas.style.backgroundImage ? '' : 
        'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)';
}

function clearDesigner() {
    if (confirm('Limpar designer? Todos os componentes serão removidos.')) {
        const canvas = document.getElementById('designer-canvas');
        const components = canvas.querySelectorAll('.designer-component');
        components.forEach(component => component.remove());
        
        const placeholder = canvas.querySelector('.canvas-placeholder');
        if (placeholder) {
            placeholder.style.display = 'block';
        }
        
        selectComponent(null);
        saveState();
        logToConsole('Designer limpo', 'success');
    }
}

function clearConsole() {
    const console = document.getElementById('console-output');
    console.innerHTML = '<div class="console-line">Console limpo</div>';
}

// Sistema de undo/redo
function saveState() {
    const canvas = document.getElementById('designer-canvas');
    const state = canvas.innerHTML;
    undoStack.push(state);
    
    if (undoStack.length > 50) {
        undoStack.shift();
    }
    
    redoStack = [];
}

// Manipulação de teclado
function handleKeyboard(e) {
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
        
        if (selectedComponent) {
            populateObjectInspector(selectedComponent);
        }
        
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResize);
    }
}

function updateUI() {
    // Atualizar estado dos botões e interface
}

// Modal de código
function showCodeModal(title, code) {
    const modal = document.getElementById('code-modal');
    const modalTitle = document.getElementById('modal-title');
    const codeEditor = document.getElementById('code-editor');
    
    modalTitle.textContent = title;
    codeEditor.value = code;
    modal.style.display = 'block';
}

function closeCodeModal() {
    document.getElementById('code-modal').style.display = 'none';
}

function copyCode() {
    const codeEditor = document.getElementById('code-editor');
    codeEditor.select();
    document.execCommand('copy');
    logToConsole('Código copiado para a área de transferência', 'success');
}

function saveCode() {
    const codeEditor = document.getElementById('code-editor');
    const title = document.getElementById('modal-title').textContent;
    
    const extension = title.includes('HTML') ? 'html' : 'js';
    const filename = `codigo.${extension}`;
    
    const blob = new Blob([codeEditor.value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    logToConsole(`Código salvo como ${filename}`, 'success');
    closeCodeModal();
}

// Log para console
function logToConsole(message, type = 'info') {
    const console = document.getElementById('console-output');
    const line = document.createElement('div');
    line.className = `console-line ${type}`;
    line.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    
    console.appendChild(line);
    console.scrollTop = console.scrollHeight;
}



// Carregar dados do projeto
function loadProjectData(projectData) {
    clearDesigner();
    componentCounter = projectData.componentCounter || 0;
    componentEvents = {}; // Limpar eventos existentes

    projectData.components.forEach(compData => {
        const componentDef = componentLibrary.find(c => c.type === compData.type);
        if (!componentDef) return;

        const wrapper = document.createElement("div");
        wrapper.className = "designer-component";
        wrapper.dataset.componentId = compData.id;
        wrapper.dataset.componentType = compData.type;
        wrapper.style.left = compData.position.x + "px";
        wrapper.style.top = compData.position.y + "px";
        wrapper.style.width = compData.size.width;
        wrapper.style.height = compData.size.height;

        const html = generateComponentHTML(componentDef, compData.properties);
        wrapper.innerHTML = html + 
            `<div class="resize-handle"></div>`;

        applyComponentStyles(wrapper, compData.properties);
        setupComponentEvents(wrapper);

        document.getElementById("designer-canvas").appendChild(wrapper);

        // Carregar eventos do componente
        if (compData.events) {
            componentEvents[compData.id] = compData.events;
        }
    });

    const placeholder = document.getElementById("designer-canvas").querySelector(".canvas-placeholder");
    if (placeholder) {
        placeholder.style.display = projectData.components.length > 0 ? "none" : "block";
    }

    saveState();
    selectComponent(null);
}


