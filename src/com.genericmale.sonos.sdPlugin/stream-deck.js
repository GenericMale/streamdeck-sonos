/**
 * @class StreamDeck
 * StreamDeck object containing all required code to establish
 * communication with SD-Software and the Property Inspector
 * 
 *  UPDATE 1: updated with events to support StreamDeck+ (dialDown, dialRotate, dialUp, touchTap)
 */
class StreamDeck {
    port;
    uuid;
    messageType;
    appInfo;
    actionInfo;

    websocket;
    eventList = new Map();

    /**
     * Connect to Stream Deck
     * @param port
     * @param pluginUUID
     * @param registerEvent
     * @param info
     * @param actionInfo
     */
    connect(port, pluginUUID, registerEvent, info, actionInfo) {
        this.port = port;
        this.uuid = pluginUUID;
        this.messageType = registerEvent;
        this.appInfo = JSON.parse(info);
        this.actionInfo = actionInfo ? JSON.parse(actionInfo) : null;

        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }

        this.websocket = new WebSocket(`ws://127.0.0.1:${this.port}`);

        this.websocket.onopen = () => {
            const json = {
                event: this.messageType,
                uuid: this.uuid,
            };

            this.websocket.send(JSON.stringify(json));

            this.emit('connected', {
                connection: this.websocket,
                port: this.port,
                uuid: this.uuid,
                actionInfo: this.actionInfo,
                appInfo: this.appInfo,
                messageType: this.messageType,
            });
        };

        this.websocket.onerror = (evt) => {
            const error = `WEBSOCKET ERROR: ${evt}, ${evt.data}, ${evt.code}`;
            console.warn(error);
            this.logMessage(error);
        };

        this.websocket.onclose = (evt) => {
            console.warn('WEBSOCKET CLOSED:', evt);
        };

