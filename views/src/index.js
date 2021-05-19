const { app, BrowserWindow, BrowserView, screen, ipcMain, webContents} = require('electron');
const path = require('path');
const electron = require('electron');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createWindow = async () => {
  const space = 25;
  const screenDimensions = electron.screen.getPrimaryDisplay();
  /* Main Window */
  const mainWindow = new BrowserWindow({
    width: screenDimensions.size.width,
    height: screenDimensions.size.height,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    }
  });
  
  const mobile_view = new BrowserView({
    webPreferences: {
      nodeIntegration: false,
      sandbox: true
    },
  })

  const main_view = new BrowserView({
    webPreferences: {
      nodeIntegration: false,
      sandbox: true
    }
  })

  mainWindow.removeMenu();
  mainWindow.setMenu(null);
  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.setIcon(path.join(__dirname, 'favicon.png'));
  // Open the DevTools.
  // mainWindow.webContents.openDevTools({detached: true});
  mainWindow.setFullScreen(false);
  mainWindow.maximize();

  /* Mobile View */
  mainWindow.addBrowserView(mobile_view)
  mobile_view.setBounds({
    x: 0,
    y: space,
    width: Number.parseInt(mainWindow.getBounds().width / 4),
    height: mainWindow.getBounds().height - 40 - space
  })
  await mobile_view.webContents.loadURL('https://google.com')
  mobile_view.setAutoResize({width: true});
  /* Handle mobile view forward backward */
  mainWindow.webContents.send("mobileId", mobile_view.webContents.id);
  mobile_view.webContents.on("did-navigate", () => {
    mainWindow.webContents.send("mobile_canNav", mobile_view.webContents.canGoBack(), mobile_view.webContents.canGoForward());
  });
  ipcMain.on("mobile_goBack", (e, webContentsId) => {
    const wc = webContents.fromId(mobile_view.webContents.id);
    if (wc && wc.canGoBack()) {
      wc.goBack();
    }
  });

  ipcMain.on("mobile_goForward", (e, webContentsId) => {
    const wc = webContents.fromId(mobile_view.webContents.id);
    if (wc && wc.canGoForward()) {
      wc.goForward();
  }})
  
  /* Main View */
  mainWindow.addBrowserView(main_view)
  main_view.setBounds({
    x: Number.parseInt(mainWindow.getBounds().width / 4),
    y: space,
    width: Number.parseInt(mainWindow.getBounds().width - mainWindow.getBounds().width / 4),
    height: mainWindow.getBounds().height - 40 - space
  })
  await main_view.webContents.loadURL('https://google.com')
  main_view.setAutoResize({width: true});
  /* Handle main view forward backward */
  mainWindow.webContents.send("mainId", main_view.webContents.id);
  main_view.webContents.on("did-navigate", () => {
    mainWindow.webContents.send("main_canNav", main_view.webContents.canGoBack(), main_view.webContents.canGoForward());
  });

  ipcMain.on("main_goBack", (e, webContentsId) => {
    const wc = webContents.fromId(main_view.webContents.id);
    if (wc && wc.canGoBack()) {
      wc.goBack();
    }
  });

  ipcMain.on("main_goForward", (e, webContentsId) => {
    const wc = webContents.fromId(main_view.webContents.id);
    if (wc && wc.canGoForward()) {
      wc.goForward();
    }
  })
  
  /* Resize bounds */
  mainWindow.on('will-resize', (_event, newBounds) => {    
    newBounds = screen.screenToDipRect(mainWindow, newBounds);
    mobile_view.setBounds({
      x: 0,
      y: space,
      width: Number.parseInt(newBounds.width / 4),
      height: newBounds.height - 40 - space
    })

    main_view.setBounds({
      x: Number.parseInt(newBounds.width / 4),
      y: space,
      width: Number.parseInt(newBounds.width - newBounds.width / 4),
      height: newBounds.height - 40 - space
    })
  })
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {

    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
