import globe from './globe';
import info from './info';
import globeinfo from './globeinfo';

let PORT;
let settings = {};
let PING_LOG = undefined;

window.onload = async () => {
    // Initialize
    await Promise.all([
        globe.initializeGlobe()
    ]);
    info.initializeToolbar();
    globeinfo.initialize();
    info.selectPage(1);
    info.setVersion();
    initializePort();
    globe.startDrawing();

    document.getElementById('stats-right').onchange = () => {
        let settings = info.getSettings();
        sendMessage('set-settings', settings);
    };
};

window.onclose = () => {
    sendMessage('save-log');
};

function initializePort() {
    PORT = chrome.runtime.connect(undefined, {
        name: 'popup'
    });

    PORT.onMessage.addListener(handleMessage);

    sendMessage('request-log');
    sendMessage('request-settings');
}

function handleMessage(msg) {
    let {event, data} = msg;
    switch(event) {
        case 'new-ping':
            let ping = data.ping;
            let log = data.PING_LOG;
            globe.addPing(ping.latitude, ping.longitude);
            info.addRecentPing(ping);

            PING_LOG = log;
            globeinfo.updatePingLog(log);
            updateStats(log);
            break;
        case 'settings-update':
            info.setSettings(data.settings);
            globe.setSettings(data.settings);
            settings = data.settings;
            globe.updatePingedCountries(Object.keys(data.countries));
            PING_LOG = data;
            updateStats(data);
            globeinfo.updatePingLog(data);
            break;
        case 'settings-cleardata':
            window.close();
            break;
        case 'log-update':
            PING_LOG = data;
            globeinfo.updatePingLog(data);
            info.setInitialRecentPings(data);
            globe.revealGlobe();
            break;
        case 'buffered':
            data.forEach(message => {
                setTimeout(() => handleMessage(message.msg), message.timeout);
            });
            break;
    }
}

function updateStats(data) {
    let countries = data.countries;
    let {allCountries, pingedCountries, unpingedCountries} = globe.getPingLists();

    let statsCountries = []; // Only consider countries based on whether states are included or not
    let activeCount = 0;
    allCountries.forEach(country => {
        let countryName = country.properties.name;
        if (globe.countryIsActive(countryName)) {
            activeCount++;
            if (countries[countryName]) statsCountries.push(countries[countryName]);
        }
    });
    statsCountries.sort((a, b) => a.pingCount - b.pingCount);

    // Calculate progress
    let total = activeCount;
    let completed = pingedCountries.length;
    let progress = settings.displayPercents ? formatPercent(completed, total) : `${formatNumber(completed)} / ${formatNumber(total)}`;

    // Calculate pings
    let totalPings = 0;
    let uniquePings = 0;
    let repeatPings = 0;
    let uniquePingCoords = [];
    statsCountries.forEach(country => {
        totalPings += country.pingCount;
        uniquePings += country.uniquePings;
        repeatPings += country.repeatPings;

        uniquePingCoords.push(...country.pings.map(ping => {
            let coords = ping.split('|').map(coord => Number(coord));
            return {latitude: coords[0], longitude: coords[1]};
        }));
    });

    // Loop again to calculate weights for pinged countries
    let heatmapRankings = {};
    statsCountries.forEach((country, index) => {
        if (statsCountries.length > 1) heatmapRankings[country.name] = index / (statsCountries.length - 1);
        else heatmapRankings[country.name] = 1;
    });

    globe.setUniquePings(uniquePingCoords);
    globe.setHeatmapRankings(heatmapRankings);

    uniquePings = settings.displayPercents ? formatPercent(uniquePings, totalPings) : formatNumber(uniquePings);
    repeatPings = settings.displayPercents ? formatPercent(repeatPings, totalPings) : formatNumber(repeatPings);
    totalPings = formatNumber(totalPings);

    info.updateStats({progress, totalPings, uniquePings, repeatPings});
}

function sendMessage(event, data={}) {
    PORT.postMessage({event, data});
}

function formatNumber(num) {
    let str = String(num);
    for (let x=str.length-4; x>=0; x -= 3) {
        str = str.substring(0, x+1) + ',' + str.substring(x+1);
    }

    return str;
}

function formatPercent(value, total) {
    return String((value / total * 100).toFixed(1)) + '%';
}