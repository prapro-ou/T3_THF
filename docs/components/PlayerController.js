/**
 * プレイヤー制御クラス
 * 単一責任: プレイヤーの入力処理と移動制御
 */
export class PlayerController {
    constructor(inputManager, cameraManager) {
        this.inputManager = inputManager;
        this.cameraManager = cameraManager;
        this._isMoving = false;
    }

    // カプセル化: 移動状態へのアクセスを制御
    get isMoving() { return this._isMoving; }

    updatePlayerMovement(player, deltaTime) {
        this._isMoving = false;
        
        if (this.inputManager.isKeyPressed('w')) {
            player.y -= player.constructor.SPEED;
            player.direction = 'up';
            this._isMoving = true;
        }
        if (this.inputManager.isKeyPressed('s')) {
            player.y += player.constructor.SPEED;
            player.direction = 'down';
            this._isMoving = true;
        }
        if (this.inputManager.isKeyPressed('a')) {
            player.x -= player.constructor.SPEED;
            player.direction = 'left';
            this._isMoving = true;
        }
        if (this.inputManager.isKeyPressed('d')) {
            player.x += player.constructor.SPEED;
            player.direction = 'right';
            this._isMoving = true;
        }
        
        this.constrainPlayerToMap(player);
    }

    constrainPlayerToMap(player) {
        const { width: mapWidth, height: mapHeight } = this.cameraManager.getMapDimensions();
        // プレイヤーの左上座標を基準に制約を適用（中心ではなく実際の描画座標）
        player.x = Math.max(0, Math.min(player.x, mapWidth - player.width));
        player.y = Math.max(0, Math.min(player.y, mapHeight - player.height));
    }
}