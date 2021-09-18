let recentDark = true;

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

function setInitialRecentPings(pingData) {
    let pings = pingData.recent;

    if (pings.length == 0 && document.querySelectorAll('#noweb').length == 0) {
        let span = document.createElement('span');
        span.innerText = 'No web requests have been logged yet!';
        span.id = 'noweb';
        span.classList.add('nowebrequests');

        document.getElementById('recent-list').appendChild(span);
        return;
    }
    if (document.querySelector('#noweb')) document.querySelector('#noweb').remove();

    // Add the pings in reverse to maintain correct order
    for (let x=pings.length-1; x>=0; x--) {
        let ping = pings[x];

        addRecentPing(ping, true);
    }
}

function addRecentPing(pingData, noTransition=false) {
    if (document.querySelector('#noweb')) document.querySelector('#noweb').remove();
    let elem = e => document.createElement(e);
    let list = document.querySelector('#recent-list');

    let row = elem('div');
    let flag = elem('div');
    let flagImg = elem('img');
    flagImg.src = `./flags/${pingData.country.toLowerCase()}.png`;
    flagImg.title = pingData.country_long;
    flag.appendChild(flagImg);
    let state = elem('div');
    state.innerText = limitLength(pingData.state, 16);
    state.title = pingData.state;
    let city = elem('div');
    city.innerText = limitLength(pingData.city, 16);
    city.title = pingData.city;
    
    [flag, state, city].forEach(node => row.appendChild(node));

    if (recentDark) row.classList.add('recent-dark');
    recentDark = !recentDark;
    list.insertBefore(row, document.querySelector('#recent-list div'));

    if (noTransition) row.classList.add('recent-visible');
    else setTimeout(() => row.classList.add('recent-visible'), 100);

    // Remove any extra rows
    let removeList = [];
    Array(...list.children).forEach((element, index) => {
        if (index >= 6) {
            removeList.push(element);
        }
    });
    removeList.forEach(element => {
        element.classList.add('recent-invisible');
        setTimeout(() => element.remove(), 1000);
    });
}

function setVersion() {
    document.getElementById('version').innerText = chrome.runtime.getManifest().version;
}

function updateStats(stats) {
    let {progress, totalPings, uniquePings, repeatPings} = stats;

    let setElem = (id, value) => document.getElementById(id).innerText = value;

    setElem('stats-scavengingprogress', progress);
    setElem('stats-totalpings', totalPings);
    setElem('stats-uniquepings', uniquePings);
    setElem('stats-repeatpings', repeatPings);
}

function getSettings() {
    let getChecked = id => document.getElementById(id).checked;

    return {
        includeStates: getChecked('stats-includeus'),
        showAllPings: getChecked('stats-showlines'),
        pingHeatmap: getChecked('stats-pingheatmap'),
        displayPercents: getChecked('stats-displaypercents')
    };
}

function setSettings(settings) {
    let setChecked = (id, value) => document.getElementById(id).checked = value;

    setChecked('stats-includeus', settings.includeStates);
    setChecked('stats-showlines', settings.showAllPings);
    setChecked('stats-pingheatmap', settings.pingHeatmap);
    setChecked('stats-displaypercents', settings.displayPercents);
}

function limitLength(text, length) {
    if (text.length > length) {
        text = text.substring(0, length-3) + '...';
    }

    return text;
}

export default {
    initializeToolbar,
    selectPage,
    setInitialRecentPings,
    addRecentPing,
    setVersion,
    updateStats,
    getSettings,
    setSettings
};