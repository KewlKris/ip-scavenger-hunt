import {select, geoOrthographic, geoPath, drag, scaleLinear, geoCircle, geoDistance, geoInterpolate} from 'd3';
import countries_url from '../countries.tiny.geojson';
import states_url from '../states.tiny.geojson';

const PING_SPEED = 3000;

let geojson, globe, location, allCountries, pingedCountries, unpingedCountries, pings;

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
        if (countries.indexOf(country.properties.name) != -1 && country.properties.name != 'US') {
            // This country has been pinged
            pingedCountries.push(country);
        } else {
            // This country has not been pinged
            unpingedCountries.push(country);
        }
    });
}

async function initializeGlobe() {
    pings = [];

    let promises = [loadGeoJSON(), updateLocation()];

    let canvas = select('#globe').node();
    let context = canvas.getContext('2d');
    let projection = geoOrthographic().scale(170);
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

    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw oceans
    context.fillStyle = '#9aa7b5';
    context.beginPath();
    generator({type: 'Sphere'});
    context.fill();
    context.closePath();

    // Draw unpinged countries
    context.lineWidth = 0.6;
    context.strokeStyle = '#AAA';
    context.fillStyle = '#EEE';
    context.beginPath();
    unpingedCountries.forEach(country => generator({type: 'Feature', geometry: country.geometry}));
    context.fill();
    context.stroke();
    context.closePath();

    // Draw pinged countries
    context.fillStyle = '#2874ed';
    context.beginPath();
    pingedCountries.forEach(country => generator({type: 'Feature', geometry: country.geometry}));
    context.fill();
    context.stroke();
    context.closePath();

    // Draw pings
    drawPings();

    // Draw location
    drawLocation();
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
    context.closePath();
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
            //console.log('Expiring ping!');
            //console.log(ping.endTime, time, ping.endTime - time);
            pings.splice(x, 1);
            x--;
            continue;
        }

        // Draw this ping
        let progress = (time < ping.startTime + ping.travelTime) ? (time - ping.startTime) / ping.travelTime : (ping.endTime - time) / ping.travelTime;
        let [long, lat] = ping.interpolator(progress);
        /*
        let startLat = ping.startPos.latitude;
        let startLong = ping.startPos.longitude;
        let endLat = ping.targetPos.latitude;
        let endLong = ping.targetPos.longitude;
        */
        let circle = geoCircle().center([long, lat]).radius(1)();
        generator.context(context)(circle);
        //generator({type: 'Feature', geometry: {type: 'LineString', coordinates: [[startLong, startLat], [endLong, endLat]]}});
    }
    context.fill();
    //context.stroke();
    context.closePath();
}

function updateLocation() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition((pos) => {
            location = {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude
            };
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


function step(timestamp) {
    drawGlobe(timestamp);
    window.requestAnimationFrame(step);
}

function startDrawing() {
    window.requestAnimationFrame(step);
}

export default {initializeGlobe, startDrawing, addPing, updatePingedCountries};