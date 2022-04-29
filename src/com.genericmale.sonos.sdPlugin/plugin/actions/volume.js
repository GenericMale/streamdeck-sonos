define(class extends SonosAction {
    async onKeyDown({payload: {settings}}) {
        return this.sonos.setVolume(settings.volume || 50);
    }
});
