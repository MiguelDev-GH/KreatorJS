# KreatorJS - IDE Visual para JavaScript

### ⚠ AVISO: 
O programa ainda contém alguns bugs e algumas funcionalidades não estão disponíveis ainda, mas com o tempo, tudo será consertado. Apenas para avisar que a aplicação não está completa e está em fase de teste. Aceito comentários e críticas sobre o projeto.

## Visão Geral

O KreatorJS é uma IDE visual completa para desenvolvimento de aplicações JavaScript. Permite criar interfaces de usuário através de drag-and-drop, configurar eventos de forma intuitiva e exportar projetos completos.

## Uso básico

- A ferramenta tem uma aba de **componentes** onde por lá, o usuário consegue mover para o designer visual, onde por lá você consegue posicioná-lo onde quiser, adiconar eventos, mudar o estilo e mais.

### Como criar a aplicação:

Abra um terminal na pasta do arquivo (Onde você pode localizar o index.html, renderer.js etc) e abra um terminal e coloque os seguintes comandos:

### Versão Electron (Desktop)
```bash
npm install
npm start
```

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

**KreatorJS v1.0.0** - IDE Visual para JavaScript
Desenvolvido com ❤️ para facilitar o desenvolvimento de interfaces web.

