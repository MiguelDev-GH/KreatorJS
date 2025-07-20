# Instruções de Empacotamento - KreatorJS

## Pré-requisitos

- Node.js instalado
- NPM ou Yarn
- Dependências do projeto instaladas (`npm install`)

## Comandos de Empacotamento

### Desenvolvimento (Pasta sem instalador)
```bash
npm run pack
```
Gera uma pasta `dist/linux-unpacked/` com a aplicação pronta para execução.

### Produção - Linux
```bash
npm run build-linux
```
Gera um arquivo AppImage para distribuição no Linux.

### Produção - Windows
```bash
npm run build-win
```
Gera um instalador NSIS (.exe) para Windows.

### Produção - macOS
```bash
npm run build-mac
```
Gera um arquivo DMG para macOS.

### Todas as Plataformas
```bash
npm run build
```
Gera instaladores para todas as plataformas suportadas.

## Estrutura dos Arquivos Gerados

```
dist/
├── linux-unpacked/          # Aplicação Linux (desenvolvimento)
│   ├── kreatorjs            # Executável principal
│   ├── resources/
│   │   └── app.asar         # Código da aplicação empacotado
│   └── ...                  # Bibliotecas do Electron
├── KreatorJS-1.0.0.AppImage # Instalador Linux
├── KreatorJS Setup 1.0.0.exe # Instalador Windows
└── KreatorJS-1.0.0.dmg      # Instalador macOS
```

## Executando a Aplicação Empacotada

### Linux
```bash
# Desenvolvimento
./dist/linux-unpacked/kreatorjs

# Produção
chmod +x KreatorJS-1.0.0.AppImage
./KreatorJS-1.0.0.AppImage
```

### Windows
```bash
# Execute o instalador
KreatorJS Setup 1.0.0.exe
```

### macOS
```bash
# Monte o DMG e arraste para Applications
open KreatorJS-1.0.0.dmg
```

## Configurações de Build

As configurações de empacotamento estão definidas no `package.json` na seção `build`:

- **appId**: Identificador único da aplicação
- **productName**: Nome do produto
- **directories**: Diretórios de saída
- **files**: Arquivos incluídos no empacotamento
- **win/mac/linux**: Configurações específicas por plataforma

## Assinatura de Código

Para distribuição comercial, é recomendado assinar os executáveis:

### Windows
- Obtenha um certificado de assinatura de código
- Configure as variáveis de ambiente `CSC_LINK` e `CSC_KEY_PASSWORD`

### macOS
- Configure o Apple Developer ID
- Use `electron-builder` com certificados válidos

## Troubleshooting

### Erro de Display (Linux)
Se encontrar erro de X11/Display ao empacotar:
```bash
export DISPLAY=:99
Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 &
```

### Dependências Nativas
Se houver problemas com dependências nativas:
```bash
npm run rebuild
```

### Tamanho do Arquivo
Para reduzir o tamanho:
- Use `asar` para empacotar arquivos
- Exclua arquivos desnecessários na configuração `files`
- Use `electron-builder` com compressão

## Scripts Auxiliares

### package-windows.sh
Script para empacotamento automatizado no Windows:
```bash
./package-windows.sh
```

### Verificação de Integridade
```bash
# Verificar se todos os arquivos estão incluídos
npm run pack
ls -la dist/linux-unpacked/resources/
```

## Distribuição

### GitHub Releases
Use `electron-builder` com `--publish=always` para publicar automaticamente.

### Atualizações Automáticas
Configure `electron-updater` para atualizações automáticas da aplicação.

### Loja de Aplicativos
- **Windows**: Microsoft Store
- **macOS**: Mac App Store
- **Linux**: Snap Store, Flathub

