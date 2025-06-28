export class PlayerController {
    constructor(inputManager, cameraManager) {
        this.inputManager = inputManager;
        this.cameraManager = cameraManager;
    }

    updatePlayerMovement(player, deltaTime) {
        if (this.inputManager.isKeyPressed('w')) player.y -= player.constructor.SPEED;
        if (this.inputManager.isKeyPressed('s')) player.y += player.constructor.SPEED;
        if (this.inputManager.isKeyPressed('a')) player.x -= player.constructor.SPEED;
        if (this.inputManager.isKeyPressed('d')) player.x += player.constructor.SPEED;
        
        this.constrainPlayerToMap(player);
    }

    constrainPlayerToMap(player) {
        const { width: mapWidth, height: mapHeight } = this.cameraManager.getMapDimensions();
        player.x = Math.max(player.width / 2, Math.min(player.x, mapWidth - player.width / 2));
        player.y = Math.max(player.height / 2, Math.min(player.y, mapHeight - player.height / 2));
    }
} 