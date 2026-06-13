const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

// Google OAuth configuration (will be set from the app)
let googleOAuthClient = null;
let cachedTokens = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      sandbox: false
    },
    titleBarStyle: 'default',
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  setupIpcHandlers();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

/**
 * Setup IPC handlers for Google Drive integration
 */
function setupIpcHandlers() {
  // Google Sign-In via OAuth
  ipcMain.handle('google-signin', async () => {
    try {
      // Check if we have stored tokens
      const storedTokens = loadStoredTokens();
      if (storedTokens && storedTokens.expiry_date > Date.now()) {
        // Token still valid
        const userInfo = await fetchGoogleUserInfo(storedTokens.access_token);
        return {
          success: true,
          name: userInfo.name,
          email: userInfo.email,
          avatar: userInfo.picture,
          accessToken: storedTokens.access_token
        };
      }

      // Need to authenticate - open OAuth URL in external browser
      // This is a simplified flow - in production, use electron-google-oauth2
      const clientId = getGoogleClientId();
      if (!clientId) {
        // Demo mode fallback
        return {
          success: true,
          name: 'كمال المحلاوي (جوجل ديمو)',
          email: 'kamal.mahlawi.demo@gmail.com',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          accessToken: 'demo_token_' + Date.now()
        };
      }

      // For production, use electron-google-oauth2 library
      // This is a placeholder that shows the architecture
      const { OAuth2Client } = require('google-auth-library');
      googleOAuthClient = new OAuth2Client(
        clientId,
        '', // client secret not needed for installed apps with PKCE
        'urn:ietf:wg:oauth:2.0:oob:auto'
      );

      const authorizeUrl = googleOAuthClient.generateAuthUrl({
        access_type: 'offline',
        scope: [
          'https://www.googleapis.com/auth/drive.file',
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/userinfo.email'
        ],
        prompt: 'select_account'
      });

      // Open in external browser
      shell.openExternal(authorizeUrl);

      // For now, return demo mode
      return {
        success: true,
        name: 'كمال المحلاوي (جوجل ديمو)',
        email: 'kamal.mahlawi.demo@gmail.com',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        accessToken: 'demo_token_' + Date.now()
      };
    } catch (error) {
      console.error('Google sign-in error:', error);
      return { success: false, error: error.message };
    }
  });

  // Upload to Google Drive
  ipcMain.handle('upload-to-drive', async (event, { fileName, content }) => {
    try {
      const tokens = loadStoredTokens();
      const accessToken = tokens?.access_token;

      if (!accessToken) {
        // Demo mode: save locally
        const backupDir = path.join(app.getPath('documents'), 'MyLab_Backups');
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }
        const backupPath = path.join(backupDir, fileName);
        fs.writeFileSync(backupPath, content, 'utf8');
        return {
          success: true,
          fileId: 'local_' + Date.now(),
          message: 'Backup saved locally (demo mode)'
        };
      }

      // Real upload to Google Drive using fetch
      const { google } = require('googleapis');
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      const drive = google.drive({ version: 'v3', auth });

      const fileMetadata = {
        name: fileName,
        mimeType: 'application/json',
        parents: [] // Will use root
      };

      const media = {
        mimeType: 'application/json',
        body: content
      };

      const response = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, name, createdTime'
      });

      return {
        success: true,
        fileId: response.data.id,
        message: 'Upload successful'
      };
    } catch (error) {
      console.error('Upload error:', error);
      // Fallback: save locally
      try {
        const backupDir = path.join(app.getPath('documents'), 'MyLab_Backups');
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }
        const backupPath = path.join(backupDir, fileName);
        fs.writeFileSync(backupPath, content, 'utf8');
        return {
          success: true,
          fileId: 'local_fallback_' + Date.now(),
          message: 'Saved locally due to upload error'
        };
      } catch {
        return { success: false, error: error.message };
      }
    }
  });

  // Download from Google Drive
  ipcMain.handle('download-from-drive', async (event, fileId) => {
    try {
      const tokens = loadStoredTokens();
      if (!tokens?.access_token) {
        return null;
      }

      const { google } = require('googleapis');
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: tokens.access_token });

      const drive = google.drive({ version: 'v3', auth });

      let targetFileId = fileId;

      // If no fileId, search for latest
      if (!targetFileId) {
        const res = await drive.files.list({
          q: "name contains 'MyLab_Backup' and mimeType='application/json'",
          orderBy: 'createdTime desc',
          pageSize: 1,
          fields: 'files(id, name)'
        });
        if (res.data.files && res.data.files.length > 0) {
          targetFileId = res.data.files[0].id;
        }
      }

      if (!targetFileId) return null;

      const response = await drive.files.get(
        { fileId: targetFileId, alt: 'media' },
        { responseType: 'json' }
      );

      return response.data;
    } catch (error) {
      console.error('Download error:', error);
      return null;
    }
  });

  // List backups from Google Drive
  ipcMain.handle('list-drive-backups', async () => {
    try {
      const tokens = loadStoredTokens();
      if (!tokens?.access_token) {
        // Fallback: list local backups
        const backupDir = path.join(app.getPath('documents'), 'MyLab_Backups');
        if (!fs.existsSync(backupDir)) return [];
        const files = fs.readdirSync(backupDir)
          .filter(f => f.startsWith('MyLab_Backup'))
          .map(f => ({
            id: 'local_' + f,
            name: f,
            createdTime: fs.statSync(path.join(backupDir, f)).mtime.toISOString(),
            size: fs.statSync(path.join(backupDir, f)).size.toString()
          }));
        return files;
      }

      const { google } = require('googleapis');
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: tokens.access_token });

      const drive = google.drive({ version: 'v3', auth });

      const res = await drive.files.list({
        q: "name contains 'MyLab_Backup' and mimeType='application/json'",
        orderBy: 'createdTime desc',
        fields: 'files(id, name, createdTime, size)'
      });

      return (res.data.files || []).map(f => ({
        id: f.id,
        name: f.name,
        createdTime: f.createdTime,
        size: f.size || 'unknown'
      }));
    } catch {
      // Fallback: list local backups
      try {
        const backupDir = path.join(app.getPath('documents'), 'MyLab_Backups');
        if (!fs.existsSync(backupDir)) return [];
        return fs.readdirSync(backupDir)
          .filter(f => f.startsWith('MyLab_Backup'))
          .map(f => ({
            id: 'local_' + f,
            name: f,
            createdTime: fs.statSync(path.join(backupDir, f)).mtime.toISOString(),
            size: fs.statSync(path.join(backupDir, f)).size.toString()
          }));
      } catch {
        return [];
      }
    }
  });

  // Handle OAuth callback
  ipcMain.handle('oauth-callback', async (event, code) => {
    try {
      if (googleOAuthClient && code) {
        const { tokens } = await googleOAuthClient.getToken(code);
        cachedTokens = tokens;
        storeTokens(tokens);
        return { success: true, tokens };
      }
      return { success: false };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Get platform info
  ipcMain.handle('get-platform', () => {
    return {
      platform: process.platform,
      version: app.getVersion(),
      isPackaged: app.isPackaged
    };
  });

  // Open external link
  ipcMain.handle('open-external', async (event, url) => {
    await shell.openExternal(url);
  });
}

// Token storage helpers
function getTokenPath() {
  return path.join(app.getPath('userData'), 'google-tokens.json');
}

function storeTokens(tokens) {
  try {
    fs.writeFileSync(getTokenPath(), JSON.stringify(tokens, null, 2));
  } catch (e) {
    console.error('Failed to store tokens:', e);
  }
}

function loadStoredTokens() {
  try {
    const tokenPath = getTokenPath();
    if (fs.existsSync(tokenPath)) {
      return JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
    }
  } catch (e) {
    console.error('Failed to load tokens:', e);
  }
  return null;
}

function getGoogleClientId() {
  // Try to load from config file
  try {
    const configPath = path.join(app.getPath('userData'), 'google-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return config.clientId;
    }
  } catch { /* ignore */ }

  // Fallback to environment
  return process.env.GOOGLE_CLIENT_ID || null;
}

async function fetchGoogleUserInfo(accessToken) {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    return await res.json();
  } catch (e) {
    return { name: 'User', email: '', picture: '' };
  }
}
