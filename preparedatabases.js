const fs = require('fs');

const DATABASE_FOLDER = './database/';
const DATABASE_DESTINATION = './src/database.bin';
const GEOJSON_COUNTRIES_DESTINATION = './src/countries.tiny.geojson';
const GEOJSON_STATES_DESTINATION = './src/states.tiny.geojson';

async function convertGeoJSON(name, data) {
    let json = JSON.parse(data.toString())
    let output = undefined;
    if (name.indexOf('countries') != -1) {
        // This is a country database
        output = GEOJSON_COUNTRIES_DESTINATION;

        // Strip unnecessary information
        json.features.forEach(country => {
            let {ISO_A2_EH, POSTAL, NAME} = country.properties;
    
            country.properties = {
                name: (POSTAL.length == 2) ? POSTAL : ISO_A2_EH,
                name_long: NAME
                //name: ADM0_A3_US, // 3 letter country code
                //ADMIN: ADMIN // Country name
            };
        });
    } else if (name.indexOf('states_province') != -1) {
        // This is a states database
        output = GEOJSON_STATES_DESTINATION;

        // Strip unnecessary information
        json.features.forEach(state => {
            let {iso_a2, name} = state.properties;

            if (iso_a2 != 'US') return; // Skip non-US states

            state.properties = {
                name: name,
                name_long: name
            }
        });
    }

    if (output) {
        await fs.promises.writeFile(output, JSON.stringify(json));
    }
}

(async () => {
    let promises = [];
    let databases = await fs.promises.readdir(DATABASE_FOLDER);
    let datas = await Promise.all(databases.map(database => fs.promises.readFile(DATABASE_FOLDER + database)));

    databases.forEach((database, index) => {
        let promise;
        if (database.endsWith('.BIN')) {
            promise = fs.promises.writeFile(DATABASE_DESTINATION, datas[index]);
        } else if (database.endsWith('.geojson')) {
            promise = convertGeoJSON(database, datas[index]);
        }

        if (promise) promises.push(promise);
    });

    // Wait for everything to finish
    await Promise.all(promises);
})();