# Tutorial - KreatorJS

Guia passo a passo para usar o KreatorJS e criar sua primeira aplicação desktop.

## Índice

1. [Primeiros Passos](#primeiros-passos)
2. [Interface da IDE](#interface-da-ide)
3. [Criando sua Primeira Aplicação](#criando-sua-primeira-aplicação)
4. [Trabalhando com Componentes](#trabalhando-com-componentes)
5. [Editando Propriedades](#editando-propriedades)
6. [Adicionando Eventos](#adicionando-eventos)
7. [Gerando Código](#gerando-código)
8. [Empacotando a Aplicação](#empacotando-a-aplicação)
9. [Dicas e Truques](#dicas-e-truques)

## Primeiros Passos

### Instalação e Execução

1. **Instalar Dependências**
   ```bash
   npm install
   ```

2. **Executar em Modo Desenvolvimento**
   ```bash
   npm start
   ```

3. **A IDE será aberta automaticamente**

## Interface da IDE

### Layout Principal

A interface do KreatorJS é dividida em 5 áreas principais:

1. **Barra de Ferramentas** (topo)
   - Novo, Abrir, Salvar
   - Executar, Empacotar

2. **Paleta de Componentes** (esquerda)
   - Lista de componentes disponíveis
   - Arraste para o designer

3. **Designer Visual** (centro)
   - Área de trabalho principal
   - Grade opcional
   - Posicionamento livre

4. **Inspetor de Objetos** (direita)
   - Propriedades do componente selecionado
   - Edição em tempo real

5. **Console** (inferior)
   - Mensagens do sistema
   - Feedback de operações

### Atalhos de Teclado

- `Ctrl+N`: Novo projeto
- `Ctrl+O`: Abrir projeto
- `Ctrl+S`: Salvar projeto
- `Ctrl+Z`: Desfazer
- `Ctrl+Y`: Refazer
- `Delete`: Remover componente selecionado
- `F5`: Executar aplicação

## Criando sua Primeira Aplicação

### Exemplo: Calculadora Simples

Vamos criar uma calculadora básica para demonstrar o uso do KreatorJS.

#### Passo 1: Preparar o Designer

1. Clique em **Novo** na barra de ferramentas
2. A área do designer estará limpa e pronta

#### Passo 2: Adicionar Componentes

1. **Display da Calculadora**
   - Arraste um **Campo de Texto** da paleta
   - Posicione no topo do designer

2. **Botões Numéricos**
   - Arraste vários **Botões** da paleta
   - Organize em grade 3x3 para números 1-9
   - Adicione botão para 0

3. **Botões de Operação**
   - Adicione botões para +, -, *, /
   - Adicione botão de igual (=)
   - Adicione botão de limpar (C)

#### Passo 3: Organizar Layout

1. Selecione cada componente clicando nele
2. Use o mouse para arrastar e posicionar
3. Use as alças de redimensionamento para ajustar tamanho

## Trabalhando com Componentes

### Tipos de Componentes Disponíveis

1. **Botão** 🔘
   - Elemento clicável
   - Ideal para ações

2. **Campo de Texto** 📝
   - Entrada de dados
   - Suporte a placeholder

3. **Rótulo** 🏷️
   - Texto estático
   - Títulos e descrições

4. **Painel** 📦
   - Container genérico
   - Agrupamento visual

5. **Imagem** 🖼️
   - Exibição de imagens
   - Suporte a URL

6. **Área de Texto** 📄
   - Texto multilinha
   - Redimensionável

7. **Lista Suspensa** 📋
   - Seleção de opções
   - Dropdown menu

8. **Caixa de Seleção** ☑️
   - Opções múltiplas
   - Checkbox

### Operações com Componentes

#### Adicionar Componente
1. Arraste da paleta para o designer
2. Solte na posição desejada

#### Selecionar Componente
1. Clique no componente no designer
2. Borda azul indica seleção

#### Mover Componente
1. Selecione o componente
2. Arraste para nova posição

#### Redimensionar Componente
1. Selecione o componente
2. Arraste a alça no canto inferior direito

#### Remover Componente
1. Selecione o componente
2. Pressione `Delete`

## Editando Propriedades

### Inspetor de Objetos

Quando um componente está selecionado, o Inspetor de Objetos mostra:

#### Seção Geral
- **ID**: Identificador único
- **Tipo**: Tipo do componente

#### Seção Posição
- **X**: Posição horizontal
- **Y**: Posição vertical

#### Seção Propriedades
- **Texto**: Conteúdo textual
- **Largura**: Largura do componente
- **Altura**: Altura do componente
- **Cor de Fundo**: Background color
- **Cor do Texto**: Text color
- **Borda**: Border style
- **Fonte**: Font properties

### Exemplo: Personalizando um Botão

1. **Selecione um botão**
2. **No Inspetor de Objetos:**
   - Texto: "Clique Aqui"
   - Largura: "120px"
   - Altura: "40px"
   - Cor de Fundo: "#007acc"
   - Cor do Texto: "#ffffff"
   - Borda Radius: "8px"

3. **Veja as mudanças em tempo real**

## Adicionando Eventos

### Criando Eventos JavaScript

1. **Duplo clique** em um componente
2. **Modal de código** será aberto
3. **Função de evento** será gerada automaticamente

### Exemplo: Evento de Botão

```javascript
// Evento onClick para button_1
function button_1_onClick(event) {
    // Adicione sua lógica aqui
    console.log('onClick disparado para button_1');
    
    // Exemplo: obter o elemento
    const element = event.target;
    
    // Exemplo: alterar propriedades
    element.style.backgroundColor = 'red';
    
    // Seu código personalizado aqui...
}
```

### Tipos de Eventos por Componente

- **Botão**: onClick
- **Campo de Texto**: onChange
- **Lista Suspensa**: onChange
- **Caixa de Seleção**: onChange

## Gerando Código

### Exportar HTML

1. **Menu Arquivo** → **Exportar HTML**
2. **Código HTML** será gerado
3. **Copiar ou Salvar** o código

### Exportar JavaScript

1. **Menu Arquivo** → **Exportar JavaScript**
2. **Código JS** com eventos será gerado
3. **Copiar ou Salvar** o código

### Exemplo de Código Gerado

#### HTML
```html
<div style="position: relative; width: 100%; height: 100vh;">
  <button id="button_1" style="position: absolute; left: 50px; top: 50px; width: 100px; height: 30px;">Clique Aqui</button>
  <input type="text" id="input_1" style="position: absolute; left: 50px; top: 100px; width: 200px; height: 30px;" placeholder="Digite aqui...">
</div>
```

#### JavaScript
```javascript
// Código JavaScript gerado pelo KreatorJS

// Evento onClick para button_1
function button_1_onClick(event) {
    console.log('onClick disparado para button_1');
}

// Registrar eventos
document.addEventListener('DOMContentLoaded', function() {
    const button_1 = document.getElementById('button_1');
    if (button_1) {
        button_1.addEventListener('click', button_1_onClick);
    }
});
```

## Empacotando a Aplicação

### Gerar Executável

1. **Clique em Empacotar** na barra de ferramentas
2. **Ou use o menu** Arquivo → Empacotar Aplicação
3. **Ou execute via terminal:**
   ```bash
   npm run build-win    # Windows
   npm run build-mac    # macOS
   npm run build-linux  # Linux
   ```

### Arquivos Gerados

- **Windows**: `KreatorJS Setup 1.0.0.exe`
- **macOS**: `KreatorJS-1.0.0.dmg`
- **Linux**: `KreatorJS-1.0.0.AppImage`

### Distribuição

1. **Teste o executável** antes da distribuição
2. **Assine o código** para distribuição comercial
3. **Crie documentação** para usuários finais

## Dicas e Truques

### Produtividade

1. **Use atalhos de teclado** para operações frequentes
2. **Grade visual** ajuda no alinhamento (botão ⊞)
3. **Undo/Redo** permite experimentação sem medo
4. **Console** mostra feedback importante

### Boas Práticas

1. **IDs únicos**: Mantenha nomes descritivos
2. **Organização**: Agrupe componentes relacionados
3. **Teste frequente**: Use o botão Executar regularmente
4. **Backup**: Salve o projeto regularmente

### Solução de Problemas

#### Componente não responde
- Verifique se está selecionado
- Tente clicar novamente

#### Propriedades não aplicam
- Verifique valores válidos (ex: "100px" não "100")
- Use cores em formato hex (#ffffff)

#### Código não funciona
- Verifique sintaxe JavaScript
- Use console do navegador para debug

### Limitações Atuais

1. **Projetos**: Sistema básico de salvar/abrir
2. **CSS**: Sem suporte a folhas de estilo externas
3. **Componentes**: Biblioteca limitada
4. **Responsividade**: Posicionamento absoluto apenas

### Próximos Passos

1. **Explore todos os componentes** disponíveis
2. **Experimente diferentes layouts** e designs
3. **Teste eventos JavaScript** complexos
4. **Compartilhe suas criações** com a comunidade

## Suporte

Para dúvidas, problemas ou sugestões:

1. **Consulte a documentação** completa
2. **Verifique issues conhecidas** no repositório
3. **Abra uma issue** para bugs ou features
4. **Contribua** com melhorias no código

---

**Divirta-se criando aplicações incríveis com KreatorJS!** 🚀

