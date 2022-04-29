define(class extends SonosAction {
    async onKeyDown({payload: {settings}}) {
        const service = MusicService.parse(settings.uri);
        if (!service)
            throw new Error(`Invalid media URI "${settings.uri}"`);

        await this.sonos.setServiceURI(service.uri, service.metadata);

        if (settings.play === '1')
            return this.sonos.play();
    }
});
