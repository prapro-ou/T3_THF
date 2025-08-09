export class CameraManager {
    constructor(renderer) {
        this.renderer = renderer;
    }

    calcScroll(playerX, playerY) {
        const { width: viewWidth, height: viewHeight } = this.renderer.getViewDimensions();
        const { width: mapWidth, height: mapHeight } = this.renderer.getMapDimensions();
        
        // プレイヤーの中心座標を基準にカメラ位置を計算
        const playerCenterX = playerX + 40; // プレイヤーの幅の半分（80/2）
        const playerCenterY = playerY + 40; // プレイヤーの高さの半分（80/2）
        
        let scrollX = playerCenterX - viewWidth / 2;
        let scrollY = playerCenterY - viewHeight / 2;
        
        // スクロール範囲をマップサイズ内に制限
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