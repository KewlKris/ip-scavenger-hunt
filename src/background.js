import IP2Location from './ip2location';
import JSZip from 'jszip';
import database from './database.zip';


chrome.webRequest.onCompleted.addListener((event) => {
    console.log(event);
}, {urls: ['<all_urls>']});
