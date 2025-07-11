import { BossOni } from './BossOni.js';

export class BossOni1 extends BossOni {
    constructor(game) {
        super(game);
        this.color = '#e74c3c'; // 赤系
        this._maxHP = 600;
        this._hp = 600;
        this.name = 'BossOni1';
        
        // 攻撃関連
        this.shootInterval = 90; // 1.5秒ごとに弾発射（60FPS想定）
        this.shootTimer = 0;
        this.attackPhase = 1; // 攻撃段階（1-3）
        
        // 特殊攻撃関連
        this.specialAttackTimer = 0;
        this.specialAttackInterval = 300; // 5秒ごとに特殊攻撃
        this.isInvulnerable = false;
        this.invulnerableTimer = 0;
        this.invulnerableDuration = 60; // 1秒間無敵
        
        // 弾幕攻撃関連
        this.bulletStormTimer = 0;
        this.bulletStormDuration = 180; // 3秒間弾幕
        this.isBulletStormActive = false;
        this.bulletStormInterval = 10; // 弾幕中の発射間隔
        
        // 衝撃波攻撃関連
        this.shockwaveTimer = 0;
        this.shockwaveInterval = 240; // 4秒ごとに衝撃波
        this.shockwaveRadius = 200;
        
        // 螺旋弾幕攻撃関連
        this.spiralTimer = 0;
        this.spiralInterval = 360; // 6秒ごとに螺旋弾幕
        this.isSpiralActive = false;
        this.spiralDuration = 120; // 2秒間螺旋弾幕
        this.spiralAngle = 0;
        
        // アニメーション関連
        this.animationTimer = 0;
        this.pulseScale = 1.0;
        this.originalWidth = this.width;
        this.originalHeight = this.height;
        
        // 移動パターン関連
        this.movementPattern = 'stationary'; // stationary（静止）をデフォルトに
        this.movementTimer = 0;
        this.movementChangeInterval = 600; // 10秒ごとに移動パターン変更
        this.circleRadius = 150;
        this.circleAngle = 0;
        this.originalX = this.x;
        this.originalY = this.y;
    }

    update() {
        // 親クラスの更新処理を呼び出し
        super.update();
        
        // 攻撃段階の更新
        this.updateAttackPhase();
        
        // 無敵状態の更新
        this.updateInvulnerability();
        
        // アニメーション更新
        this.updateAnimation();
        
        // 移動パターン更新
        this.updateMovementPattern();
        
        // 通常攻撃
        this.updateNormalAttack();
        
        // 特殊攻撃
        this.updateSpecialAttacks();
    }

    updateAttackPhase() {
        const hpPercentage = this._hp / this._maxHP;
        if (hpPercentage > 0.6) {
            this.attackPhase = 1;
        } else if (hpPercentage > 0.3) {
            this.attackPhase = 2;
        } else {
            this.attackPhase = 3;
        }
    }

    updateInvulnerability() {
        if (this.isInvulnerable) {
            this.invulnerableTimer++;
            if (this.invulnerableTimer >= this.invulnerableDuration) {
                this.isInvulnerable = false;
                this.invulnerableTimer = 0;
            }
        }
    }

    updateAnimation() {
        this.animationTimer++;
        
        // パルスアニメーション
        this.pulseScale = 1.0 + Math.sin(this.animationTimer * 0.1) * 0.05;
        this.width = this.originalWidth * this.pulseScale;
        this.height = this.originalHeight * this.pulseScale;
        
        // HPに応じた色変化
        const hpPercentage = this._hp / this._maxHP;
        if (hpPercentage > 0.6) {
            this.color = '#e74c3c'; // 赤
        } else if (hpPercentage > 0.3) {
            this.color = '#f39c12'; // オレンジ
        } else {
            this.color = '#e67e22'; // 濃いオレンジ
        }
    }

    updateMovementPattern() {
        // ほぼ移動しない（微細な動きのみ）
        this.movementTimer++;
        
        // 移動パターン変更（非常に長い間隔）
        if (this.movementTimer >= this.movementChangeInterval * 5) { // 5倍長く
            this.movementTimer = 0;
            // 移動パターンを'stationary'（静止）に固定
            this.movementPattern = 'stationary';
        }
        
        // 移動パターンに応じた移動（ほぼ静止）
        switch (this.movementPattern) {
            case 'stationary':
                this.stayStationary();
                break;
            case 'chase':
                this.moveTowards(this.game.player);
                break;
            case 'circle':
                this.moveInCircle();
                break;
            case 'retreat':
                this.moveAwayFromPlayer();
                break;
        }
    }

