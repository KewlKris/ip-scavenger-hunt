import IP2Location from './ip2location';
import database from '../database.bin';

let LOADED = false;
let IP_DATABASE;
let EVENT_BUFFER = [];
let PORTS = [];
let PING_LOG;

// Load the databass
(async () => {
    // Download the database
    console.log('Started loading databases...');
    let response = await fetch(database);
    IP_DATABASE = new IP2Location(await response.arrayBuffer());
    console.log('Finished loading databases!');

    // Load PINGED_LIST
    await loadPingLog();
    LOADED = true;

    // Log all the IPs recorded while the databases were loading
    EVENT_BUFFER.forEach(ip => logConnection(ip));
})();

chrome.webRequest.onCompleted.addListener((event) => {
    if (!LOADED) {
        EVENT_BUFFER.push(event.ip); // Store these events for once the database is loaded
        return;
    }

    logConnection(event.ip);
}, {urls: ['<all_urls>']});

chrome.runtime.onConnect.addListener(port => {
    if (port.name != 'popup') return;
    PORTS.push(port);
    port.onMessage.addListener(msg => handleMessage(msg, port));
    port.onDisconnect.addListener(() => {
        // Remove the port from the PORTS list
        PORTS = PORTS.filter(testPort => testPort !== port);
    });
});

function handleMessage(message, port) {
    let {event, data} = message;
    switch(event) {
        case 'request-countries':
            sendMessage(port, 'country-update', PING_LOG);
            break;
    }
}

function sendMessage(port, event, data={}) {
    port.postMessage({event, data});
}

function broadcastMessage(event, data) {
    PORTS.forEach(port => {
        port.postMessage({event, data});
    });
}

function logConnection(ip) {
    if (!ip) return;

    let result = IP_DATABASE.getAll(ip);

    // Check if this location has been pinged yet
    let country = result.country_short;
    let state = result.region;

    broadcastMessage('new-ping', result);
    updatePingLog(result);

    console.log(`Connected to ${ip} | Country: ${result.country_short} State: ${result.region} City: ${result.city}`);
}

function updatePingLog(pingInfo) {
    let country = pingInfo.country_short;
    let state = pingInfo.region;
    let {latitude, longitude, city} = pingInfo;

    let pingAdded = false;
    let keys = Object.keys(PING_LOG);

    if (keys.indexOf(country) == -1) {
        // This is a new country ping
        PING_LOG.countries[country] = {
            pingCount: 1,
            pings: [
                {
                    timestamp: Date.now(),
                    latitude,
                    longitude,
                    country,
                    state,
                    city
                }
            ]
        };
    } else {
        // This country has already been pinged, but log it
        PING_LOG.countries[country].pingCount += 1;
        PING_LOG.countries[country].pings.push({
            timestamp: Date.now(),
            latitude,
            longitude,
            country,
            state,
            city
        })
    }

    if (country == 'US' && keys.indexOf(state) == -1) {
        // This is a new state ping
        PING_LOG.countries[state] = {
            pingCount: 1,
            pings: [
                {
                    timestamp: Date.now(),
                    latitude,
                    longitude,
                    country,
                    state,
                    city
                }
            ]
        };
    } else if (country == 'US' && keys.indexOf(state) != -1) {
        // This state has already been pinged, but log it
        PING_LOG.countries[state].pingCount += 1;
        PING_LOG.countries[state].pings.push({
            timestamp: Date.now(),
            latitude,
            longitude,
            country,
            state,
            city
        });
    }

    PING_LOG.stats.totalPings += 1;
    broadcastMessage('country-update', PING_LOG);
    savePingLog();
}

function savePingLog() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set({pingLog: PING_LOG}, () => {
            resolve();
        });
    });
}

function loadPingLog() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get('pingLog', result => {
            PING_LOG = result.pingLog;
            PING_LOG ??= {
                countries: {},
                stats: {
                    totalPings: 0
                }
            };

            resolve();
        });
    });
}