        this.websocket.onmessage = (evt) => {
            const data = evt?.data ? JSON.parse(evt.data) : {};
            const {action, event} = data;

            if (event && event !== '') {
                this.emit(event, data);
                if (action && action !== '') {
                    this.emit(`${action}.${event}`, data);
                }
            }
        };
    }

    /**
     * Register for an event send by the Stream Deck application
     */
    on(name, fn) {
        if (!this.eventList.has(name)) {
            const subscribers = new Set();

            const sub = (fn) => {
                subscribers.add(fn);
                return () => subscribers.delete(fn);
            };

            const pub = (data) => subscribers.forEach((fn) => {
                try {
                    Promise.resolve(fn(data)).catch((e) => {
                        this.showAlert(data.context);
                        console.error(e);
                    });
                } catch (e) {
                    this.showAlert(data.context);
                    console.error(e);
                }
            });
            const pubSub = Object.freeze({pub, sub});
            this.eventList.set(name, pubSub);
        }

        return this.eventList.get(name).sub(fn);
    }

    /**
     * @private
     */
    emit(name, data) {
        return this.eventList.has(name) && this.eventList.get(name).pub(data);
    }

    /**
     * Send JSON payload to StreamDeck
     * @private
     */
    send(event, context, payload, additionalData) {
        if (this.websocket) {
            try {
                const data = Object.assign({}, {event, context, payload}, additionalData);
                this.websocket.send(JSON.stringify(data));
            } catch (e) {
                console.log('WEBSOCKET EXCEPTION:', e);
            }
        }
    }

    /**
     * Save the actions's persistent data.
     * @param settings
     * @param context
     */
    setSettings(settings, context) {
        this.send('setSettings', context || this.uuid, settings);
    }

    /**
     * Request the actions's persistent data
     * @param context
     * @param timeout
     */
    getSettings(context, timeout) {
        return new Promise((resolve, reject) => {
            const ctx = context || this.uuid;
            this.send('getSettings', ctx);
            const unsub = this.on('didReceiveSettings', (event) => {
                if (event.context === ctx) {
                    resolve(event.payload.settings);
                    unsub();
                    clearTimeout(handle);
                }
            });
            const handle = setTimeout(() => {
                reject();
                unsub();
            }, timeout || 5000);
        });
    }

    /**
     * Save the plugin's persistent data
     * @param globalSettings
     */
    setGlobalSettings(globalSettings) {
        this.send('setGlobalSettings', this.uuid, globalSettings);
    }

    /**
     * Request the plugin's persistent data
     */
    getGlobalSettings(timeout) {
        return new Promise((resolve, reject) => {
            this.send('getGlobalSettings', this.uuid);
            const unsub = this.on('didReceiveGlobalSettings', (event) => {
                resolve(event.payload.settings);
                unsub();
                clearTimeout(handle);
            });
            const handle = setTimeout(() => {
                reject();
                unsub();
            }, timeout || 5000);
        });
    }

    /**
     * Opens a URL in the default web browser
     * @param url
     */
    openUrl(url) {
        this.send('openUrl', this.uuid, {url});
    }

    /**
     * Write to log file
     * @param message
     */
    logMessage(message) {
        this.send('logMessage', this.uuid, {message});
    }

    /**
     * Set the title of the actions's key
     * @param context
     * @param title
     * @param target
     * @param state
     */
    setTitle(title, target, state, context) {
        this.send('setTitle', context || this.uuid, {
            title,
            target: target || 0,
            state
        });
    }

    /**
     * Set the actions key image
     * @param context
     * @param image
     * @param target
     * @param state
     */
    setImage(image, target, state, context) {
        this.send('setImage', context || this.uuid, {
            image,
            target: target || 0,
            state
        });
    }

    /**
     * Display alert triangle on actions key
     * @param context
     */
    showAlert(context) {
        this.send('showAlert', context || this.uuid);
    }

    /**
     * Display ok check mark on actions key
     * @param context
     */
    showOk(context) {
        this.send('showOk', context || this.uuid);
    }

    /**
     * Set the state of the actions
     * @param context
     * @param state
     */
    setState(state, context) {
        this.send('setState', context || this.uuid, {state});
    }

    /**
     * Switch the active profile
     * @param profile
     * @param device
     */
    switchToProfile(profile, device) {
        this.send('switchToProfile', this.uuid, {profile}, {device});
    }

    /**
     * Send payload to property inspector
     * @param action
     * @param payload
     */
    sendToPropertyInspector(payload, action) {
        this.send('sendToPropertyInspector', this.uuid, payload, {
            action: action || this.actionInfo?.action
        });
    }

    /**
     * Send payload from the property inspector to the plugin
     * @param payload
     * @param action
     */
    sendToPlugin(payload, action) {
        this.send('sendToPlugin', this.uuid, payload, {
            action: action || this.actionInfo?.action
        });
    }

    /**
     * Set an action image from a URL and optionally add some text to it
     */
    setImageURL(imageURL, texts, titleParameters, context) {
        const size = 72;
        const padding = 5; //TODO: make padding configurable

        return new Promise((resolve, reject) => {
            if(!imageURL) reject();

            const image = new Image();
            image.onerror = reject;
            image.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.height = size;
                canvas.width = size;

                ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

                if(texts) {
                    ctx.textBaseline = 'top';
                    ctx.textAlign = 'center';
                    ctx.shadowColor = "#000000";
                    ctx.shadowOffsetX = 1;
                    ctx.shadowOffsetY = 1;

                    if(titleParameters) {
                        const fontStyle = titleParameters.fontStyle === 'Regular' ? '' : titleParameters.fontStyle;
                        ctx.font = `${fontStyle} ${titleParameters.fontSize}pt ${titleParameters.fontFamily || 'Arial'}`;
                        ctx.fillStyle = titleParameters.titleColor;
                    }

                    if (typeof texts === 'string')
                        texts = {top: texts};
                    if(texts.top)
                        ctx.fillText(texts.top, canvas.width / 2, padding);
                    if(texts.middle)
                        ctx.fillText(texts.middle, canvas.width / 2, (canvas.height - titleParameters.fontSize) / 2);
                    if(texts.bottom)
                        ctx.fillText(texts.bottom, canvas.width / 2, canvas.height - titleParameters.fontSize - padding);
                }

                this.setImage(canvas.toDataURL('image/png'), 0, null, context);
                resolve();
            };
            image.src = imageURL;
        });
    }

    /**
     * Registers a callback function for when Stream Deck is connected
     */
    onConnected(fn) {
        this.on('connected', (jsn) => fn(jsn));
        return this;
    }

    /**
     * Registers a callback function for the didReceiveGlobalSettings event, which fires when calling getGlobalSettings
     */
    onDidReceiveGlobalSettings(fn) {
        this.on('didReceiveGlobalSettings', (jsn) => fn(jsn));
        return this;
    }

    /**
     * Registers a callback function for the deviceDidConnect event, which fires when a device is plugged in
     */
    onDeviceDidConnect(fn) {
        this.on('deviceDidConnect', (jsn) => fn(jsn));
        return this;
    }

    /**
     * Registers a callback function for the deviceDidDisconnect event, which fires when a device is unplugged
     */
    onDeviceDidDisconnect(fn) {
        this.on('deviceDidDisconnect', (jsn) => fn(jsn));
        return this;
    }

    /**
     * Registers a callback function for the applicationDidLaunch event, which fires when the application starts
     */
    onApplicationDidLaunch(fn) {
        this.on('applicationDidLaunch', (jsn) => fn(jsn));
        return this;
    }

    /**
     * Registers a callback function for the applicationDidTerminate event, which fires when the application exits
     */
    onApplicationDidTerminate(fn) {
        this.on('applicationDidTerminate', (jsn) => fn(jsn));
        return this;
    }

    /**
     * Registers a callback function for the systemDidWakeUp event, which fires when the computer wakes
     */
    onSystemDidWakeUp(fn) {
        this.on('systemDidWakeUp', (jsn) => fn(jsn));
        return this;
    }
}

/**
 * @class Action
 * A Stream Deck plugin action, where you can register callback functions for different events
 */
class Action {
    streamDeck;
    action;
    context;

