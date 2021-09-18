import IP2Location from './ip2location';
import database from '../database.bin';
import LZUTF8 from 'lzutf8';

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
        case 'request-log':
            sendMessage(port, 'log-update', PING_LOG);
            break;
        case 'request-settings':
            sendMessage(port, 'settings-update', PING_LOG);
            break;
        case 'set-settings':
            PING_LOG.settings = data;
            broadcastMessage('settings-update', PING_LOG);
            savePingLog();
            break;
        case 'settings-cleardata':
            broadcastMessage('settings-cleardata');
            loadPingLog();
        case 'save-log':
            savePingLog();
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

    if (country == '-' || state == '-') return; // Skip missing data

    updatePingLog(result);
}

function updatePingLog(pingInfo) {
    let country = pingInfo.country_short;
    let state = pingInfo.region;
    let {latitude, longitude, city, country_long} = pingInfo;

    let keys = Object.keys(PING_LOG.countries);

    let logInfo = {
        timestamp: Date.now(),
        latitude,
        longitude,
        country,
        state,
        city,
        country_long
    };

    if (keys.indexOf(country) == -1) {
        // This is a new country ping
        PING_LOG.countries[country] = {
            name: country,
            pingCount: 1,
            uniquePings: 1,
            repeatPings: 0,
            pings: [String(latitude) + '|' + String(longitude)]
        };
    } else {
        // This country has already been pinged, but log it
        addPingToCountry(PING_LOG.countries[country], latitude, longitude);
    }

    if (country == 'US' && keys.indexOf(state) == -1) {
        // This is a new state ping
        PING_LOG.countries[state] = {
            name: state,
            pingCount: 1,
            uniquePings: 1,
            repeatPings: 0,
            pings: [String(latitude) + '|' + String(longitude)]
        };
    } else if (country == 'US' && keys.indexOf(state) != -1) {
        // This state has already been pinged, but log it
        addPingToCountry(PING_LOG.countries[state], latitude, longitude);
    }

    PING_LOG.recent.splice(0, 0, logInfo);
    PING_LOG.recent.splice(6, PING_LOG.recent.length - 6); // Let there only be 6 recent pings

    PING_LOG.stats.totalPings += 1;
    broadcastMessage('new-ping', {ping: logInfo, PING_LOG});
    savePingLog();
}

function addPingToCountry(country, latitude, longitude) {
    let combination = String(latitude) + '|' + String(longitude);

    if (country.pings.indexOf(combination) == -1) {
        // This is a unique ping
        country.pings.push(combination);
        country.uniquePings += 1;
    } else {
        country.repeatPings += 1;
    }

    country.pingCount += 1;
}

function savePingLog() {
    return new Promise((resolve, reject) => {
        let data = LZUTF8.compress(JSON.stringify(PING_LOG), {outputEncoding: 'Base64'});
        chrome.storage.local.set({pingLog: data}, () => {
            resolve();
        });
    });
}

function loadPingLog() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get('pingLog', result => {
            let data = result.pingLog;

            if (!data) {
                // Fresh install or data deleted
                PING_LOG = {
                    countries: {},
                    stats: {
                        totalPings: 0
                    },
                    recent: [],
                    settings: {
                        includeStates: true,
                        showAllPings: false,
                        pingHeatmap: false,
                        displayPercents: false
                    },
                    version: 1
                };
            } else {
                PING_LOG = JSON.parse(LZUTF8.decompress(data, {inputEncoding: 'Base64'}));
            }

            resolve();
        });
    });
}