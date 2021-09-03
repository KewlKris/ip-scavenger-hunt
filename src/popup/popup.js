import globe from './globe';

window.onload = async () => {
    // Perform initial setup
    await Promise.all([globe.initializeGlobe()]);
    globe.startDrawing();

    chrome.runtime.onMessage.addListener((query, sender, sendResponse) => {
        globe.addPing(query.latitude, query.longitude);
        sendResponse();
    });
};