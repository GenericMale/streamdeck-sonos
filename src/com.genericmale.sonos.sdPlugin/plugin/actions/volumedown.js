define(class extends SonosAction {
    async onKeyDown({payload: {settings}}) {
        const {CurrentVolume: volume} = await this.sonos.getVolume();
        return this.sonos.setVolume(parseInt(volume) - (parseInt(settings.volume) || 10));
    }
});
