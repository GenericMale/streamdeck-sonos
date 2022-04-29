define(class extends PollingAction {
    async onKeyDown({payload: {state}}) {
        const {PlayMode: mode} = await this.sonos.getTransportSettings();
        if (mode === 'NORMAL' || mode === 'SHUFFLE_NOREPEAT')
            return this.sonos.setPlayMode(state === 0 ? 'SHUFFLE_NOREPEAT' : 'NORMAL');
        else if (mode === 'REPEAT_ALL' || mode === 'SHUFFLE')
            return this.sonos.setPlayMode(state === 0 ? 'SHUFFLE' : 'REPEAT_ALL');
        else if (mode === 'REPEAT_ONE' || mode === 'SHUFFLE_REPEAT_ONE')
            return this.sonos.setPlayMode(state === 0 ? 'SHUFFLE_REPEAT_ONE' : 'REPEAT_ONE');
    }

    async refresh() {
        const {PlayMode: mode} = await this.sonos.getTransportSettings();
        return this.streamDeck.setState(mode.indexOf('SHUFFLE') === 0 ? 1 : 0, this.context);
    }
});
