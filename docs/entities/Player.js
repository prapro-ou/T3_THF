﻿import { Character } from './base/Character.js';
import { PlayerController } from '../components/PlayerController.js';
import { PlayerRenderer } from '../components/PlayerRenderer.js';
import { AmmoManager } from '../managers/AmmoManager.js';

/**
 * プレイヤークラス
 * 単一責任: プレイヤーの状態管理と行動
 * 継承: Characterから基本機能を継承
 */
export class Player extends Character {
    static SPEED = 3.5; // クラス定数として定義
    
    constructor(game, x, y, controller) {
        super(game, x, y, 80, 80, 'pink', 100);
        this.attackRadius = 80;
        this.controller = controller;
        this.renderer = new PlayerRenderer(game.renderer);
        this.ammoManager = new AmmoManager(this, 10);
        this.direction = 'down';
        this.isMoving = false;
        this.moveFrame = 0;
        
        // ammoManager初期化後にmaxAmmoを設定
        this.maxAmmo = 10;
    }

    // カプセル化: プロパティへのアクセスを制御
    get ammo() { return this.ammoManager.getAmmo(); }
    set ammo(value) { this.ammoManager.setAmmo(value); }
    
    get maxAmmo() { return this.ammoManager.getMaxAmmo(); }
    set maxAmmo(value) { this.ammoManager.setMaxAmmo(value); }
    
    get ammoRecoveryTimer() { return this.ammoManager.ammoRecoveryTimer; }
    get ammoRecoveryTime() { return this.ammoManager.ammoRecoveryTime; }

    // 多態性: 親クラスのメソッドをオーバーライド
    update(deltaTime) {
        this.controller.updatePlayerMovement(this, deltaTime);
        this.ammoManager.update(deltaTime);
        this.updateMovementState();
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

    // プライベートメソッド
    updateMovementState() {
        this.isMoving = this.controller.isMoving;
        if (this.isMoving) {
            this.moveFrame++;
        } else {
            this.moveFrame = 0;
        }
    }
}
//test