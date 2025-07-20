const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  // Criar a janela principal da IDE
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'assets/icon.png'), // Ícone da aplicação
    title: 'KreatorJS - Visual JavaScript IDE'
  });

  // Carregar o arquivo HTML principal
  mainWindow.loadFile('index.html');

  // Abrir DevTools em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Criar menu da aplicação
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'Arquivo',
      submenu: [
        {
          label: 'Novo Projeto',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-project');
          }
        },
        {
          label: 'Abrir Projeto',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ["openFile"],
              filters: [{ name: "KreatorJS Project", extensions: ["kjs"] }],
              title: "Abrir Projeto KreatorJS"
            });
            
            if (!result.canceled && result.filePaths.length > 0) {
              mainWindow.webContents.send("menu-open-project", result.filePaths[0]);
            }
          }
        },
        {
          label: 'Salvar',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu-save');
          }
        },
        { type: 'separator' },
        {
          label: 'Exportar HTML',
          click: () => {
            mainWindow.webContents.send('menu-export-html');
          }
        },
        {
          label: 'Exportar JavaScript',
          click: () => {
            mainWindow.webContents.send('menu-export-js');
          }
        },
        {
          label: 'Exportar Projeto Completo',
          click: () => {
            mainWindow.webContents.send('menu-export-complete');
          }
        },
        { type: 'separator' },
        {
          label: 'Empacotar Aplicação',
          click: () => {
            mainWindow.webContents.send('menu-package-app');
          }
        },
        { type: 'separator' },
        {
          label: 'Sair',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Editar',
      submenu: [
        {
          label: 'Desfazer',
          accelerator: 'CmdOrCtrl+Z',
          click: () => {
            mainWindow.webContents.send('menu-undo');
          }
        },
        {
          label: 'Refazer',
          accelerator: 'CmdOrCtrl+Y',
          click: () => {
            mainWindow.webContents.send('menu-redo');
          }
        },
        { type: 'separator' },
        {
          label: 'Copiar',
          accelerator: 'CmdOrCtrl+C',
          role: 'copy'
        },
        {
          label: 'Colar',
          accelerator: 'CmdOrCtrl+V',
          role: 'paste'
        },
        {
          label: 'Recortar',
          accelerator: 'CmdOrCtrl+X',
          role: 'cut'
        }
      ]
    },
    {
      label: 'Visualizar',
      submenu: [
        {
          label: 'Recarregar',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.reload();
          }
        },
        {
          label: 'Alternar DevTools',
          accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        },
        { type: 'separator' },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            mainWindow.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() + 1);
          }
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            mainWindow.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() - 1);
          }
        },
        {
          label: 'Zoom Reset',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            mainWindow.webContents.setZoomLevel(0);
          }
        }
      ]
    },
    {
      label: 'Ajuda',
      submenu: [
        {
          label: 'Sobre KreatorJS',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Sobre KreatorJS',
              message: 'KreatorJS v1.0.0',
              detail: 'IDE Visual para desenvolvimento de aplicações desktop em JavaScript.\n\nDesenvolvido com Electron, HTML5 e JavaScript.'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Manipuladores IPC para comunicação com o renderer
ipcMain.handle('save-file', async (event, filePath, content) => {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

// Eventos do aplicativo
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

