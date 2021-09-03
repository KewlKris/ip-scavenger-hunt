const fs = require('fs');
const JSZip = require('jszip');

const DATABASE_FOLDER = './database/';
const DATABASE_DESTINATION = './src/database.zip';
const GEOJSON_COUNTRIES_DESTINATION = './src/countries.tiny.geojson';
const GEOJSON_STATES_DESTINATION = './src/states.tiny.geojson';

async function prepareZip() {
    console.log('Loading databases...');
    // Load the data
    let databases = await fs.promises.readdir(DATABASE_FOLDER);
    let data = await Promise.all(databases.map(database => fs.promises.readFile(DATABASE_FOLDER + database)));

    // Zip it
    let zip = new JSZip();
    databases.forEach((database, index) => {
        if (!database.endsWith('.BIN')) {
            console.log(`Skipping ${database}`);
            return;
        }
        zip.file(database, data[index]);
        console.log(`Adding ${database} to archive.`);
    });

    // Create the archive
    console.log('Writing zip...');
    let stream = fs.createWriteStream(DATABASE_DESTINATION).on('finish', () => {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write('Finished writing zip!\n');
    });
    let archive = zip.generateNodeStream({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: {
            level: 9
        }
    }, status => {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(`Progress: ${status.percent.toFixed(1)}% | Zipping file: ${status.currentFile}`);
    });

    // Start the stream
    archive.pipe(stream);
}

/*
function convertGeoJSON() {
    console.log('Converting GeoJSON...');

    let geojsonPath = DATABASE_FOLDER + fs.readdirSync(DATABASE_FOLDER).filter(fileName => fileName.endsWith('.geojson'))[0];

    // Load the data
    let data = JSON.parse(fs.readFileSync(geojsonPath).toString());

    // Strip unnecessary information
    data.features.forEach(country => {
        let {ADM0_A3_US, ADMIN} = country.properties;

        country.properties = {
            ADM0_A3_US: ADM0_A3_US, // 3 letter country code
            ADMIN: ADMIN // Country name
        };
    });

    // Write the data
    fs.writeFileSync(GEOJSON_DESTINATION, JSON.stringify(data));

    console.log('Finished converting GeoJSON.');
}
*/

async function convertGeoJSON() {
    console.log('Converting GeoJSON...');

    let databases = await fs.promises.readdir(DATABASE_FOLDER);
    databases = databases.filter(database => database.endsWith('.geojson')); // Remove any non-geojson databases
    let data = await Promise.all(databases.map(database => fs.promises.readFile(DATABASE_FOLDER + database)));
    let jsons = data.map(result => JSON.parse(result.toString()));

    let promises = [];
    databases.forEach((database, index) => {
        let json = jsons[index];
        let output = undefined;
        if (database.indexOf('countries') != -1) {
            // This is a country database
            output = GEOJSON_COUNTRIES_DESTINATION;

            // Strip unnecessary information
            json.features.forEach(country => {
                let {ADM0_A3_US, ADMIN} = country.properties;
        
                country.properties = {
                    name: ADM0_A3_US, // 3 letter country code
                    //ADMIN: ADMIN // Country name
                };
            });
        } else if (database.indexOf('states_province')) {
            // This is a states database
            output = GEOJSON_STATES_DESTINATION;

            // Strip unnecessary information
            json.features.forEach(state => {
                let {iso_a2, name} = state.properties;

                if (iso_a2 != 'US') return; // Skip non-US states

                state.properties = {
                    name: name
                }
            });
        }

        if (output) {
            promises.push(fs.promises.writeFile(output, JSON.stringify(json)));
        }
    });

    await Promise.all(promises); // Wait until all file writing has been finished
    console.log('Finished converting GeoJSON.')
}

(async () => {
    await Promise.all([convertGeoJSON(), prepareZip()]);
})();