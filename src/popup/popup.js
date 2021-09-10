import globe from './globe';
import info from './info';

let PORT;
let firstCountryUpdate = true;

window.onload = async () => {
    // Initialize
    await Promise.all([
        globe.initializeGlobe()
    ]);
    info.initializeToolbar();
    info.selectPage(1);
    info.setVersion();
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
                info.addRecentPing(data);
                break;
            case 'country-update':
                globe.updatePingedCountries(Object.keys(data.countries));
                if (firstCountryUpdate) {
                    info.setInitialRecentPings(data);
                    firstCountryUpdate = false;
                }
        }
    });

    sendMessage('request-countries');
}

function sendMessage(event, data={}) {
    PORT.postMessage({event, data});
}