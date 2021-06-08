const { app, BrowserWindow, BrowserView, screen, ipcMain, webContents, shell } = require('electron');
const path = require('path');
const electron = require('electron');
const { default: installExtension, REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS, VUEJS_DEVTOOLS } = require('electron-devtools-installer');
const Menu = electron.Menu;
const MenuItem = electron.MenuItem;
const Notification = electron.Notification;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

let notSendNotification = true;

const createWindow = async (options) => {
  
  const space = 60;
  const spaceBottom = -15;
  const spaceBottomResize = 0;
  const rightSize = 15;
  var disableRightClick = false;
  const screenDimensions = electron.screen.getPrimaryDisplay();
  let _id;

  /* Create context menu */
  const template = []
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu)
  const ctxMenu = new Menu()
  ctxMenu.append(new MenuItem({label: 'Copy', role: 'copy'}))
  ctxMenu.append(new MenuItem({label: 'Paste', role: 'paste'}))
  ctxMenu.append(new MenuItem({label: 'Cut', role: 'cut'}))
  ctxMenu.append(new MenuItem({label: 'Undo', role: 'undo'}))
  ctxMenu.append(new MenuItem({label: 'Redo', role: 'redo'}))
  ctxMenu.append(new MenuItem({
    label: 'Reload',
    click: () => {
      main_view.webContents.reload();
      mobile_view.webContents.reload();
    }
  }))
  ctxMenu.append(new MenuItem({
    label: 'ResetZoom',
    click: (menuItem, browserWindow, event) => {
      main_view.webContents.setZoomLevel(0);
      mainWindow.webContents.send('update-zoom-slider', 0);
    }
  }))

  /* Main Window */
  let mainWindow;
  /* Resize if window i a new tab */
  if (options) {
    mainWindow = new BrowserWindow({
      webContents: options.webContents,
      width: Number.parseInt(2.015 * screenDimensions.bounds.width / 3),
      height: Number.parseInt(2 * screenDimensions.size.height / 3),
      minWidth: Number.parseInt(2.015 * screenDimensions.bounds.width / 3),
      frame: false,
      icon: path.join(__dirname, '/img/logo.png'),
      titleBarStyle: 'hidden',
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
        webSecurity: false
      }
    });
  } else {
     mainWindow = new BrowserWindow({
      width: screenDimensions.size.width,
      height: screenDimensions.size.height,
      minWidth: Number.parseInt(2.015 * screenDimensions.bounds.width / 3),
      frame: false,
      icon: path.join(__dirname, '/img/logo.png'),
      titleBarStyle: 'hidden',
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
        webSecurity: false
      }
    });
  }

  mainWindow.removeMenu();
  mainWindow.setMenu(null);
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.setIcon(path.join(__dirname, '/img/logo.png'));
  mainWindow.setOverlayIcon(path.join(__dirname, '/img/logo.png'), 'WebViews');
  mainWindow.setFullScreen(false);
  if (!options) {
    mainWindow.maximize();
  }
  mainWindow.once('focus', () => mainWindow.flashFrame(false))
  mainWindow.flashFrame(true);
  mainWindow.webContents.setZoomLevel(0)
  mainWindow.webContents.setVisualZoomLevelLimits(1, 5);
  // mainWindow.webContents.openDevTools({mode: 'undocked'});
  
  /* Create two views */
  
  /* Mobile View */
  const mobile_view = new BrowserView({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      webSecurity: false
    },
  })
  mainWindow.addBrowserView(mobile_view)

  mobile_view.setBounds({
    x: 0,
    y: space,
    width: Number.parseInt(mainWindow.getBounds().width / 4),
    height: mainWindow.getBounds().height + spaceBottom - space
  })

  await mobile_view.webContents.loadURL('https://github.com')
  mobile_view.setAutoResize({
    width: true,
    height: true
  });
  mobile_view.webContents.setZoomLevel(0);
  mobile_view.webContents.setVisualZoomLevelLimits(1, 5);
  
  /* Main View */
  const main_view = new BrowserView({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      webSecurity: false
    }
  })
  mainWindow.addBrowserView(main_view)

  main_view.setBounds({
    x: Number.parseInt(mainWindow.getBounds().width / 4),
    y: space,
    width: Number.parseInt(mainWindow.getBounds().width - mainWindow.getBounds().width / 4 - rightSize),
    height: mainWindow.getBounds().height + spaceBottom - space
  })

  await main_view.webContents.loadURL('https://github.com')
  main_view.setAutoResize({
    width: true,
    height: true
  });
  main_view.webContents.setZoomLevel(0);
  main_view.webContents.setVisualZoomLevelLimits(1, 5);

  /* Function to resize views */
  const resizeWindow = (view, x, y, width, height) => {
    view.setBounds({
      x: x,
      y: y,
      width: width,
      height: height
    })
  }

  /* Update slider position on un/maximize full-screen will-resize */
  const resizeMaximize = (width) => {
    mainWindow.webContents.send("resize_maximize", width);
  }

  /* Update dimensions info */
  const sendInfo = (mobileWidth, mobileHeight, mainWidth, mainHeight) => {
    mainWindow.webContents.send('widthInfo', mobileWidth, mobileHeight, mainWidth, mainHeight);
  }

  /* Update _id for different browsers, to differentiate communication */
  ipcMain.on('idInfo', (e, id) => {
    _id = id;
  })

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
  mainWindow.webContents.send('id', mainWindow.webContents.id)
  ipcMain.on("getUrl", async (e, url, id) => {
    if (id === mainWindow.webContents.id) {
      await mobile_view.webContents.loadURL(url).then().catch(error=>console.log(""));
      await main_view.webContents.loadURL(url).then().catch(error=>console.log(""));
      mainWindow.webContents.send('update-zoom-slider', main_view.webContents.getZoomLevel());
    }
  })
  
  /* Update Size info */
  sendInfo(Number.parseInt(mainWindow.getBounds().width / 4), mainWindow.getBounds().height + spaceBottom - space, Number.parseInt(mainWindow.getBounds().width - mainWindow.getBounds().width / 4 - rightSize), mainWindow.getBounds().height + spaceBottom - space)

  /* Resize bounds */
  mainWindow.on('will-resize', (_event, newBounds) => {
    newBounds = screen.screenToDipRect(mainWindow, newBounds);
    resizeWindow(mobile_view, 0, space, Number.parseInt(newBounds.width / 4), newBounds.height + spaceBottomResize - space);
    resizeWindow(main_view, Number.parseInt(newBounds.width / 4), space, Number.parseInt(newBounds.width - newBounds.width / 4), newBounds.height + spaceBottomResize - space);
    resizeMaximize(Number.parseInt(newBounds.width/4));
    sendInfo(Number.parseInt(newBounds.width / 4), newBounds.height + spaceBottomResize - space, Number.parseInt(newBounds.width - newBounds.width / 4), newBounds.height + spaceBottomResize - space)
  })

  mainWindow.on('enter-full-screen', () => {
    resizeWindow(mobile_view, 0, space, Number.parseInt(mainWindow.getBounds().width / 4), mainWindow.getBounds().height + spaceBottom - space);
    resizeWindow(main_view, Number.parseInt(mainWindow.getBounds().width / 4 - rightSize), space, Number.parseInt(mainWindow.getBounds().width - mainWindow.getBounds().width / 4), mainWindow.getBounds().height + spaceBottom - space);
    resizeMaximize(Number.parseInt(mainWindow.getBounds().width / 4))
    sendInfo(Number.parseInt(mainWindow.getBounds().width / 4), mainWindow.getBounds().height + spaceBottomResize - space, Number.parseInt(mainWindow.getBounds().width - mainWindow.getBounds().width / 4), mainWindow.getBounds().height + spaceBottomResize - space)
  })

  mainWindow.on('leave-full-screen', () => {
    resizeWindow(mobile_view, 0, space, Number.parseInt(mainWindow.getBounds().width / 4), mainWindow.getBounds().height + spaceBottomResize - space);
    resizeWindow(main_view, Number.parseInt(mainWindow.getBounds().width / 4), space, Number.parseInt(mainWindow.getBounds().width - mainWindow.getBounds().width / 4), mainWindow.getBounds().height + spaceBottomResize - space);
    resizeMaximize(Number.parseInt(mainWindow.getBounds().width / 4))
    sendInfo(Number.parseInt(mainWindow.getBounds().width / 4), mainWindow.getBounds().height + spaceBottomResize - space, Number.parseInt(mainWindow.getBounds().width - mainWindow.getBounds().width / 4), mainWindow.getBounds().height + spaceBottomResize - space)
  })

  mainWindow.on('maximize', () => {
    resizeWindow(mobile_view, 0, space, Number.parseInt(mainWindow.getBounds().width / 4), mainWindow.getBounds().height + spaceBottom - space);
    resizeWindow(main_view, Number.parseInt(mainWindow.getBounds().width / 4 - rightSize), space, Number.parseInt(mainWindow.getBounds().width - mainWindow.getBounds().width / 4), mainWindow.getBounds().height + spaceBottom - space);
    resizeMaximize(Number.parseInt(mainWindow.getBounds().width / 4))
    sendInfo(Number.parseInt(mainWindow.getBounds().width / 4), mainWindow.getBounds().height + spaceBottom - space, Number.parseInt(mainWindow.getBounds().width - mainWindow.getBounds().width / 4), mainWindow.getBounds().height + spaceBottom - space);
  })

  mainWindow.on('unmaximize', () => {
    resizeWindow(mobile_view, 0, space, Number.parseInt(mainWindow.getBounds().width / 4), mainWindow.getBounds().height + spaceBottomResize - space);
    resizeWindow(main_view, Number.parseInt(mainWindow.getBounds().width / 4), space, Number.parseInt(mainWindow.getBounds().width - mainWindow.getBounds().width / 4), mainWindow.getBounds().height + spaceBottomResize - space);
    resizeMaximize(Number.parseInt(mainWindow.getBounds().width / 4))
    sendInfo(Number.parseInt(mainWindow.getBounds().width / 4), mainWindow.getBounds().height + spaceBottomResize - space, Number.parseInt(mainWindow.getBounds().width - mainWindow.getBounds().width / 4), mainWindow.getBounds().height + spaceBottomResize - space)
  })

  ipcMain.on("resize_drag", (e, x, _id) => {
    if (mainWindow.webContents.id === _id) {
      resizeWindow(mobile_view, 0, space, Number.parseInt(x), mainWindow.getBounds().height + spaceBottomResize - space);
      if (mainWindow.webContents.isMaximize) {
        resizeWindow(main_view, Number.parseInt(x), space, Number.parseInt(mainWindow.getBounds().width - x - rightSize), mainWindow.getBounds().height + spaceBottomResize - space);
        sendInfo(Number.parseInt(x), mainWindow.getBounds().height + spaceBottomResize - space, Number.parseInt(mainWindow.getBounds().width - x - rightSize), mainWindow.getBounds().height + spaceBottomResize - space)
      } else {
        resizeWindow(main_view, Number.parseInt(x), space, Number.parseInt(mainWindow.getBounds().width - x), mainWindow.getBounds().height + spaceBottomResize - space);
        sendInfo(Number.parseInt(x), mainWindow.getBounds().height + spaceBottomResize - space, Number.parseInt(mainWindow.getBounds().width - x), mainWindow.getBounds().height + spaceBottomResize - space)
      }
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
  ipcMain.on('listenRightClick', (e, toggle, _id) => {
    if (mainWindow.webContents.id === _id) {
      disableRightClick = toggle;
    }
  })

  mobile_view.webContents.addListener('context-menu', (e, event) => {
    if (!disableRightClick) {
      if (!mobile_view.webContents.isDevToolsOpened()) {
        mobile_view.webContents.openDevTools({mode:'undocked'});
      }
      mobile_view.webContents.inspectElement(event.x, event.y);
    } else {
      ctxMenu.popup(mobile_view, event.x, event.y);
    }
  })

  main_view.webContents.addListener('context-menu', (e, event) => {
    if (!disableRightClick) {
      if (!main_view.webContents.isDevToolsOpened()) {
        main_view.webContents.openDevTools({mode: 'undocked'});
      }
      main_view.webContents.inspectElement(event.x, event.y);
    } else {
      ctxMenu.popup(main_view, event.x, event.y);
    }
  })

  /* Refresh */
  ipcMain.on('refresh', (e, _id) => {
    if (mainWindow.webContents.id === _id) {
      main_view.webContents.reload();
      mobile_view.webContents.reload();
      mobile_view.webContents.setZoomLevel(0);
      main_view.webContents.setZoomLevel(0);
      mainWindow.webContents.send('update-zoom-slider', main_view.webContents.getZoomLevel());
    }
  })

  /* Zoom */
  ipcMain.on('zoom', (event, zoom) => {
    mobile_view.webContents.setZoomLevel(zoom);
  })

  mobile_view.webContents.on('zoom-changed', (e, direction) => {
    const currentZoomLevel = mobile_view.webContents.getZoomLevel();
    if (direction === 'in') {
      mobile_view.webContents.setZoomLevel(currentZoomLevel + 0.01);
    }
    if (direction === 'out') {
      mobile_view.webContents.setZoomLevel(currentZoomLevel - 0.01);
    }
    mainWindow.webContents.send('update-zoom-slider', mobile_view.webContents.getZoomLevel());
  })

  main_view.webContents.on('zoom-changed', (e, direction) => {
    const currentZoomLevel = main_view.webContents.getZoomLevel();
    if (direction === 'in') {
      main_view.webContents.setZoomLevel(currentZoomLevel + 0.01);
    }
    if (direction === 'out') {
      main_view.webContents.setZoomLevel(currentZoomLevel - 0.01);
    }
    mainWindow.webContents.send('update-zoom-slider', main_view.webContents.getZoomLevel());
  })

  /* Return created window & views */
  return {
    window: mainWindow,
    mobileView: mobile_view,
    mainView: main_view
  }

};

app.on('ready', async () => {
  // await installExtension(REACT_DEVELOPER_TOOLS).then(name => console.log('added ' + name)).catch(error => console.error("[ERROR] " + error));
  // await installExtension(REDUX_DEVTOOLS).then(name=>console.log('added ' + name)).catch(error=>console.error("[ERROR] " + error));
  // await installExtension(VUEJS_DEVTOOLS).then(name => console.log('added ' + name)).catch(error=>console.error("[ERROR] " + error));
  
  mainInstance = await createWindow()

  /* Listen for new window and alert user */
  mainInstance.mainView.webContents.on('new-window', async (event, url, frameName, disposition, options, additionalFeatures, referrer, postBody) => {
    event.preventDefault();
    /* Create new window */
    const newInstance = await createWindow(options);
    
    newInstance.window.once('ready-to-show', () => newInstance.window.show())
    
    if (!options.webContents) {
      newInstance.mobileView.webContents.loadURL(url) // existing webContents will be navigated automatically
      newInstance.mainView.webContents.loadURL(url) // existing webContents will be navigated automatically
    }
    
    event.newGuest = newInstance.window

    if (frameName == '_blank') {
      showNotification()
    }
  })
  
  /* Listen for new window and alert user */
  mainInstance.mobileView.webContents.on('new-window', async (event, url, frameName, disposition, options, additionalFeatures, referrer, postBody) => {
  
    event.preventDefault();  
    /* Create new window */
    const newInstance = await createWindow(options);
    
    newInstance.window.once('ready-to-show', () => newInstance.window.show())
    
    if (!options.webContents) {
      newInstance.mobileView.webContents.loadURL(url)
      newInstance.mainView.webContents.loadURL(url) 
    }
    
    event.newGuest = newInstance.window

    if (frameName == '_blank') {
      showNotification()
    }
  })
});

/* Sleep function */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* Show notification, works on Windows, Linux and MacOS */
function showNotification() {
  if (notSendNotification) {
    const options = {
      title: 'Warning',
      body: 'WebViews Opens (_blank) links in new Browser instances!',
      silent: false,
      icon: path.join(__dirname, '/img/logo.png'),
      timeoutType: 'default',
      urgency: 'critical'
    }
    const customNotification = new Notification(options);
    customNotification.show();
    notSendNotification = false;
    sleep(5000);
    customNotification.hide;
  }
}

/* Set app name only for Windows */
if (process.platform === 'win32') {
  app.setAppUserModelId(app.name);
}

/* Set options when click the taskbar icon */
app.setUserTasks([{
  program: process.execPath,
  arguments: '--new-window',
  iconPath: process.execPath,
  iconIndex: 0,
  title: 'New WebView Window',
  description: 'Create a new WebView Window'
}])

/* Quit everything when browser closes */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/* Create window again when dock icon is clicked, only for MacOS */
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
