import {select, geoOrthographic, geoPath, drag, scaleLinear, geoCircle, geoDistance, geoInterpolate, geoContains} from 'd3';
import countries_url from '../countries.tiny.geojson';
import states_url from '../states.tiny.geojson';

const PING_SPEED = 3000;

let geojson, globe, location, allCountries, pingedCountries, unpingedCountries, pings, uniquePings, heatmapRankings;
let previousTimestamp, recentTimestamp;
let settings = {};

async function loadGeoJSON() {
    let [countries, states] = await Promise.all([fetch(countries_url), fetch(states_url)]);
    geojson = {countries: await countries.json(), states: await states.json()};

    allCountries = [];
    allCountries.push(...geojson.countries.features, ...geojson.states.features);

    updatePingedCountries();
}

function updatePingedCountries(countries=[]) {
    pingedCountries = [];
    unpingedCountries = [];
    allCountries.forEach(country => {
        // Mark a country as pinged if it has been pinged and if it matches the current state selection status
        ((countryIsActive(country.properties.name) && countries.indexOf(country.properties.name) != -1)
        ? pingedCountries
        : unpingedCountries)
        .push(country);
    });
}

async function initializeGlobe() {
    pings = [];
    uniquePings = [];
    heatmapRankings = {};
    previousTimestamp = Date.now();
    recentTimestamp = Date.now();

    let promises = [loadGeoJSON(), updateLocation()];

    let canvas = select('#globe').node();
    let context = canvas.getContext('2d');
    let projection = geoOrthographic().scale(155);
    let generator = geoPath()
        .projection(projection)
        .pointRadius(4)
        .context(context);
    
    // Keep the planet centered
    let rect = canvas.getBoundingClientRect();
    let center = () => {
        canvas.setAttribute('width', rect.width);
        canvas.setAttribute('height', rect.height);
        projection.translate([
            canvas.width / 2,
            canvas.height / 2
        ]);

        // Also keep the background scaled properly
        document.body.style.backgroundSize = (canvas.width/canvas.height > 1.5) ? `${canvas.width}px auto` : `auto ${canvas.height}px`;
        rect = canvas.getBoundingClientRect();
    };
    window.addEventListener('resize', center);
    center();

    // Planet Rotation
    let globeDrag = drag();
    globeDrag.on('drag', event => {
        const {dx, dy} = event;
        let rotation = projection.rotate();
        let radius = projection.scale();
        let scale = scaleLinear()
            .domain([-radius, radius])
            .range([-90, 90]);
        let degX = scale(dx);
        let degY = scale(dy);
        rotation[0] += degX;
        rotation[1] -= degY;
        if (rotation[1] > 90) rotation[1] = 90;
        if (rotation[1] < -90) rotation[1] = -90;
        if (rotation[0] >= 180) rotation[0] -= 360;
        projection.rotate(rotation);
    });
    select(canvas).call(globeDrag);
    
    globe = {canvas, context, projection, generator};

    await Promise.all(promises); // Make sure all setup is finished
}

function drawGlobe() {
    let {canvas, context, generator} = globe;

    previousTimestamp = recentTimestamp;
    recentTimestamp = Date.now();

    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw oceans
    context.fillStyle = '#9aa7b5';
    context.beginPath();
    generator({type: 'Sphere'});
    context.fill();
    //context.closePath();

    // Draw unpinged countries
    context.lineWidth = 0.6;
    context.strokeStyle = '#AAA';
    context.fillStyle = '#EEE';
    context.beginPath();
    unpingedCountries.forEach(country => {
        if (countryIsActive(country.properties.name)) generator({type: 'Feature', geometry: country.geometry});
    });
    context.fill();
    context.stroke();
    //context.closePath();

    if (!settings.pingHeatmap) {
        // Draw pinged countries
        context.fillStyle = '#2874ed';
        context.beginPath();
        pingedCountries.forEach(country => {
            if (countryIsActive(country.properties.name)) generator({type: 'Feature', geometry: country.geometry});
        });
        context.fill();
        context.stroke();
        //context.closePath();
    } else {
        // Heatmap is active
        pingedCountries.forEach(country => {
            let countryName = country.properties.name;
            if (!countryIsActive(countryName)) return;

            context.beginPath();
            context.fillStyle = getHeatmapColor(heatmapRankings[countryName]);
            generator({type: 'Feature', geometry: country.geometry});
            context.fill();
            context.stroke();
        });
    }

    // Draw pings
    drawPings();

    // Draw location
    drawLocation();

    // Draw unique pings if selected
    if (settings.showAllPings) drawUniquePings();
}

