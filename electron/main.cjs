const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "My Lab LIMS",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  // Load the compiled index.html
  win.loadFile(path.join(__dirname, '../dist/index.html'));
  
  // Remove default window menu to look like an app
  win.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
