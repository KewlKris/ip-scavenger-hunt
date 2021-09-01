const fs = require('fs');
const JSZip = require('jszip');

const DATABASE_FOLDER = './database/';
const DATABASE_DESTINATION = './src/database.zip';

// Zip database folder
(async () => {
    console.log('Loading databases...');
    // Load the data
    let databases = await fs.promises.readdir(DATABASE_FOLDER);
    let data = await Promise.all(databases.map(database => fs.promises.readFile(DATABASE_FOLDER + database)));

    // Zip it
    let zip = new JSZip();
    databases.forEach((database, index) => {
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
})();