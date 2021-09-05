import {geoDistance, geoInterpolate} from 'd3';
import IP2Location from './ip2location';
import database from '../database.bin';

let LOADED = false;
let IP_DATABASE;
let EVENT_BUFFER = [];
let PORTS = [];
let PINGED_LIST = [];

// Load the databass
(async () => {
    // Download the database
    console.log('Started loading databases...');
    let response = await fetch(database);
    IP_DATABASE = new IP2Location(await response.arrayBuffer());
    console.log('Finished loading databases!');
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
            sendMessage(port, 'country-update', PINGED_LIST);
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
    updatePingedList(country, state);

    console.log(`Connected to ${ip} | Country: ${result.country_short} State: ${result.region} City: ${result.city}`);
}

function updatePingedList(country, state) {
    let pingAdded = false;

    if (PINGED_LIST.indexOf(country) == -1) {
        // This is a new country ping
        PINGED_LIST.push(country);
        pingAdded = true;
    }
    if (country == 'US' && PINGED_LIST.indexOf(state) == -1) {
        // This is a new state ping
        PINGED_LIST.push(state);
        pingAdded = true;
    }

    if (pingAdded) broadcastMessage('country-update', PINGED_LIST);
}