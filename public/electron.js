(async () => {
  const electron = await import('electron');
  const path = await import('path');
  const isDev = (await import('electron-is-dev')).default;
  const fs = await import('fs');

  const { app, BrowserWindow, ipcMain } = electron;
  const DATA_FILE = path.join(app.getPath('userData'), 'requests.json');
  let autoUpdater;
  try {
    autoUpdater = (await import('electron-updater')).autoUpdater;
  } catch (e) {
    console.warn('electron-updater не встановлено');
  }

  function createWindow() {
    const mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      }
    });

    mainWindow.loadURL(
      isDev
        ? 'http://localhost:3000'
        : `file://${path.join(__dirname, '../build/index.html')}`
    );

    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  }

  // Функції для роботи з даними
  function loadRequests() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
    }
    return [];
  }

  function saveRequests(requests) {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(requests, null, 2));
    } catch (error) {
      console.error('Error saving requests:', error);
    }
  }

  // Обробники IPC
  ipcMain.handle('get-requests', () => {
    return loadRequests();
  });

  ipcMain.handle('save-requests', (event, requests) => {
    saveRequests(requests);
  });

  ipcMain.handle('add-request', (event, request) => {
    const requests = loadRequests();
    const newRequest = {
      ...request,
      id: Date.now().toString(),
      createdAt: new Date().toLocaleDateString()
    };
    requests.push(newRequest);
    saveRequests(requests);
    return newRequest;
  });

  ipcMain.handle('update-request', (event, id, updates) => {
    const requests = loadRequests();
    const index = requests.findIndex(r => r.id === id);
    if (index !== -1) {
      let archived = requests[index].archived || false;
      if (updates.status === 'completed') {
        archived = true;
      } else if (updates.status) {
        archived = false;
      }
      requests[index] = { ...requests[index], ...updates, archived };
      saveRequests(requests);
      return requests[index];
    }
    return null;
  });

  ipcMain.handle('remove-request', (event, id) => {
    const requests = loadRequests();
    const updated = requests.filter(r => r.id !== id);
    saveRequests(updated);
    return true;
  });

  app.whenReady().then(() => {
    createWindow();
    if (autoUpdater && !isDev) {
      autoUpdater.checkForUpdatesAndNotify();
    }
  });

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
})(); 