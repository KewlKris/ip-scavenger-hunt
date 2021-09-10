import globe from './globe';

let PORT;
let recentDark = true;
let firstCountryUpdate = true;

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
                addRecentPing(data);
                break;
            case 'country-update':
                globe.updatePingedCountries(Object.keys(data.countries));
                if (firstCountryUpdate) {
                    setInitialRecentPings(data);
                    firstCountryUpdate = false;
                }
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

function setInitialRecentPings(pingData) {
    let pings = pingData.recent;

    // Add the pings in reverse to maintain correct order
    for (let x=pings.length-1; x>=0; x--) {
        let ping = pings[x];

        addRecentPing(ping, true);
    }
}

function addRecentPing(pingData, noTransition=false) {
    let elem = e => document.createElement(e);
    let list = document.querySelector('#recent-list');

    let row = elem('div');
    let flag = elem('div');
    let flagImg = elem('img');
    flagImg.src = `./flags/${pingData.country.toLowerCase()}.png`;
    flag.appendChild(flagImg);
    let state = elem('div');
    state.innerText = pingData.state;
    let city = elem('div');
    city.innerText = pingData.city;
    
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