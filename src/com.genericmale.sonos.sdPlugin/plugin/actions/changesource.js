define(class extends SonosAction {
    async onKeyDown({payload: {settings}}) {
        if (settings.source === 'tv') {
            await this.sonos.setLocalTransport('x-sonos-htastream', ':spdif');
        } else if (settings.source === 'line_in') {
            await this.sonos.setLocalTransport('x-rincon-stream');
        } else {
            await this.sonos.setLocalTransport('x-rincon-queue', '#0');
        }

        if (settings.play === '1')
            return this.sonos.play();
    }
});
