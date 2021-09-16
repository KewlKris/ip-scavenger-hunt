import globe from './globe';
import info from './info';
import globeinfo from './globeinfo';

let PORT;
let firstCountryUpdate = true;
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

    // Only update settings if things are running smoothly
    setInterval(() => {
        if (globe.getLastFrameDuration() < 100) {
            globe.updatePingedCountries(Object.keys(PING_LOG.countries));
            updateStats(PING_LOG);
        }
    }, 3000);
};

window.onclose = () => {
    sendMessage('save-log');
};

function initializePort() {
    PORT = chrome.runtime.connect(undefined, {
        name: 'popup'
    });

    PORT.onMessage.addListener(handleMessage);

    sendMessage('request-countries');
    sendMessage('request-settings');
}

function handleMessage(msg) {
    let {event, data} = msg;
    switch(event) {
        case 'new-ping':
            globe.addPing(data.latitude, data.longitude);
            info.addRecentPing(data);
            break;
        case 'country-update':
            if (firstCountryUpdate) {
                info.setInitialRecentPings(data);
                firstCountryUpdate = false;
            }
            PING_LOG = data;
            globeinfo.updatePingLog(data);
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

    let statsCountryNames = []; // Only consider countries based on whether states are included or not
    allCountries.forEach(country => {
        let countryName = country.properties.name;
        if (globe.countryIsActive(countryName)) statsCountryNames.push(countryName);
    });

    // Calculate progress
    let total = statsCountryNames.length;
    let completed = pingedCountries.length;
    let progress = settings.displayPercents ? formatPercent(completed, total) : `${formatNumber(completed)} / ${formatNumber(total)}`;

    // Calculate pings
    let totalPings = 0;
    let uniquePings = 0;
    let repeatPings = 0;
    let uniquePingCoords = [];
    let highestPings = 0;
    let lowestPings = 0xFFFFFFFFF;
    statsCountryNames.forEach(countryName => {
        if (countries[countryName] == undefined) return;
        let country = countries[countryName];

        let pingCount = country.pings.length;
        if (pingCount > highestPings) highestPings = pingCount;
        if (pingCount < lowestPings) lowestPings = pingCount;

        let pingedList = [];
        country.pings.forEach(ping => {
            let unique = true;
            for (let x=0; x<pingedList.length; x++) {
                let testPing = pingedList[x];
                if (testPing.state == ping.state && testPing.city == ping.city) {
                    unique = false;
                    break;
                }
            }

            totalPings++;
            if (unique) {
                pingedList.push({state: ping.state, city: ping.city, latitude: ping.latitude, longitude: ping.longitude});
                uniquePings++;
            } else {
                repeatPings++;
            }
        });
        uniquePingCoords.push(...pingedList);
    });

    // Loop again to calculate weights for pinged countries
    let heatmapRankings = {};
    let pingRange = highestPings - lowestPings;
    statsCountryNames.forEach(countryName => {
        if (countries[countryName] == undefined) return;
        let country = countries[countryName];
        let pingCount = country.pings.length;

        let offset = pingCount - lowestPings;
        heatmapRankings[countryName] = offset / pingRange;
    });

    globe.setUniquePings(uniquePingCoords);
    globe.setHeatmapRankings(heatmapRankings);

    uniquePings = settings.displayPercents ? formatPercent(uniquePings, totalPings) : formatNumber(uniquePings);
    repeatPings = settings.displayPercents ? formatPercent(repeatPings, totalPings) : formatNumber(repeatPings);
    totalPings = formatNumber(totalPings);

    info.updateStats({progress, totalPings, uniquePings, repeatPings});

    console.log(globe.getLastFrameDuration());
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