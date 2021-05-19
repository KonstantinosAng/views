const { ipcRenderer } = require("electron");

const mobile_backButton = document.getElementById("mobile_back");
const mobile_forwardButton = document.getElementById("mobile_forward");
const main_backButton = document.getElementById("main_back");
const main_forwardButton = document.getElementById("main_forward");
const mock_button = document.getElementById('mock');
const form = document.getElementById('url_input_form');
const input = document.getElementById('url_input');
const message = document.getElementById('message');

let mobileId = -1;
let mainId = -1;

ipcRenderer.on('mobileId', (event, _id) => {
  mobileId = _id;
})

ipcRenderer.on('mainId', (event, _id) => {
  mainId = _id;
})

ipcRenderer.on('mobile_canNav', (event, canBack, canForward) => {
  mobile_backButton.disabled = !canBack;
  mobile_forwardButton.disabled = !canForward;
})

ipcRenderer.on('main_canNav', (event, canBack, canForward) => {
  main_backButton.disabled = !canBack;
  main_forwardButton.disabled = !canForward;
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

form.onsubmit = (event) => {
  event.preventDefault();
  var url = input.value;
  
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