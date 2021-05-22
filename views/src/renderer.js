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
const zoomIn = document.getElementById('zoomIn');
const zoomOut = document.getElementById('zoomOut');
const slider = document.getElementById('slider');
let mobileId = -1;
let mainId = -1;


/* Handle go forth and back */
ipcRenderer.on('mobileId', (event, _id) => {
  mobileId = _id;
})

ipcRenderer.on('mainId', (event, _id) => {
  mainId = _id;
})

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
form.onsubmit = (event) => {
  event.preventDefault();
  var url = input.value;
  
  split = url.split(":")
  if (split.length === 3) {
    if (split[1] == '//localhost') {
      message.style.display = 'none';
      ipcRenderer.send('getUrl', "http://www." + url)
      return
    }
  } else if (split.length === 2) {
    if (split[0] == 'localhost') {
      message.style.display = 'none';
      ipcRenderer.send('getUrl', "http://www." + url)
      return
    }
  } else if (split.length === 1) {
    if (split[0] == 'localhost') {
      message.style.display = 'none';
      ipcRenderer.send('getUrl', "http://www." + url)
      return
    }
  } else {
    message.style.display = 'flex';
  }

  var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
    '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
  
  if (!pattern.test(url)) {    
    message.style.display = 'flex';
  } else {
    message.style.display = 'none';
    var protocol = /^((http|https|ftp):\/\/)/;
    if (!protocol.test(url)) {
      url = "https://www." + url;
    }
    ipcRenderer.send('getUrl', url)
  }
}

/* Dev tools */
mainDevTools.onclick = (event) => {
  ipcRenderer.send("mainDevTools");
}

mobileDevTools.onclick = (event) => {
  ipcRenderer.send("mobileDevTools");
}

/* Resize bar */
var x = 0;
var isDown = false;

resize.addEventListener('mousedown', (e) => {
  isDown = true;
  x = resize.offsetLeft - e.clientX;
});

document.addEventListener('mouseup', () => {
  isDown = false;
});

document.addEventListener('mousemove', (e) => {
  e.preventDefault();
  if (isDown && e.clientX + x - 13 <= 450 && e.clientX + x - 13 >= 235) {
    resize.style.left = (e.clientX + x -13) + 'px';
    ipcRenderer.send('resize_drag', e.clientX + x);
    main_view.style.flex = 1 -  (e.clientX + x) / window.innerWidth;
    mobile_view.style.flex = (e.clientX + x) / window.innerWidth;
  }
});

ipcRenderer.on('resize_maximize', (e, x) => {
  resize.style.left = (x - 13) + 'px';
  main_view.style.flex = 1 -  x / window.innerWidth;
  mobile_view.style.flex = x / window.innerWidth;
})

/* Resize on creation */
main_view.style.flex = 1 - (resize.offsetLeft + 13) / window.innerWidth;
mobile_view.style.flex = (resize.offsetLeft + 13) / window.innerWidth;
input.value = 'https://github.com';

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

/* Width info update */
ipcRenderer.on('widthInfo', (e, mobileWidth, mobileHeight, mainWidth, mainHeight) => {
  widthInfo.innerText = mobileWidth + 'x' + mobileHeight + ' || ' + mainWidth + 'x' + mainHeight;
})

var toggle = false;
rightClickButton.addEventListener('click', (e) => {
  e.preventDefault();
  toggle = !toggle;
  ipcRenderer.send('listenRightClick', toggle);
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
  ipcRenderer.send('refresh');
})

/* Zoom */
slider.oninput = () => {
  console.log(slider.value);
  ipcRenderer.send('zoom', Number.parseFloat(slider.value))
}
