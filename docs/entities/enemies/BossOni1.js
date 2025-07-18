import { BossOni } from './BossOni.js';

export class BossOni1 extends BossOni {
    constructor(game, x = null, y = null) {
        super(game, x, y);
        this.color = '#e74c3c'; // 赤系
        this._maxHP = 600;
        this._hp = 600;
        this.name = 'BossOni1';
        this.shootInterval = 90; // 1.5秒ごとに弾発射（60FPS想定）
        this.shootTimer = 0;
        
        // 視覚的サイズを設定
        this.setSize(400, 400);
        // 円形当たり判定の半径を設定
        this.setCircularCollision(150);
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

    // 移動を無効化
    updateMovement() {
        // 何もしない - 移動しない
        this._dx = 0;
        this._dy = 0;
    }

    shootAtPlayer() {
        const player = this.game.player;
        if (!player) return;
        // プレイヤー方向にcannon_ballタイプの弾を撃つ
        const x = this.x + this.width / 2;
        const y = this.y + this.height / 2;
        
        // ゲーム設定から弾の速度とダメージを取得
        const projectileSpeed = this.game.bossOni1ProjectileSpeed || 3;
        const projectileDamage = this.game.bossOni1ProjectileDamage || 15;
        
        console.log("BossOni1 shooting cannon ball projectile at:", x, y, "speed:", projectileSpeed, "damage:", projectileDamage);
        this.game.projectileManager.spawnCannonBallProjectile(x, y, player, projectileSpeed, projectileDamage);
    }

    // サイズ変更メソッド（将来的な拡張用）
    changeSize(newWidth, newHeight) {
        this.setSize(newWidth, newHeight);
        console.log(`BossOni1: Size changed to ${newWidth}x${newHeight}`);
    }
} 