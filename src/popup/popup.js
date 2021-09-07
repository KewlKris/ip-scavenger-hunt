import globe from './globe';

let PORT;

window.onload = async () => {
    // Initialize
    await Promise.all([
        globe.initializeGlobe()
    ]);
    initializeToolbar();
    selectPage(1);
    initializePort();
    globe.startDrawing();
};

function initializePort() {
    PORT = chrome.runtime.connect(undefined, {
        name: 'popup'
    });

    PORT.onMessage.addListener(msg => {
        let {event, data} = msg;
        switch(event) {
            case 'new-ping':
                globe.addPing(data.latitude, data.longitude);
                break;
            case 'country-update':
                globe.updatePingedCountries(Object.keys(data.countries));
        }
    });

    sendMessage('request-countries');
}

function sendMessage(event, data={}) {
    PORT.postMessage({event, data});
}

function initializeToolbar() {
    let buttons = document.querySelectorAll('.toolbar-item');
    buttons.forEach((button, index) => {
        button.onclick = () => {
            selectPage(index);
        }
    });
}

function selectPage(index) {
    let buttons = document.querySelectorAll('.toolbar-item');
    buttons.forEach(button => {
        button.classList.remove('toolbar-item-selected');
    });

    buttons[index].classList.add('toolbar-item-selected');

    // Change the info page
    let slider = document.querySelector('.info-slider');
    slider.style = `left: ${-index*100}%`;
}