    stayStationary() {
        // ほぼ静止、微細な動きのみ
        const player = this.game.player;
        if (!player) return;
        
        // プレイヤーとの距離が非常に近い場合のみ微細な移動
        const dx = this.centerX - player.centerX;
        const dy = this.centerY - player.centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 50px以内にプレイヤーが来た場合のみ微細な後退
        if (distance < 50) {
            const moveSpeed = this.game.bossMovementSpeed || 0.1; // 開発者ツールで設定可能
            this.x += (dx / distance) * moveSpeed;
            this.y += (dy / distance) * moveSpeed;
        }
    }

    moveInCircle() {
        const player = this.game.player;
        if (!player) return;
        
        this.circleAngle += 0.02;
        const centerX = player.centerX;
        const centerY = player.centerY;
        
        this.x = centerX + Math.cos(this.circleAngle) * this.circleRadius - this.width / 2;
        this.y = centerY + Math.sin(this.circleAngle) * this.circleRadius - this.height / 2;
    }

    moveAwayFromPlayer() {
        const player = this.game.player;
        if (!player) return;
        
        const dx = this.centerX - player.centerX;
        const dy = this.centerY - player.centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const moveSpeed = this.speed * 0.5;
            this.x += (dx / distance) * moveSpeed;
            this.y += (dy / distance) * moveSpeed;
        }
    }

    updateNormalAttack() {
        if (this.isBulletStormActive || this.isSpiralActive) return; // 特殊攻撃中は通常攻撃をスキップ
        
        this.shootTimer++;
        let currentInterval = this.shootInterval;
        
        // 攻撃段階に応じて間隔を短縮
        switch (this.attackPhase) {
            case 1:
                currentInterval = 90; // 1.5秒
                break;
            case 2:
                currentInterval = 60; // 1秒
                break;
            case 3:
                currentInterval = 30; // 0.5秒
                break;
        }
        
        if (this.shootTimer >= currentInterval) {
            this.shootTimer = 0;
            this.shootAtPlayer();
        }
    }

    updateSpecialAttacks() {
        this.specialAttackTimer++;
        
        // 弾幕攻撃
        if (this.isBulletStormActive) {
            this.updateBulletStorm();
        } else if (this.specialAttackTimer >= this.specialAttackInterval) {
            this.startBulletStorm();
        }
        
        // 螺旋弾幕攻撃
        if (this.isSpiralActive) {
            this.updateSpiralAttack();
        } else {
            this.spiralTimer++;
            if (this.spiralTimer >= this.spiralInterval) {
                this.startSpiralAttack();
            }
        }
        
        // 衝撃波攻撃
        this.shockwaveTimer++;
        if (this.shockwaveTimer >= this.shockwaveInterval) {
            this.shockwaveTimer = 0;
            this.performShockwaveAttack();
        }
    }

    startBulletStorm() {
        this.isBulletStormActive = true;
        this.bulletStormTimer = 0;
        this.specialAttackTimer = 0;
        this.isInvulnerable = true;
        this.invulnerableTimer = 0;
        
        // 弾幕開始時のエフェクト
        this.game.particleManager.createExplosion(
            this.centerX, this.centerY, this.color
        );
    }

    updateBulletStorm() {
        this.bulletStormTimer++;
        
        // 弾幕中の弾発射
        if (this.bulletStormTimer % this.bulletStormInterval === 0) {
            this.shootBulletStorm();
        }
        
        // 弾幕終了
        if (this.bulletStormTimer >= this.bulletStormDuration) {
            this.isBulletStormActive = false;
            this.bulletStormTimer = 0;
        }
    }

    startSpiralAttack() {
        this.isSpiralActive = true;
        this.spiralTimer = 0;
        this.spiralAngle = 0;
        this.isInvulnerable = true;
        this.invulnerableTimer = 0;
        
        // 螺旋開始時のエフェクト
        this.game.particleManager.createExplosion(
            this.centerX, this.centerY, '#ff6b6b'
        );
    }

    updateSpiralAttack() {
        this.spiralTimer++;
        
        // 螺旋弾幕の発射
        if (this.spiralTimer % 5 === 0) {
            this.shootSpiralBullets();
        }
        
        // 螺旋終了
        if (this.spiralTimer >= this.spiralDuration) {
            this.isSpiralActive = false;
            this.spiralTimer = 0;
        }
    }

    shootSpiralBullets() {
        // 螺旋状に弾を発射（数を減らして遠距離化）
        for (let i = 0; i < 2; i++) {
            const angle = this.spiralAngle + (i * Math.PI * 2) / 2;
            const x = this.centerX;
            const y = this.centerY;
            
            const targetX = x + Math.cos(angle) * 400;
            const targetY = y + Math.sin(angle) * 400;
            
            const virtualTarget = {
                x: targetX,
                y: targetY,
                centerX: targetX,
                centerY: targetY
            };
            
            const speed = this.game.bossProjectileSpeed || 12;
            this.game.projectileManager.spawnEnemyProjectile(x, y, virtualTarget, speed, 18);
        }
        
        this.spiralAngle += 0.3;
    }

    shootBulletStorm() {
        const player = this.game.player;
        if (!player) return;
        
        // 4方向に弾を発射（数を減らして遠距離化）
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI * 2) / 4;
            const x = this.centerX;
            const y = this.centerY;
            
            // 角度に応じた方向ベクトル（より遠くまで）
            const targetX = x + Math.cos(angle) * 400;
            const targetY = y + Math.sin(angle) * 400;
            
            // 仮想的なターゲットを作成
            const virtualTarget = {
                x: targetX,
                y: targetY,
                centerX: targetX,
                centerY: targetY
            };
            
            const speed = this.game.bossProjectileSpeed || 12;
            this.game.projectileManager.spawnEnemyProjectile(x, y, virtualTarget, speed, 20);
        }
    }

    performShockwaveAttack() {
        const player = this.game.player;
        if (!player) return;
        
        // 衝撃波エフェクト
        this.game.particleManager.createExplosion(
            this.centerX, this.centerY, '#ff6b6b'
        );
        
        // プレイヤーとの距離を計算
        const dx = player.centerX - this.centerX;
        const dy = player.centerY - this.centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 衝撃波範囲内ならダメージ
        if (distance <= this.shockwaveRadius) {
            const damage = Math.floor(30 * (1 - distance / this.shockwaveRadius));
            player.health -= damage;
            
            // プレイヤーにエフェクト
            this.game.particleManager.createExplosion(
                player.centerX, player.centerY, '#ff6b6b'
            );
        }
    }

    shootAtPlayer() {
        const player = this.game.player;
        if (!player) return;
        
        // 攻撃段階に応じた弾数（数を減らして遠距離化）
        let bulletCount = 1;
        switch (this.attackPhase) {
            case 1:
                bulletCount = 1;
                break;
            case 2:
                bulletCount = 1; // 2から1に減らす
                break;
            case 3:
                bulletCount = 2; // 3から2に減らす
                break;
        }
        
        for (let i = 0; i < bulletCount; i++) {
            const x = this.centerX;
            const y = this.centerY;
            
            // 複数弾の場合は少しずらして発射
            const spread = (i - (bulletCount - 1) / 2) * 0.2;
            const angle = Math.atan2(player.centerY - y, player.centerX - x) + spread;
            
            const targetX = x + Math.cos(angle) * 400;
            const targetY = y + Math.sin(angle) * 400;
            
            const virtualTarget = {
                x: targetX,
                y: targetY,
                centerX: targetX,
                centerY: targetY
            };
            
            const speed = this.game.bossProjectileSpeed || 12;
            this.game.projectileManager.spawnEnemyProjectile(x, y, virtualTarget, speed, 15);
        }
    }

    // ダメージを受けた時の処理をオーバーライド
    takeDamage(damage) {
        if (this.isInvulnerable) return; // 無敵中はダメージを受けない
        
        super.takeDamage(damage);
        
        // ダメージを受けた時のエフェクト
        this.game.particleManager.createExplosion(
            this.centerX, this.centerY, this.color
        );
        
        // 低HP時に一時的な無敵状態
        if (this._hp < this._maxHP * 0.3 && !this.isInvulnerable) {
            this.isInvulnerable = true;
            this.invulnerableTimer = 0;
        }
    }

    // 描画をオーバーライドして無敵状態のエフェクトを追加
    draw(ctx, scrollX, scrollY) {
        if (this.isInvulnerable) {
            // 無敵中は点滅効果
            if (Math.floor(this.invulnerableTimer / 5) % 2 === 0) {
                return; // 描画をスキップ
            }
        }
        
        super.draw(ctx, scrollX, scrollY);
    }
} 