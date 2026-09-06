import { app, BrowserWindow, Tray, Menu, nativeImage, screen, ipcMain, desktopCapturer, globalShortcut } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let tray: Tray | null = null;
let companionWindow: BrowserWindow | null = null;
let overlayWindows: Map<number, BrowserWindow> = new Map();
let isListening = false;

function createOverlayWindows() {
  const displays = screen.getAllDisplays();
  for (const display of displays) {
    if (overlayWindows.has(display.id)) continue;

    const preloadPath = path.join(__dirname, 'index.cjs');
    const overlay = new BrowserWindow({
      x: display.bounds.x,
      y: display.bounds.y,
      width: display.bounds.width,
      height: display.bounds.height,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      hasShadow: false,
      resizable: false,
      focusable: false,
      webPreferences: {
        preload: preloadPath,
        sandbox: false,
      }
    });

    overlay.setIgnoreMouseEvents(true, { forward: true });
    overlay.setAlwaysOnTop(true, 'screen-saver');
    overlay.setVisibleOnAllWorkspaces(true);

    if (process.env.VITE_DEV_SERVER_URL) {
      overlay.loadURL(`${process.env.VITE_DEV_SERVER_URL}overlay.html?displayId=${display.id}`);
    } else {
      overlay.loadFile(path.join(__dirname, '../dist/overlay.html'), { query: { displayId: String(display.id) } });
    }

    overlayWindows.set(display.id, overlay);
  }
}

function createCompanionWindow() {
  companionWindow = new BrowserWindow({
    width: 420,
    height: 580,
    show: true,
    frame: true,
    resizable: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, 'index.cjs'),
      sandbox: false,
    }
  });

  companionWindow.center();

  if (process.env.VITE_DEV_SERVER_URL) {
    companionWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}index.html`);
  } else {
    companionWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

function setupTray() {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip('Clicky Windows');

  tray.on('click', () => {
    if (!companionWindow) return;
    if (companionWindow.isVisible()) {
      companionWindow.hide();
    } else {
      const cursor = screen.getCursorScreenPoint();
      const primaryDisplay = screen.getDisplayNearestPoint(cursor);
      const { width, height } = companionWindow.getBounds();
      
      const x = Math.min(Math.max(cursor.x - width / 2, primaryDisplay.workArea.x), primaryDisplay.workArea.x + primaryDisplay.workArea.width - width);
      const y = primaryDisplay.workArea.y + primaryDisplay.workArea.height - height - 10;

      companionWindow.setPosition(Math.round(x), Math.round(y));
      companionWindow.show();
      companionWindow.focus();
    }
  });

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open Companion Panel', click: () => companionWindow?.show() },
    { type: 'separator' },
    { label: 'Quit Clicky', click: () => app.quit() }
  ]);
  tray.setContextMenu(contextMenu);
}

function setupShortcuts() {
  // Push-to-talk default shortcut: CommandOrControl+Alt+Space or custom
  globalShortcut.register('CommandOrControl+Alt+Space', () => {
    // Toggle or push-to-talk event
    isListening = !isListening;
    companionWindow?.webContents.send('ptt-status', { isListening });
    for (const win of overlayWindows.values()) {
      win.webContents.send('ptt-status', { isListening });
    }
  });
}

ipcMain.handle('capture-screen', async () => {
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: 1920, height: 1080 }
  });
  return sources.map(s => ({
    id: s.id,
    name: s.name,
    dataUrl: s.thumbnail.toDataURL()
  }));
});

ipcMain.on('point-element', (_event, pointData: { x: number; y: number; label: string; screenIndex?: number }) => {
  for (const win of overlayWindows.values()) {
    win.webContents.send('draw-point', pointData);
  }
});

app.whenReady().then(() => {
  createCompanionWindow();
  createOverlayWindows();
  setupTray();
  setupShortcuts();

  screen.on('display-added', () => createOverlayWindows());
  screen.on('display-removed', (_e, display) => {
    const win = overlayWindows.get(display.id);
    if (win) {
      win.close();
      overlayWindows.delete(display.id);
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
