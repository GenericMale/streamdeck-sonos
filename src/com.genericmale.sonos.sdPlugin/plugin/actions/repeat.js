define(class extends PollingAction {
    async onKeyDown({payload: {state}}) {
        const {PlayMode: mode} = await this.sonos.getTransportSettings()
        const shuffle = mode.indexOf('SHUFFLE') === 0;
        if (state === 0)
            return this.sonos.setPlayMode(shuffle ? 'SHUFFLE' : 'REPEAT_ALL');
        else if (state === 1)
            return this.sonos.setPlayMode(shuffle ? 'SHUFFLE_REPEAT_ONE' : 'REPEAT_ONE');
        else if (state === 2)
            return this.sonos.setPlayMode(shuffle ? 'SHUFFLE_NOREPEAT' : 'NORMAL');
    }

    async refresh() {
        const {PlayMode: mode} = await this.sonos.getTransportSettings();
        if (mode === 'NORMAL' || mode === 'SHUFFLE_NOREPEAT')
            return this.streamDeck.setState(0, this.context);
        else if (mode === 'REPEAT_ALL' || mode === 'SHUFFLE')
            return this.streamDeck.setState(1, this.context);
        else if (mode === 'REPEAT_ONE' || mode === 'SHUFFLE_REPEAT_ONE')
            return this.streamDeck.setState(2, this.context);
    }
});
