define(class extends PollingAction {
    async onKeyDown({payload: {state}}) {
        return state === 0 ?
            this.sonos.setMute(1) :
            this.sonos.setMute(0);
    }

    async refresh() {
        const {CurrentMute: muted} = await this.sonos.getMute();
        return this.streamDeck.setState(muted === '1' ? 1 : 0, this.context);
    }
});