function drawLocation() {
    drawCircle(location.latitude, location.longitude, 1.6, '#FFF');
    drawCircle(location.latitude, location.longitude, 1.1, '#29c254');
}

function drawCircle(latitude, longitude, radius, fillStyle) {
    let {context, generator} = globe;
    context.fillStyle = fillStyle;
    let circle = geoCircle().center([longitude, latitude]).radius(radius)();
    context.beginPath();
    generator.context(context)(circle);
    context.fill();
    //context.closePath();
}

function drawPings() {
    let time = Date.now();

    let {context, generator} = globe;
    context.fillStyle = '#F00';
    //context.strokeStyle = '#400';
    context.beginPath();

    for (let x=0; x<pings.length; x++) {
        let ping = pings[x];
        if (time > ping.endTime) {
            // This ping is expired
            pings.splice(x, 1);
            x--;
            continue;
        }

        // Draw this ping
        let progress = (time < ping.startTime + ping.travelTime) ? (time - ping.startTime) / ping.travelTime : (ping.endTime - time) / ping.travelTime;
        let [long, lat] = ping.interpolator(progress);
        let circle = geoCircle().center([long, lat]).radius(1)();
        generator.context(context)(circle);
    }
    context.fill();
}

function drawUniquePings() {
    let {context, generator} = globe;

    context.beginPath();

	context.strokeStyle = 'red';
    context.lineWidth = 0.6;
    uniquePings.forEach(ping => {
        generator({type: 'Feature', geometry: {type: 'LineString', coordinates: [[location.longitude, location.latitude], [ping.longitude, ping.latitude]]}});
    });
    context.stroke();
}

function updateLocation() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition((pos) => {
            location = {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude
            };
            globe.projection.rotate([-location.longitude, -location.latitude, 0]);
            resolve();
        });
    });
}

function addPing(latitude, longitude) {
    let time = Date.now();

    // Calculate the travel time
    let distance = geoDistance([location.longitude, location.latitude], [longitude, latitude]);
    let travelTime = distance * PING_SPEED;

    let ping = {
        startPos: JSON.parse(JSON.stringify(location)),
        targetPos: {latitude, longitude},
        startTime: time,
        travelTime: travelTime,
        endTime: time + (travelTime * 2),
        interpolator: geoInterpolate([location.longitude, location.latitude], [longitude, latitude])
    };
    pings.push(ping);
}


function getHeatmapColor(val) {
    let lighest = [43, 125, 255];
    let darkest = [14, 39, 79];

    let newColor = [];
    for (let x=0; x<lighest.length; x++) {
        newColor.push(((darkest[x] - lighest[x]) * val) + lighest[x]);
    }

    return `rgb(${newColor[0]}, ${newColor[1]}, ${newColor[2]})`;
    
}

function step(timestamp) {
    drawGlobe(timestamp);
    window.requestAnimationFrame(step);
}

function startDrawing() {
    window.requestAnimationFrame(step);
}

function getPingLists() {
    return {
        allCountries,
        pingedCountries,
        unpingedCountries
    };
}

function setSettings(set) {
    settings = set;
}

function countryIsActive(countryName) {
    if (settings.includeStates) {
        return countryName != 'US';
    } else {
        return countryName.length == 2;
    }
}

function setUniquePings(pings) {
    uniquePings = pings;
}

function setHeatmapRankings(rankings) {
    heatmapRankings = rankings;
}

function getCountryOnScreen(x, y) {
    let [longitude, latitude] = globe.projection.invert([x, y]);

    let rotation = globe.projection.rotate();
    let angle = geoDistance([longitude, latitude], [-rotation[0], -rotation[1]]);
        
    if (angle >= Math.PI / 2) return; // Don't draw anything non-visible

    for (let x=0; x<allCountries.length; x++) {
        let country = allCountries[x];
        if (!countryIsActive(country.properties.name)) continue;
        if (!geoContains(country, [longitude, latitude])) continue;
        return country.properties;
    }
}

function getLastFrameDuration() {
    return recentTimestamp - previousTimestamp;
}

function revealGlobe() {
    globe.canvas.style.opacity = 1;
}

export default {
    initializeGlobe, startDrawing, addPing, updatePingedCountries,
    getPingLists, setSettings, countryIsActive, setUniquePings,
    setHeatmapRankings, getCountryOnScreen, getLastFrameDuration,
    revealGlobe
};