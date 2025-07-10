import { BossOni } from './BossOni.js';

export class BossOni1 extends BossOni {
    constructor(game) {
        super(game);
        this.color = '#e74c3c'; // 赤系
        this._maxHP = 600;
        this._hp = 600;
        this.name = 'BossOni1';
        this.shootInterval = 90; // 1.5秒ごとに弾発射（60FPS想定）
        this.shootTimer = 0;
    }

    update() {
        // 親クラスの更新処理を呼び出し
        super.update();
        
        // 弾発射ロジック
        this.shootTimer++;
        if (this.shootTimer >= this.shootInterval) {
            this.shootTimer = 0;
            this.shootAtPlayer();
        }
    }

    shootAtPlayer() {
        const player = this.game.player;
        if (!player) return;
        // プレイヤー方向に弾を撃つ
        const x = this.x + this.width / 2;
        const y = this.y + this.height / 2;
        this.game.projectileManager.spawnEnemyProjectile(x, y, player, 6, 15);
    }
} 