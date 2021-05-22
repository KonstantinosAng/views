const { app, BrowserWindow, BrowserView, screen, ipcMain, webContents} = require('electron');
const path = require('path');
const electron = require('electron');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createWindow = async () => {
  const space = 60;
  const spaceBottom = -15;
  const spaceBottomResize = 0;
  const rightSize = 15;
  const screenDimensions = electron.screen.getPrimaryDisplay();
  var disableRightClick = false;
  /* Main Window */
  const mainWindow = new BrowserWindow({
    width: screenDimensions.size.width,
    height: screenDimensions.size.height,
    minWidth: Number.parseInt(2.015 * screenDimensions.bounds.width / 3),
    frame: false,
    icon: path.join(__dirname, 'img/logo.png'),
    titleBarStyle: 'hidden',
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

  const resizeWindow = (view, x, y, width, height) => {
    view.setBounds({
      x: x,
      y: y,
      width: width,
      height: height
    })
  }

  const sendInfo = (mobileWidth, mobileHeight, mainWidth, mainHeight) => {
    mainWindow.webContents.send('widthInfo', mobileWidth, mobileHeight, mainWidth, mainHeight);
  }
  mainWindow.removeMenu();
  mainWindow.setMenu(null);
  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.setIcon(path.join(__dirname, 'img/logo.png'));
  mainWindow.setOverlayIcon(path.join(__dirname, 'img/logo.png'), 'WebViews');
  mainWindow.setFullScreen(false);
  mainWindow.maximize();
  mainWindow.once('focus', ()=> mainWindow.flashFrame(false))
  mainWindow.flashFrame(true);
  mainWindow.webContents.setZoomLevel(0)
  mainWindow.webContents.openDevTools({mode: 'undocked'});

  /* Mobile View */
  mainWindow.addBrowserView(mobile_view)
  mobile_view.setBounds({
    x: 0,
    y: space,
    width: Number.parseInt(mainWindow.getBounds().width / 4),
    height: mainWindow.getBounds().height + spaceBottom - space
  })
  await mobile_view.webContents.loadURL('https://github.com')
  mobile_view.setAutoResize({width: true, height: true});
  mobile_view.webContents.setZoomLevel(0);
  /* Handle mobile view forward backward */
  mainWindow.webContents.send("mobileId", mobile_view.webContents.id);
  mobile_view.webContents.on("did-navigate", () => {
    mainWindow.webContents.send("mobile_canNav", mobile_view.webContents.canGoBack(), mobile_view.webContents.canGoForward(), mobile_view.webContents.getURL());
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
    width: Number.parseInt(mainWindow.getBounds().width - mainWindow.getBounds().width / 4 - rightSize),
    height: mainWindow.getBounds().height + spaceBottom - space
  })
  await main_view.webContents.loadURL('https://github.com')
  main_view.setAutoResize({width: true, height: true});
  
  /* Handle main view forward backward */
  mainWindow.webContents.send("mainId", main_view.webContents.id);
  main_view.webContents.on("did-navigate", () => {
    mainWindow.webContents.send("main_canNav", main_view.webContents.canGoBack(), main_view.webContents.canGoForward(), main_view.webContents.getURL());
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
  
  /* Update URL */
  ipcMain.on("getUrl", async (e, url) => {
    await mobile_view.webContents.loadURL(url).then().catch(error=>console.log(""))
    await main_view.webContents.loadURL(url).then().catch(error=>console.log(""))
  })
  
  /* Update Size info */
  sendInfo(Number.parseInt(mainWindow.getBounds().width / 4), mainWindow.getBounds().height + spaceBottom - space, Number.parseInt(mainWindow.getBounds().width - mainWindow.getBounds().width / 4 - rightSize), mainWindow.getBounds().height + spaceBottom - space)

  /* Resize bounds */
  mainWindow.on('will-resize', (_event, newBounds) => {
    newBounds = screen.screenToDipRect(mainWindow, newBounds);
    resizeWindow(mobile_view, 0, space, Number.parseInt(newBounds.width / 4), newBounds.height + spaceBottomResize - space);
    resizeWindow(main_view, Number.parseInt(newBounds.width / 4), space, Number.parseInt(newBounds.width - newBounds.width / 4), newBounds.height + spaceBottomResize - space);
    mainWindow.webContents.send("resize_maximize", Number.parseInt(newBounds.width / 4));
    sendInfo(Number.parseInt(newBounds.width / 4), newBounds.height + spaceBottomResize - space, Number.parseInt(newBounds.width - newBounds.width / 4), newBounds.height + spaceBottomResize - space)
  })

  mainWindow.on('enter-full-screen', () => {
    resizeWindow(mobile_view, 0, space, Number.parseInt(mainWindow.getBounds().width / 4), mainWindow.getBounds().height + spaceBottom - space);
    resizeWindow(main_view, Number.parseInt(mainWindow.getBounds().width / 4 - rightSize), space, Number.parseInt(mainWindow.getBounds().width - mainWindow.getBounds().width / 4), mainWindow.getBounds().height + spaceBottom - space);
    mainWindow.webContents.send("resize_maximize", Number.parseInt(mainWindow.getBounds().width / 4));
    sendInfo(Number.parseInt(mainWindow.getBounds().width / 4), mainWindow.getBounds().height + spaceBottomResize - space, Number.parseInt(mainWindow.getBounds().width - mainWindow.getBounds().width / 4), mainWindow.getBounds().height + spaceBottomResize - space)
  })

  mainWindow.on('leave-full-screen', () => {
    resizeWindow(mobile_view, 0, space, Number.parseInt(mainWindow.getBounds().width / 4), mainWindow.getBounds().height + spaceBottomResize - space);
    resizeWindow(main_view, Number.parseInt(mainWindow.getBounds().width / 4), space, Number.parseInt(mainWindow.getBounds().width - mainWindow.getBounds().width / 4), mainWindow.getBounds().height + spaceBottomResize - space);
    mainWindow.webContents.send("resize_maximize", Number.parseInt(mainWindow.getBounds().width / 4));
    sendInfo(Number.parseInt(mainWindow.getBounds().width / 4), mainWindow.getBounds().height + spaceBottomResize - space, Number.parseInt(mainWindow.getBounds().width - mainWindow.getBounds().width / 4), mainWindow.getBounds().height + spaceBottomResize - space)
  })

  mainWindow.on('maximize', () => {
    resizeWindow(mobile_view, 0, space, Number.parseInt(mainWindow.getBounds().width / 4), mainWindow.getBounds().height + spaceBottom - space);
    resizeWindow(main_view, Number.parseInt(mainWindow.getBounds().width / 4 - rightSize), space, Number.parseInt(mainWindow.getBounds().width - mainWindow.getBounds().width / 4), mainWindow.getBounds().height + spaceBottom - space);
    mainWindow.webContents.send("resize_maximize", Number.parseInt(mainWindow.getBounds().width / 4));
    sendInfo(Number.parseInt(mainWindow.getBounds().width / 4), mainWindow.getBounds().height + spaceBottom - space, Number.parseInt(mainWindow.getBounds().width - mainWindow.getBounds().width / 4), mainWindow.getBounds().height + spaceBottom - space);
  })

  mainWindow.on('unmaximize', () => {
    resizeWindow(mobile_view, 0, space, Number.parseInt(mainWindow.getBounds().width / 4), mainWindow.getBounds().height + spaceBottomResize - space);
    resizeWindow(main_view, Number.parseInt(mainWindow.getBounds().width / 4), space, Number.parseInt(mainWindow.getBounds().width - mainWindow.getBounds().width / 4), mainWindow.getBounds().height + spaceBottomResize - space);
    mainWindow.webContents.send("resize_maximize", Number.parseInt(mainWindow.getBounds().width / 4));
    sendInfo(Number.parseInt(mainWindow.getBounds().width / 4), mainWindow.getBounds().height + spaceBottomResize - space, Number.parseInt(mainWindow.getBounds().width - mainWindow.getBounds().width / 4), mainWindow.getBounds().height + spaceBottomResize - space)
  })

  ipcMain.on("resize_drag", (e, x) => {
    resizeWindow(mobile_view, 0, space, Number.parseInt(x), mainWindow.getBounds().height + spaceBottomResize - space);
    if (mainWindow.webContents.isMaximize) {
      resizeWindow(main_view, Number.parseInt(x), space, Number.parseInt(mainWindow.getBounds().width - x - rightSize), mainWindow.getBounds().height + spaceBottomResize - space);
      sendInfo(Number.parseInt(x), mainWindow.getBounds().height + spaceBottomResize - space, Number.parseInt(mainWindow.getBounds().width - x - rightSize), mainWindow.getBounds().height + spaceBottomResize - space)
    } else {
      resizeWindow(main_view, Number.parseInt(x), space, Number.parseInt(mainWindow.getBounds().width - x), mainWindow.getBounds().height + spaceBottomResize - space);
      sendInfo(Number.parseInt(x), mainWindow.getBounds().height + spaceBottomResize - space, Number.parseInt(mainWindow.getBounds().width - x), mainWindow.getBounds().height + spaceBottomResize - space)
    }
  })

  /* Dev Tools toggle */
  ipcMain.on("mainDevTools", (e) => {
    if (!main_view.webContents.isDevToolsOpened()) {
      main_view.webContents.openDevTools({mode:'undocked'});
    } else {
      main_view.webContents.closeDevTools();
    }
  })

  ipcMain.on("mobileDevTools", (e) => {
    if (!mobile_view.webContents.isDevToolsOpened()) {
      mobile_view.webContents.openDevTools({mode: 'undocked'});
    } else {
      mobile_view.webContents.closeDevTools();
    }
  })

  /* Ispect Elements */
  ipcMain.on('listenRightClick', (e, toggle) => {
    disableRightClick = toggle;
  })

  mobile_view.webContents.addListener('context-menu', (e, event) => {
    if (!disableRightClick) {
      if (!mobile_view.webContents.isDevToolsOpened()) {
        mobile_view.webContents.openDevTools({mode:'undocked'});
      }
      mobile_view.webContents.inspectElement(event.x, event.y);
    }
  })

  main_view.webContents.addListener('context-menu', (e, event) => {
    if (!disableRightClick) {
      if (!main_view.webContents.isDevToolsOpened()) {
        main_view.webContents.openDevTools({mode: 'undocked'});
      }
      main_view.webContents.inspectElement(event.x, event.y);
    }
  })

  /* Refresh */
  ipcMain.on('refresh', (e) => {
    main_view.webContents.reload();
    mobile_view.webContents.reload();
  })

  /* Zoom */
  ipcMain.on('zoom', (event, zoom) => {
    mobile_view.webContents.setZoomLevel(zoom);    
  })
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);
app.setUserTasks([{
  program: process.execPath,
  arguments: '--new-window',
  iconPath: process.execPath,
  iconIndex: 0,
  title: 'New WebView Window',
  description: 'Create a new WebView Window'
}])

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
