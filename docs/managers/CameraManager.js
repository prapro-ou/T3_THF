export class CameraManager {
    constructor(renderer) {
        this.renderer = renderer;
    }

    calcScroll(playerX, playerY) {
        const { width: viewWidth, height: viewHeight } = this.renderer.getViewDimensions();
        const { width: mapWidth, height: mapHeight } = this.renderer.getMapDimensions();
        
        let scrollX = playerX - viewWidth / 2;
        let scrollY = playerY - viewHeight / 2;
        scrollX = Math.max(0, Math.min(mapWidth - viewWidth, scrollX));
        scrollY = Math.max(0, Math.min(mapHeight - viewHeight, scrollY));
        
        return { scrollX, scrollY };
    }

    getViewDimensions() {
        return this.renderer.getViewDimensions();
    }

    getMapDimensions() {
        return this.renderer.getMapDimensions();
    }
} 