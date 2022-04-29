define(class extends SonosAction {
    async onKeyDown() {
        return this.sonos.next();
    }
});
