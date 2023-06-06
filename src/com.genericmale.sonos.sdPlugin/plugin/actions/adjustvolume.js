define(class extends SonosAction {
    async onDialDown({payload: {state}}) {
        return state === 0 ?
            this.sonos.setMute(1) :
            this.sonos.setMute(0);
    }
    async onDialRotate({payload: {settings, ticks}}) {
        const {CurrentVolume: volume} = await this.sonos.getVolume();
        return this.sonos.setvolume(parseInt(volume) + parseInt(ticks));
    }
});
