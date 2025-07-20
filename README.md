# KreatorJS - IDE Visual para JavaScript

## Visão Geral

O KreatorJS é uma IDE visual completa para desenvolvimento de aplicações JavaScript. Permite criar interfaces de usuário através de drag-and-drop, configurar eventos de forma intuitiva e exportar projetos completos.

## Funcionalidades Implementadas

### ✅ Funcionalidades Básicas
- **Paleta de Componentes**: Botão, Campo de Texto, Rótulo, Painel, Imagem, Área de Texto
- **Designer Visual**: Área de design com grid opcional e drag-and-drop
- **Inspetor de Propriedades**: Edição em tempo real das propriedades dos componentes
- **Console**: Log de ações e mensagens do sistema

### ✅ Gerenciamento de Projetos
- **Novo Projeto**: Criação com templates pré-definidos (Projeto em Branco, Formulário de Contato, Dashboard)
- **Salvar/Carregar**: Salvamento em formato JSON (.kreator)
- **Exportação**: HTML, JavaScript e projeto completo

### ✅ Sistema de Eventos Intuitivo
- **Lista de Eventos**: Eventos disponíveis por tipo de componente (click, mouseover, input, etc.)
- **Seleção de Elementos Alvo**: Interface para escolher qual elemento será afetado
- **Ações Configuráveis**: Alterar texto, cor, fundo, mostrar/ocultar, alertas, etc.
- **Múltiplos Eventos**: Possibilidade de adicionar infinitos eventos por elemento
- **Relacionamento entre Elementos**: Um elemento pode afetar outros elementos

### ✅ Funcionalidades de Exportação/Importação
- **Exportar HTML**: Gera código HTML completo
- **Exportar JavaScript**: Gera código JS com eventos configurados
- **Exportar Projeto Completo**: Inclui HTML, CSS, JS e README
- **Salvar Projeto**: Formato JSON para reabrir no KreatorJS

## Estrutura de Arquivos

```
KreatorJS/
├── main.js                 # Processo principal do Electron
├── index.html             # Interface principal (versão Electron)
├── index-web.html         # Interface web (sem dependências Electron)
├── renderer.js            # Lógica principal (versão Electron)
├── renderer-web.js        # Lógica adaptada para web
├── styles.css             # Estilos da interface
├── package.json           # Configurações do projeto
└── README.md             # Esta documentação
```

## Como Usar

### Versão Electron (Desktop)
```bash
npm install
npm start
```

### Versão Web (Navegador)
Abra o arquivo `index-web.html` em um navegador moderno.

## Funcionalidades Principais

### 1. Criando Componentes
1. Arraste um componente da paleta para o designer
2. O componente será criado e automaticamente selecionado
3. Use o inspetor de propriedades para personalizar

### 2. Configurando Eventos
1. Selecione um componente
2. Clique em "Editar Eventos" no inspetor
3. Escolha um evento da lista (ex: "Clicado")
4. Selecione um elemento alvo ou ação global
5. Configure a ação desejada
6. Adicione quantos eventos quiser

### 3. Salvando e Exportando
- **Salvar**: Salva o projeto em formato .kreator para edição posterior
- **Executar**: Abre preview da aplicação em nova janela
- **Exportar**: Gera arquivos HTML/JS para deploy

## Exemplos de Eventos

### Botão que altera texto de um rótulo
1. Evento: "Clicado"
2. Alvo: label_1
3. Ação: "Alterar texto"
4. Valor: "Texto alterado!"

### Campo que mostra/oculta elemento
1. Evento: "Texto alterado"
2. Alvo: div_1
3. Ação: "Mostrar/Ocultar"
4. Valor: "toggle"

### Ação global (alerta)
1. Evento: "Clicado"
2. Alvo: "Ação Global"
3. Ação: "Mostrar alerta"
4. Valor: "Olá mundo!"

## Templates Disponíveis

### 1. Projeto em Branco
Projeto vazio para começar do zero.

### 2. Formulário de Contato
Template com:
- Campos Nome, Email, Mensagem
- Botão de envio
- Layout pré-configurado

### 3. Dashboard Simples
Template com:
- Cabeçalho
- Cards de métricas (Vendas, Pedidos, Clientes)
- Layout responsivo

## Tecnologias Utilizadas

- **Electron**: Para aplicação desktop
- **HTML5/CSS3**: Interface do usuário
- **JavaScript**: Lógica da aplicação
- **JSON**: Formato de salvamento de projetos

## Limitações da Versão Web

A versão web (`index-web.html`) tem algumas limitações em relação à versão Electron:
- Sistema de eventos simplificado (apenas alerta)
- Salvamento via download do navegador
- Sem acesso direto ao sistema de arquivos

## Próximas Funcionalidades

- [ ] Editor de eventos visual completo na versão web
- [ ] Mais componentes (checkbox, radio, select)
- [ ] Temas personalizáveis
- [ ] Componentes customizados
- [ ] Integração com APIs
- [ ] Deploy automático

## Suporte

Para dúvidas ou problemas, consulte o console da aplicação que mostra logs detalhados de todas as operações.

---

**KreatorJS v1.0.0** - IDE Visual para JavaScript
Desenvolvido com ❤️ para facilitar o desenvolvimento de interfaces web.

