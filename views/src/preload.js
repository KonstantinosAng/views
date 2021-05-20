const customTitlebar = require('custom-electron-titlebar');

let MyTitleBar = new customTitlebar.Titlebar({
  backgroundColor: customTitlebar.Color.fromHex('#0d1117'),
  shadow: true,
  icon: './favicon.png',
});

MyTitleBar.updateTitle('Views');