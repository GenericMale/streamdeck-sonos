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
    const globalSettingsForm = document.getElementById('global-settings');
    const settingsForm = document.getElementById('settings');
    const sonos = new Sonos();

    const streamDeck = new StreamDeck();
    streamDeck.connect(port, pluginUUID, registerEvent, info, actionInfo);
    streamDeck.onConnected(() => {
        FormUtils.loadLocalization(streamDeck.appInfo.application.language ?? null, '../');
        FormUtils.addDynamicStyles(streamDeck.appInfo.colors);

        //use last part of uuid to check which inputs to show
        const action = streamDeck.actionInfo.action.split('.').pop();

        //show the items for the action
        [...settingsForm.querySelectorAll('.sdpi-item')]
            .filter((e) => e.dataset.actions.split(',').includes(action))
            .forEach((e) => e.classList.add('active'));

        //disable controls which aren't visible, so they don't get included in the FormData
        settingsForm.querySelectorAll('.sdpi-item input,select,textarea')
            .forEach((e) => e.disabled = e.closest('.sdpi-item.active') === null);

        //propagate form with persisted data
        const settings = streamDeck.actionInfo.payload.settings;
        FormUtils.setFormValue(settings, settingsForm);

        //watch for changes and store them
        settingsForm.addEventListener(
            'input',
            FormUtils.debounce(150, () => {
                const value = FormUtils.getFormValue(settingsForm);
                streamDeck.setSettings(value);
            })
        );

        streamDeck.getGlobalSettings().then((globalSettings) => {
            //propagate form with persisted data
            FormUtils.setFormValue(globalSettings, globalSettingsForm);

            //watch for changes and store them
            globalSettingsForm.addEventListener(
                'input',
                FormUtils.debounce(150, () => {
                    const value = FormUtils.getFormValue(globalSettingsForm);
                    streamDeck.setGlobalSettings(value);
                })
            );

            sonos.connect(globalSettings.host, parseInt(globalSettings.port) || 1400);

            if(action === 'playfavorites') {
                sonos.browse(Sonos.BROWSE_TYPE.SONOS_FAVORITES).then((items) => {
                    const favorite = settings.favorite ? JSON.parse(settings.favorite) : null;
                    items.forEach((item) => {
                        const select = document.getElementById('favorites');
                        const option = document.createElement('option');
                        option.value = JSON.stringify(item);
                        option.selected = favorite && favorite.uri === item.uri;
                        option.innerHTML = item.title;
                        select.appendChild(option);
                    });
                })
            }
        });
    })
}
