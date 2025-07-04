﻿import { Character } from './Character.js';
import { PlayerController } from '../components/PlayerController.js';
import { PlayerRenderer } from '../components/PlayerRenderer.js';
import { AmmoManager } from '../managers/AmmoManager.js';

export class Player extends Character {
    static SPEED = 3.5; // クラス定数として定義
    constructor(game, x, y, controller) {
        super(game, x, y, 80, 80, 'pink', 100);
        this.maxAmmo = 10;
        this.attackRadius = 80;
        this.controller = controller;
        this.renderer = new PlayerRenderer(game.renderer);
        this.ammoManager = new AmmoManager(this);
        this.direction = 'down';
        this.isMoving = false;
        this.moveFrame = 0;
    }

    update(deltaTime) {
        this.ammoManager.update(deltaTime);
        
        // UI更新
        this.game.uiManager.updateAmmo(this.ammoManager.getAmmo(), this.ammoManager.getMaxAmmo());

        // ここでdirection, isMoving, moveFrameを更新
        const prevX = this.x, prevY = this.y;
        this.controller.updatePlayerMovement(this, deltaTime);
        this.isMoving = (this.x !== prevX || this.y !== prevY);
        if (this.isMoving) this.moveFrame++;
        else this.moveFrame = 0;

        // 方向判定（例: コントローラーの入力から）
        // this.direction = 'up' | 'down' | 'left' | 'right';
    }

    draw(ctx, scrollX, scrollY) {
        this.renderer.drawPlayer(this, ctx, scrollX, scrollY);
    }

    reset() {
        const { width: mapWidth, height: mapHeight } = this.game.cameraManager.getMapDimensions();
        super.reset(mapWidth / 2, mapHeight / 2);
        this.ammoManager.reset();
    }

    setAttackRadius(radius) {
        this.attackRadius = radius;
    }

    getAttackRadius() {
        return this.attackRadius;
    }

    // AmmoManagerへの委譲
    get ammo() { return this.ammoManager.getAmmo(); }
    get ammoRecoveryTimer() { return this.ammoManager.ammoRecoveryTimer; }
    get ammoRecoveryTime() { return this.ammoManager.ammoRecoveryTime; }
}
//test