    constructor(streamDeck, action, context) {
        this.streamDeck = streamDeck;
        this.action = action
        this.context = context;

        //action events
        this.streamDeck.en(`${this.action}.dialDown`, (event) => this.onDialDown(event));
        this.streamDeck.en(`${this.action}.dialRotate`, (event) => this.onDialRotate(event));
        this.streamDeck.en(`${this.action}.dialUp`, (event) => this.onDialUp(event));
        this.streamDeck.on(`${this.action}.didReceiveSettings`, (event) => this.onDidReceiveSettings(event));
        this.streamDeck.on(`${this.action}.keyDown`, (event) => this.onKeyDown(event));
        this.streamDeck.on(`${this.action}.keyUp`, (event) => this.onKeyUp(event));
        this.streamDeck.en(`${this.action}.touchTap`, (event) => this.onTouchTap(event));
        this.streamDeck.on(`${this.action}.willAppear`, (event) => this.onWillAppear(event));
        this.streamDeck.on(`${this.action}.willDisappear`, (event) => this.onWillDisappear(event));
        this.streamDeck.on(`${this.action}.titleParametersDidChange`, (event) => this.onTitleParametersDidChange(event));
        this.streamDeck.on(`${this.action}.propertyInspectorDidAppear`, (event) => this.onPropertyInspectorDidAppear(event));
        this.streamDeck.on(`${this.action}.propertyInspectorDidDisappear`, (event) => this.onPropertyInspectorDidDisappear(event));
        this.streamDeck.on(`${this.action}.sendToPlugin`, (event) => this.onSendToPlugin(event));
        this.streamDeck.on(`${this.action}.sendToPropertyInspector`, (event) => this.onSendToPropertyInspector(event));

        //global events
        this.streamDeck
            .onDidReceiveGlobalSettings((event) => this.onDidReceiveGlobalSettings(event))
            .onDeviceDidConnect((event) => this.onDeviceDidConnect(event))
            .onDeviceDidDisconnect((event) => this.onDeviceDidDisconnect(event))
            .onApplicationDidLaunch((event) => this.onApplicationDidLaunch(event))
            .onApplicationDidTerminate((event) => this.onApplicationDidTerminate(event))
            .onSystemDidWakeUp((event) => this.onSystemDidWakeUp(event));
    }

    /**
     * Callback function for the dialDown event, which fires when pushing a knob in
     */
    async onDialDown(event) {
    }

    /**
     * Callback function for the dialRotate event, which fires when twisting a knob
     */
    async onDialRotate(event) {
    }

    /**
     * Callback function for the dialUp event, which fires when releasing a knob after pushing the knob in
     */
    async onDialUp(event) {
    }

    /**
     * Callback function for the didReceiveSettings event, which fires when calling getSettings
     */
    async onDidReceiveSettings(event) {
    }

    /**
     * Callback function for the didReceiveGlobalSettings event, which fires when calling getGlobalSettings
     */
    async onDidReceiveGlobalSettings(event) {
    }

    /**
     * Callback function for the keyDown event, which fires when pressing a key down
     */
    async onKeyDown(event) {
    }

    /**
     * Callback function for the keyUp event, which fires when releasing a key
     */
    async onKeyUp(event) {
    }

    /**
     * Callback function for the touchTap event, which fires when touching or tapping the display on the SD+
     */
    async onTouchTap(event) {
    }

    /**
     * Callback function for the willAppear event, which fires when an action appears on they key
     */
    async onWillAppear(event) {
    }

    /**
     * Callback function for the willAppear event, which fires when an action appears on they key
     */
    async onWillDisappear(event) {
    }

    /**
     * Callback function for the titleParametersDidChange event, which fires when a user changes the key title
     */
    async onTitleParametersDidChange(event) {
    }

    /**
     * Callback function for the deviceDidConnect event, which fires when a device is plugged in
     */
    async onDeviceDidConnect(event) {
    }

    /**
     * Callback function for the deviceDidDisconnect event, which fires when a device is unplugged
     */
    async onDeviceDidDisconnect(event) {
    }

    /**
     * Callback function for the applicationDidLaunch event, which fires when the application starts
     */
    async onApplicationDidLaunch(event) {
    }

    /**
     * Callback function for the applicationDidTerminate event, which fires when the application exits
     */
    async onApplicationDidTerminate(event) {
    }

    /**
     * Callback function for the systemDidWakeUp event, which fires when the computer wakes
     */
    async onSystemDidWakeUp(event) {
    }

    /**
     * Callback function for the propertyInspectorDidAppear event, which fires when the property inspector is displayed
     */
    async onPropertyInspectorDidAppear(event) {
    }

    /**
     * Callback function for the propertyInspectorDidDisappear event, which fires when the property inspector is closed
     */
    async onPropertyInspectorDidDisappear(event) {
    }

    /**
     * Callback function for the sendToPlugin event, which fires when the property inspector uses the sendToPlugin api
     */
    async onSendToPlugin(event) {
    }

    /**
     * Callback function for the sendToPropertyInspector event, which fires when the plugin uses the sendToPropertyInspector api
     */
    async onSendToPropertyInspector(event) {
    }
}
