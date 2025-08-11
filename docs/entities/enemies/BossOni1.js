import { BossOni } from './BossOni.js';

export class BossOni1 extends BossOni {
    constructor(game, x = null, y = null) {
        super(game, x, y);
        this.color = '#e74c3c'; // 赤系
        this._maxHP = 600;
        this._hp = 600;
        this.name = 'BossOni1';
        
        // 弾発射の基本設定
        this.baseShootInterval = 60; // 基本発射間隔（1秒ごと）
        this.minShootInterval = 40; // 最小発射間隔（0.33秒ごと）
        this.shootTimer = 0;
        this.projectileTypeIndex = 0; // 弾の種類を管理
        this.projectileTypes = ['cannon_ball', 'black_ball', 'red_ball']; // 3種類の弾
        
        // 体力に応じた攻撃強化の設定
        this.attackPhases = [
            { hpThreshold: 0.8, intervalMultiplier: 1.0, projectileCount: 1 },    // 80%以上: 通常
            { hpThreshold: 0.6, intervalMultiplier: 0.8, projectileCount: 1 },    // 60-80%: 1.25倍速
            { hpThreshold: 0.4, intervalMultiplier: 0.6, projectileCount: 2 },    // 40-60%: 1.67倍速、2発同時
            { hpThreshold: 0.2, intervalMultiplier: 0.4, projectileCount: 2 },    // 20-40%: 2.5倍速、2発同時
            { hpThreshold: 0.0, intervalMultiplier: 0.3, projectileCount: 3 }     // 20%以下: 3.33倍速、3発同時
        ];
        
        // 視覚的サイズを設定
        this.setSize(400, 400);
        // 円形当たり判定の半径を設定
        this.setCircularCollision(150);
    }

    update() {
        // 親クラスの更新処理を呼び出し
        super.update();
        
        // 現在の体力比率を計算
        const currentHPRatio = this._hp / this._maxHP;
        
        // 現在の攻撃フェーズを取得
        const currentPhase = this.getCurrentAttackPhase(currentHPRatio);
        
        // 発射間隔を計算（ランダム性を含む）
        const currentShootInterval = this.calculateShootInterval(currentPhase);
        
        // 弾発射ロジック
        this.shootTimer++;
        if (this.shootTimer >= currentShootInterval) {
            this.shootTimer = 0;
            this.shootAtPlayer(currentPhase);
        }
    }

    // 現在の攻撃フェーズを取得
    getCurrentAttackPhase(hpRatio) {
        for (let i = this.attackPhases.length - 1; i >= 0; i--) {
            if (hpRatio > this.attackPhases[i].hpThreshold) {
                return this.attackPhases[i];
            }
        }
        return this.attackPhases[this.attackPhases.length - 1]; // 最後のフェーズ
    }

    // 発射間隔を計算（ランダム性を含む）
    calculateShootInterval(phase) {
        const baseInterval = this.baseShootInterval * phase.intervalMultiplier;
        const randomVariation = baseInterval * 0.2; // 20%のランダム変動
        const randomOffset = (Math.random() - 0.5) * randomVariation;
        
        return Math.max(this.minShootInterval, baseInterval + randomOffset);
    }

    // 移動を無効化
    updateMovement() {
        // 何もしない - 移動しない
        this._dx = 0;
        this._dy = 0;
    }

    shootAtPlayer(phase) {
        const player = this.game.player;
        if (!player) return;
        
        const x = this.x + this.width / 2;
        const y = this.y + this.height / 2;
        
        // フェーズに応じた弾の数を発射
        for (let i = 0; i < phase.projectileCount; i++) {
            // 複数発射時は少しずらした位置から発射
            const offsetX = x + (Math.random() - 0.5) * 50;
            const offsetY = y + (Math.random() - 0.5) * 50;
            
            // 現在の弾の種類を取得
            const currentProjectileType = this.projectileTypes[this.projectileTypeIndex];
            
            // 弾の種類に応じて速度とダメージを設定
            let projectileSpeed, projectileDamage;
            
            switch (currentProjectileType) {
                case 'cannon_ball':
                    projectileSpeed = this.game.bossOni1ProjectileSpeed || 3;
                    projectileDamage = this.game.bossOni1ProjectileDamage || 15;
                    console.log(`BossOni1 shooting cannon ball projectile at:`, offsetX, offsetY, "speed:", projectileSpeed, "damage:", projectileDamage, "phase:", phase);
                    this.game.projectileManager.spawnCannonBallProjectile(offsetX, offsetY, player, projectileSpeed, projectileDamage);
                    break;
                    
                case 'black_ball':
                    projectileSpeed = 8; // 高速
                    projectileDamage = 10; // 低ダメージ
                    console.log(`BossOni1 shooting black ball projectile at:`, offsetX, offsetY, "speed:", projectileSpeed, "damage:", projectileDamage, "phase:", phase);
                    this.game.projectileManager.spawnBlackBallProjectile(offsetX, offsetY, player, projectileSpeed, projectileDamage);
                    break;
                    
                case 'red_ball':
                    projectileSpeed = 5; // 中程度の速度
                    projectileDamage = 12; // 中程度のダメージ
                    console.log(`BossOni1 shooting red ball projectile at:`, offsetX, offsetY, "speed:", projectileSpeed, "damage:", projectileDamage, "phase:", phase);
                    this.game.projectileManager.spawnRedBallProjectile(offsetX, offsetY, player, projectileSpeed, projectileDamage);
                    break;
            }
            
            // 次の弾の種類に進む
            this.projectileTypeIndex = (this.projectileTypeIndex + 1) % this.projectileTypes.length;
        }
    }

    // 体力が減った時の処理（攻撃強化のトリガー）
    takeDamage(damage) {
        super.takeDamage(damage);
        
        // 体力比率を計算
        const currentHPRatio = this._hp / this._maxHP;
        const previousHPRatio = (this._hp + damage) / this._maxHP;
        
        // フェーズが変わった時のログ出力
        const currentPhase = this.getCurrentAttackPhase(currentHPRatio);
        const previousPhase = this.getCurrentAttackPhase(previousHPRatio);
        
        if (currentPhase !== previousPhase) {
            console.log(`BossOni1: Attack phase changed! HP: ${Math.round(currentHPRatio * 100)}%, Phase: ${JSON.stringify(currentPhase)}`);
        }
    }

    // サイズ変更メソッド（将来的な拡張用）
    changeSize(newWidth, newHeight) {
        this.setSize(newWidth, newHeight);
        console.log(`BossOni1: Size changed to ${newWidth}x${newHeight}`);
    }
} 