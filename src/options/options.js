let PORT;

window.onload = async () => {
    initializePort();
    document.getElementById('clearbutton').onclick = () => {
        chrome.storage.local.clear();
        sendMessage('settings-cleardata');
    };
};

function initializePort() {
    PORT = chrome.runtime.connect(undefined, {
        name: 'popup'
    });

    PORT.onMessage.addListener(msg => {
        let {event, data} = msg;
        switch(event) {
        }
    });
}

function sendMessage(event, data={}) {
    PORT.postMessage({event, data});
}