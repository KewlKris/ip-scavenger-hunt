import globe from './globe';

(async () => {
    // Perform initial setup
    await Promise.all([globe.initializeGlobe()]);
    globe.startDrawing();
})();