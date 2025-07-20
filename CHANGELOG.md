# Changelog - KreatorJS

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [1.0.0] - 2025-07-19

### Adicionado
- **IDE Visual Completa**: Interface drag-and-drop para criação de aplicações desktop
- **Paleta de Componentes**: 8 componentes HTML prontos para uso
  - Botão
  - Campo de Texto
  - Rótulo
  - Painel (Div)
  - Imagem
  - Área de Texto
  - Lista Suspensa
  - Caixa de Seleção
- **Designer Visual**: Área de trabalho com grade opcional e posicionamento livre
- **Inspetor de Objetos**: Editor de propriedades em tempo real
- **Geração de Código**: Exportação automática de HTML e JavaScript
- **Sistema de Eventos**: Criação automática de funções de evento
- **Empacotamento Electron**: Suporte para Windows, macOS e Linux
- **Interface Profissional**: Tema escuro inspirado no VS Code
- **Sistema Undo/Redo**: Histórico de ações com 50 níveis
- **Atalhos de Teclado**: Produtividade aprimorada
- **Console Integrado**: Feedback em tempo real
- **Menu Completo**: Operações de arquivo e projeto

### Funcionalidades Principais
- Drag-and-drop de componentes da paleta para o designer
- Seleção, movimentação e redimensionamento de componentes
- Edição de propriedades visuais (cor, tamanho, texto, etc.)
- Geração automática de código HTML estruturado
- Criação de eventos JavaScript para cada componente
- Preview em tempo real da aplicação
- Empacotamento para distribuição

### Tecnologias Utilizadas
- Electron 32.2.6
- HTML5 Drag and Drop API
- CSS3 com Grid e Flexbox
- JavaScript ES6+
- Electron Builder para empacotamento

### Arquitetura
- **Processo Principal** (`main.js`): Gerenciamento de janelas e menus
- **Processo Renderer** (`renderer.js`): Interface e lógica da IDE
- **IPC**: Comunicação entre processos para operações de arquivo
- **Modular**: Código organizado em funções especializadas

### Compatibilidade
- Windows 10/11
- macOS 10.14+
- Linux (Ubuntu 18.04+, Fedora 32+, Debian 10+)

### Limitações Conhecidas
- Sistema de projetos básico (salvar/abrir em desenvolvimento)
- Componentes limitados à biblioteca atual
- Sem suporte a CSS externo personalizado
- Sem sistema de plugins

### Próximas Versões
- [ ] Sistema completo de gerenciamento de projetos
- [ ] Mais componentes (tabelas, gráficos, formulários)
- [ ] Editor de CSS avançado
- [ ] Depurador integrado
- [ ] Sistema de templates
- [ ] Suporte a frameworks (React, Vue)
- [ ] Marketplace de componentes
- [ ] Colaboração em tempo real

## Instalação

### Desenvolvimento
```bash
git clone <repositorio>
cd KreatorJS
npm install
npm start
```

### Produção
```bash
npm run build        # Todas as plataformas
npm run build-win    # Windows
npm run build-mac    # macOS
npm run build-linux  # Linux
```

## Contribuições

Este projeto foi desenvolvido como uma demonstração de conceito de uma IDE visual para JavaScript. Contribuições são bem-vindas para expandir as funcionalidades e melhorar a experiência do usuário.

### Como Contribuir
1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.

## Contato

KreatorJS Team - Projeto desenvolvido como demonstração de capacidades de desenvolvimento de IDEs visuais.

Link do Projeto: [https://github.com/kreatorjs/kreatorjs](https://github.com/kreatorjs/kreatorjs)

