import globe from './globe';

let canvas, PING_LOG, infoBox, infoCountry, infoPings;

function initialize() {
    canvas = document.getElementById('globe')
    canvas.addEventListener('mousemove', handleHover);
    canvas.addEventListener('mouseout', () => infoBox.style.opacity = 0);

    infoBox = document.getElementById('globe-popup');
    infoCountry = document.getElementById('globeinfo-countryname');
    infoPings = document.getElementById('globeinfo-pingcount');
}

function handleHover(event) {
    let rect = canvas.getBoundingClientRect();

    let x = event.pageX - rect.left;
    let y = event.pageY - rect.top;

    let country = globe.getCountryOnScreen(x, y);
    if (!country) {
        infoBox.style.opacity = 0;
        return;
    }

    infoBox.style.left = String(event.pageX + 10) + 'px';
    infoBox.style.top = String(event.pageY - 5) + 'px';
    infoBox.style.opacity = 1;
    infoCountry.innerText = country.name_long;
    if (!PING_LOG.countries[country.name]) {
        // This country has not been pinged
        infoPings.innerText = `Pings: 0`;
    } else {
        let pingCount = PING_LOG.countries[country.name].pingCount;
        let pingStr = PING_LOG.settings.displayPercents ? formatPercent(pingCount, PING_LOG.stats.totalPings) : formatNumber(pingCount);
        infoPings.innerText = 'Pings: ' + pingStr;
    }
}

function updatePingLog(log) {
    PING_LOG = log;
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

export default {initialize, updatePingLog};