/**
 * This is the first function StreamDeck Software calls, when
 * establishing the connection to the plugin or the Property Inspector
 * @param {string} port - The socket's port to communicate with StreamDeck software.
 * @param {string} pluginUUID - A unique identifier, which StreamDeck uses to communicate with the plugin
 * @param {string} registerEvent - Identifies, if the event is meant for the property inspector or the plugin.
 * @param {string} info - Information about the host (StreamDeck) application
 * @param {string} actionInfo - Context is an internal identifier used to communicate to the host application.
 */
function connectElgatoStreamDeckSocket(port, pluginUUID, registerEvent, info, actionInfo) {
    const sonos = new Sonos();

    const streamDeck = new StreamDeck();
    streamDeck.connect(port, pluginUUID, registerEvent, info, actionInfo);
    streamDeck.onConnected(() => {
        streamDeck.getGlobalSettings().then((settings) => {
            sonos.connect(settings.host, parseInt(settings.port) || 1400);
        });
    })

    //load action implementations dynamically when the action becomes visible
    const loadedScripts = {};
    streamDeck.on('willAppear', (event) => {
        //use last part of uuid as filename
        const action = event.action.split('.').pop();

        const script = document.createElement('script');
        script.src = `./actions/${action}.js`;

        if (!loadedScripts[script.src]) {
            loadedScripts[script.src] = {name: event.action, context: event.context};
            document.documentElement.firstChild.appendChild(script);
        }
    });

    //action classes need to be registered using a call to define
    window.define = (actionClass) => {
        const scriptSrc = document.currentScript.src;
        const action = loadedScripts[scriptSrc];
        action.instance = new actionClass(streamDeck, action.name, action.context);
        action.instance.sonos = sonos;
    }
}

/**
 * Base Action holding a sonos connection.
 */
class SonosAction extends Action {
    sonos;
}

/**
 * Base Action to refresh a state with a basic poll interval stored in the refreshInterval action setting.
 */
class PollingAction extends SonosAction {
    settings;

    constructor(streamDeck, action, context) {
        super(streamDeck, action, context);

        this.visible = true;
        this.streamDeck.getSettings(this.context);
    }

    onDidReceiveSettings({payload: {settings}}) {
        this.settings = settings;

        const interval = parseInt(settings.refreshInterval);
        this.interval = isNaN(interval) ? 1 : interval;

        this.startPolling();
    }

    onWillAppear() {
        this.visible = true;
        this.startPolling();
    }

    onWillDisappear() {
        this.visible = false;
        clearTimeout(this.timer);
    }

    startPolling() {
        if (!this.visible)
            return;

        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }

        if (this.sonos.isConnected()) {
            this.refresh().then(() => {
                if (this.interval > 0) {
                    this.timer = setTimeout(() => this.startPolling(), this.interval * 1000);
                }
            });
        } else if (this.interval > 0) {
            this.timer = setTimeout(() => this.startPolling(), this.interval * 1000);
        }
    }

    async refresh() {
    }
}
