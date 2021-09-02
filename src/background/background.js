import IP2Location from './ip2location';
import JSZip from 'jszip';
import database from '../database.zip';

let LOADED = false;
let IPV4, IPV6;

let EVENT_BUFFER = [];

// Load the databass
(async () => {
    console.log('Started loading databases...');

    // Download the archive
    let response = await fetch(database);
    let archive = await response.arrayBuffer();

    // Load the archive
    let zip = new JSZip();
    await zip.loadAsync(archive);

    // Extract files
    let promises = [];
    let fileNames = Object.keys(zip.files);
    fileNames.forEach(fileName => {
        let file = zip.files[fileName];
        promises.push(file.async('arraybuffer'));
    });
    let fileDatas = await Promise.all(promises);

    // Locate databases
    fileNames.forEach((fileName, index) => {
        if (fileName.endsWith('.IPV6.BIN')) {
            // This is the IPv6 database file
            IPV6 = new IP2Location(fileDatas[index]);
        } else if (fileName.endsWith('.BIN')) {
            // This is the IPv4 database file
            IPV4 = new IP2Location(fileDatas[index]);
        } else if (fileName.endsWith('.geojson')) {
            // This is the geographic database
            GEOJSON = JSON.parse(new TextDecoder().decode(fileDatas[index]));
        }
    });

    if (!IPV4) console.warn('IPv4 Database not found!');
    if (!IPV6) console.warn('IPv6 database not found!');
    
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

function logConnection(ip) {
    if (!ip) return;
    let ipDatabase = (ip.indexOf(':') == -1) ? IPV4 : IPV6;

    let result = ipDatabase.getAll(ip);
    console.log(`Connected to ${ip} | Country: ${result.country_short} State: ${result.region} City: ${result.city}`);
}