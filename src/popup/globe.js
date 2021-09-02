import {select, geoOrthographic, geoPath} from 'd3';
import countries_url from '../countries.tiny.geojson';
import states_url from '../states.tiny.geojson';

let geojson, globe;

async function loadGeoJSON() {
    let [countries, states] = await Promise.all([fetch(countries_url), fetch(states_url)]);
    geojson = {countries: await countries.json(), states: await states.json()};
}

async function initializeGlobe() {
    await loadGeoJSON();

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
    
    globe = {canvas, context, projection, generator};
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

    // Draw land
    context.lineWidth = 0.6;
    context.strokeStyle = '#AAA';
    context.fillStyle = '#EEE';
    context.beginPath();
    generator({type: 'FeatureCollection', features: geojson.countries.features});
    context.fill();
    context.stroke();
    context.closePath();
}

function step(timestamp) {
    drawGlobe(timestamp);
    window.requestAnimationFrame(step);
}

function startDrawing() {
    window.requestAnimationFrame(step);
}

export default {initializeGlobe, startDrawing};