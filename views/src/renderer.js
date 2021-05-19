const { ipcRenderer } = require("electron");

const mobile_backButton = document.getElementById("mobile_back");
const mobile_forwardButton = document.getElementById("mobile_forward");
const main_backButton = document.getElementById("main_back");
const main_forwardButton = document.getElementById("main_forward");
const mock_button = document.getElementById('mock')

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