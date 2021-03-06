const { ipcRenderer } = require("electron");
const mobile_backButton = document.getElementById("mobile_back");
const mobile_forwardButton = document.getElementById("mobile_forward");
const main_backButton = document.getElementById("main_back");
const main_forwardButton = document.getElementById("main_forward");
const form = document.getElementById('url_input_form');
const input = document.getElementById('url_input');
const message = document.getElementById('message');
const mainDevTools = document.getElementById('mainDevTools');
const mobileDevTools = document.getElementById('mobileDevTools');
const resize = document.getElementById('resize');
const main_view = document.getElementById('main_view_block');
const mobile_view = document.getElementById('mobile_view_block');
const widthInfo = document.getElementById('widthInfo');
const rightClickButton = document.getElementById('buttonRightClick');
const refresh = document.getElementById('refresh_button');
const slider = document.getElementById('slider');
const sliderContainer = document.getElementById('slide__container');
let mobileId = -1;
let mainId = -1;
let state = {id: -1};

/* Sleep function */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* Listen for id */
ipcRenderer.on('id', (event, _id) => {
  state.id = _id;
})

/* Send id */
ipcRenderer.send('idInfo', state.id);

/* Store mobile Id for its session */
ipcRenderer.on('mobileId', (event, _id) => {
  mobileId = _id;
})

/* Store mainView Id for its session */
ipcRenderer.on('mainId', (event, _id) => {
  mainId = _id;
})

/* Handle go forth and back */
ipcRenderer.on('mobile_canNav', (event, canBack, canForward, url) => {
  mobile_backButton.disabled = !canBack;
  mobile_forwardButton.disabled = !canForward;
  input.value = url;
})

ipcRenderer.on('main_canNav', (event, canBack, canForward, url) => {
  main_backButton.disabled = !canBack;
  main_forwardButton.disabled = !canForward;
  input.value = url;
})

mobile_backButton.onclick = () => {
  ipcRenderer.send('mobile_goBack', mobileId);
}

mobile_forwardButton.onclick = () => {
  ipcRenderer.send('mobile_goForward', mobileId);
}

main_backButton.onclick = () => {
  ipcRenderer.send('main_goBack', mainId);
}

main_forwardButton.onclick = () => {
  ipcRenderer.send('main_goForward', mainId);
}

/* Handle url input */
form.onsubmit = async (event) => {
  event.preventDefault();
  var url = input.value;
  split = url.split(":")
  if (split.length === 3) {
    if (split[1] == '//localhost') {
      message.style.display = 'none';
      ipcRenderer.send('getUrl', "http://www." + url, state.id)
      return
    }
  } else if (split.length === 2) {
    if (split[0] == 'localhost') {
      message.style.display = 'none';
      ipcRenderer.send('getUrl', "http://www." + url, state.id)
      return
    }
  } else if (split.length === 1) {
    if (split[0] == 'localhost') {
      message.style.display = 'none';
      ipcRenderer.send('getUrl', "http://www." + url, state.id)
      return
    }
  } else {
    message.style.display = 'flex';
    await sleep(1000);
    message.style.display = 'none';
  }

  var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
    '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
  
  if (!pattern.test(url)) {    
    message.style.display = 'flex';
    await sleep(1000);
    message.style.display = 'none';
  } else {
    message.style.display = 'none';
    var protocol = /^((http|https|ftp):\/\/)/;
    if (!protocol.test(url)) {
      url = "https://www." + url;
    }
    ipcRenderer.send('getUrl', url, state.id)
  }
}

/* Input select */
var mouseEnter = false;
input.addEventListener('mouseenter', () => {
  mouseEnter = true;
  mouseLeft = false;
})

input.addEventListener('click', () => {
  if (mouseEnter && !mouseLeft) {
    input.focus();
    input.select();
    mouseLeft = true;
  }
})

var mouseLeft = false;
input.addEventListener('mouseleave', () => {
  mouseLeft = true;
  mouseEnter = false;
})

/* Dev tools */
mainDevTools.onclick = () => {
  ipcRenderer.send("mainDevTools");
}

mobileDevTools.onclick = () => {
  ipcRenderer.send("mobileDevTools");
}

/* Resize bar && Zoom */
var x = 0;
var isDown = false;
var isClicked = false;
var pos = 0;
var caughtValue = false

slider.addEventListener('mousedown', (e) => {
  isClicked = true;
  if (!caughtValue) {
    pos = e.clientX;
    caughtValue = true
  }
});

resize.addEventListener('mousedown', (e) => {
  if (isDown) { 
    isDown = false
  } else {
    isDown = true;
  }
  x = resize.offsetLeft - e.clientX;
});

resize.addEventListener('mouseup', () => {
  isDown = false;
})

document.addEventListener('mouseup', (e) => {
  isDown = false;
  caughtValue = false;
  if (isClicked) {
    ipcRenderer.send("zoom", Number.parseFloat(slider.value));
  }
  pos = e.clientX;
  isClicked = false;
});

document.addEventListener('mousemove', (e) => {
  // e.preventDefault();
  e.stopPropagation();
  if (isDown && e.clientX + x <= 450 && e.clientX + x >= 235) {
    resize.style.left = (e.clientX + x) + 'px';
    ipcRenderer.send('resize_drag', e.clientX + x + 13, state.id);
    main_view.style.flex = 1 -  (e.clientX + x + 13) / window.innerWidth;
    mobile_view.style.flex = (e.clientX + x + 13) / window.innerWidth;
  }
  if (isClicked) {
    if (e.clientX - pos > 0) {
      slider.value += 0.01;
    }
    if (e.clientX - pos < 0) {
      slider.value -= 0.01;
    }
    if (e.clientX - pos === 0) {
      slider.value = slider.value;
    }
  }
});

/* Update zoom slider when ctl + scroll */
ipcRenderer.on('update-zoom-slider', (e, zoomLevel) => {
  slider.value = zoomLevel;
})

/* resize on un/maximize enter/leave-full-screen will-resize */
ipcRenderer.on('resize_maximize', (e, x) => {
  resize.style.left = x - 13 + 'px';
  main_view.style.flex = 1 - (x + 13) / window.innerWidth;
  mobile_view.style.flex = (x + 13) / window.innerWidth;
})

/* Resize on creation */
main_view.style.flex = 1 - (resize.offsetLeft + 13) / window.innerWidth;
mobile_view.style.flex = (resize.offsetLeft + 13) / window.innerWidth;
input.value = 'https://github.com';

/* Width info update */
ipcRenderer.on('widthInfo', (e, mobileWidth, mobileHeight, mainWidth, mainHeight) => {
  widthInfo.innerText = mobileWidth + 'x' + mobileHeight + ' || ' + mainWidth + 'x' + mainHeight;
})

/* Right Click prevent */
var toggle = false;
rightClickButton.addEventListener('click', (e) => {
  e.preventDefault();
  toggle = !toggle;
  ipcRenderer.send('listenRightClick', toggle, state.id);
  if (toggle) {
    rightClickButton.style.background = '#238D3D';
    rightClickButton.style.border = '2px solid #238D3D';
  } else {
    rightClickButton.style.background = 'crimson';
    rightClickButton.style.border = '2px solid crimson';
  }
})

/* Refresh */
refresh.addEventListener('click', (e) => {
  ipcRenderer.send('refresh', state.id);
})