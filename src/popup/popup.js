import globe from './globe';

let PORT;

window.onload = async () => {
    // Initialize
    await Promise.all([
        globe.initializeGlobe()
    ]);
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
                globe.updatePingedCountries(data);
        }
    });

    sendMessage('request-countries');
}

function sendMessage(event, data={}) {
    PORT.postMessage({event, data});
}