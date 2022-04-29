define(class extends SonosAction {
    constructor(streamDeck, action, context) {
        super(streamDeck, action, context);
        this.streamDeck.getSettings(this.context);
    }

    async onKeyDown({payload: {settings}}) {
        const favorite = JSON.parse(settings.favorite);
        if (favorite) {
            await this.sonos.setServiceURI(favorite.uri, favorite.metadata);
            if (settings.play === '1')
                return this.sonos.play();
        }
    }

    async onDidReceiveSettings({payload: {settings}}) {
        const favorite = JSON.parse(settings.favorite);
        if(favorite && settings.showAlbumArt === '1') {
            return this.streamDeck.setImageURL(favorite.albumArtURI, null, null, this.context);
        } else {
            return this.streamDeck.setImage(null, 0, null, this.context);
        }
    }
});
