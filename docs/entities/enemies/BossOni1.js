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
        this.projectileTypeIndex = 0; // 弾の種類を管理
        this.projectileTypes = ['cannon_ball', 'black_ball', 'red_ball', 'yellow_ball']; // 4種類の弾
        
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
        
        const x = this.x + this.width / 2;
        const y = this.y + this.height / 2;
        
        // 現在の弾の種類を取得
        const currentProjectileType = this.projectileTypes[this.projectileTypeIndex];
        
        // 弾の種類に応じて速度とダメージを設定
        let projectileSpeed, projectileDamage;
        
        switch (currentProjectileType) {
            case 'cannon_ball':
                projectileSpeed = this.game.bossOni1ProjectileSpeed || 3;
                projectileDamage = this.game.bossOni1ProjectileDamage || 15;
                console.log("BossOni1 shooting cannon ball projectile at:", x, y, "speed:", projectileSpeed, "damage:", projectileDamage);
                this.game.projectileManager.spawnCannonBallProjectile(x, y, player, projectileSpeed, projectileDamage);
                break;
                
            case 'black_ball':
                projectileSpeed = 8; // 高速
                projectileDamage = 10; // 低ダメージ
                console.log("BossOni1 shooting black ball projectile at:", x, y, "speed:", projectileSpeed, "damage:", projectileDamage);
                this.game.projectileManager.spawnBlackBallProjectile(x, y, player, projectileSpeed, projectileDamage);
                break;
                
            case 'red_ball':
                projectileSpeed = 5; // 中程度の速度
                projectileDamage = 12; // 中程度のダメージ
                console.log("BossOni1 shooting red ball projectile at:", x, y, "speed:", projectileSpeed, "damage:", projectileDamage);
                this.game.projectileManager.spawnRedBallProjectile(x, y, player, projectileSpeed, projectileDamage);
                break;
                
            case 'yellow_ball':
                projectileSpeed = 5; // 中程度の速度
                projectileDamage = 12; // 中程度のダメージ
                console.log("BossOni1 shooting yellow ball projectile at:", x, y, "speed:", projectileSpeed, "damage:", projectileDamage);
                this.game.projectileManager.spawnYellowBallProjectile(x, y, player, projectileSpeed, projectileDamage);
                break;
        }
        
        // 次の弾の種類に進む
        this.projectileTypeIndex = (this.projectileTypeIndex + 1) % this.projectileTypes.length;
    }

    // サイズ変更メソッド（将来的な拡張用）
    changeSize(newWidth, newHeight) {
        this.setSize(newWidth, newHeight);
        console.log(`BossOni1: Size changed to ${newWidth}x${newHeight}`);
    }
} 