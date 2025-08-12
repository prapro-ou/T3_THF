import { BossOni } from './BossOni.js';
import { SpriteSheet } from '../../utils/SpriteSheet.js';

/**
 * BossOni2: バイクに乗って突進を繰り返すボス（強化改良版）
 * - 多様な攻撃パターン
 * - 改善されたAI
 * - 強化された視覚効果
 * - 難易度調整機能
 * - 特殊能力
 */
export class BossOni2 extends BossOni {
    constructor(game, x = null, y = null) {
        try {
            console.log('BossOni2: Constructor called');
            super(game, x, y);
            console.log('BossOni2: Super constructor completed');
            
            this.color = '#3498db'; // 青系
            this._maxHP = 400; // HP増加
            this._hp = 400;
            this.name = 'BossOni2';
            // 視覚的サイズを設定
            this.setSize(120, 120);
            // 円形当たり判定の半径を設定
            this.setCircularCollision(40);

            // 状態管理（拡張）
            this.state = 'idle'; // idle, charge, dashing, recover, special_attack, rage_mode
            this.stateTimer = 0;
            this.dashDirection = { x: 0, y: 0 };
            this.dashSpeed = 18; // 突進速度向上
            this.dashDuration = 36; // 突進フレーム数（0.6秒@60fps）
            this.chargeDuration = 25; // 溜めフレーム数短縮（0.4秒）
            this.recoverDuration = 20; // クールダウン短縮（0.33秒）
            this.idleDuration = 45; // 待機短縮（0.75秒）
            this.currentDashFrame = 0;
            this.spriteDirection = 'right'; // 'left' or 'right'
            
            // 攻撃判定用
            this.hasHitPlayerThisDash = false;
            this.comboCount = 0; // コンボカウント
            this.maxCombo = 3; // 最大コンボ数

            // 新機能: 特殊攻撃
            this.specialAttackCooldown = 0;
            this.specialAttackMaxCooldown = 180; // 3秒
            this.rageModeThreshold = 0.3; // HP30%以下で怒りモード
            this.isRageMode = false;
            this.specialAttackActive = false;
            this.specialAttackCount = 0;
            this.specialAttackMaxCount = 3;

            // 新機能: 予測移動
            this.predictionLevel = 0.7; // プレイヤーの移動を予測するレベル
            this.lastPlayerPos = { x: 0, y: 0 };
            this.playerVelocity = { x: 0, y: 0 };
            
            // 中心座標の計算用
            this._centerX = 0;
            this._centerY = 0;

            // アニメーション用
            this.spriteSheet = null;
            this.initializeAnimation();

            // 突進エフェクト用（強化）
            this.dashParticles = [];
            this.particleTimer = 0;
            this.trailEffect = []; // 軌跡エフェクト
            this.screenShake = 0; // 画面シェイク効果
            
            // 新機能: 難易度調整
            this.difficulty = this.game.difficulty || 'normal';
            this.knockbackStrength = 18; // デフォルトのノックバック強度
            this.adjustDifficulty();
            
            // 怒りモードの初期化
            this.rageModeActivated = false;
            
            console.log('BossOni2: Constructor completed');
        } catch (error) {
            console.error('BossOni2: Constructor error:', error);
            throw error;
        }
    }

    // 中心座標のgetter
    get centerX() {
        return this.x + this.width / 2;
    }

    get centerY() {
        return this.y + this.height / 2;
    }

    adjustDifficulty() {
        switch (this.difficulty) {
            case 'easy':
                this.dashSpeed = 14;
                this._maxHP = 300;
                this._hp = 300;
                this.specialAttackMaxCooldown = 240;
                this.knockbackStrength = 15; // 弱いノックバック
                break;
            case 'normal':
                this.dashSpeed = 18;
                this._maxHP = 400;
                this._hp = 400;
                this.specialAttackMaxCooldown = 180;
                this.knockbackStrength = 18; // 通常のノックバック
                break;
            case 'hard':
                this.dashSpeed = 22;
                this._maxHP = 500;
                this._hp = 500;
                this.specialAttackMaxCooldown = 120;
                this.predictionLevel = 0.9;
                this.knockbackStrength = 22; // 強いノックバック
                break;
            case 'extreme':
                this.dashSpeed = 26;
                this._maxHP = 600;
                this._hp = 600;
                this.specialAttackMaxCooldown = 90;
                this.predictionLevel = 1.0;
                this.rageModeThreshold = 0.5; // HP50%以下で怒りモード
                this.knockbackStrength = 28; // 非常に強いノックバック
                break;
        }
    }

    initializeAnimation() {
        // bike_oniのスプライトシートを直接読み込み
        console.log('BossOni2: Loading bike_oni sprite sheet...');
        
        fetch('assets/characters/oni/bike_oni/bike_oni.json')
            .then(res => {
                if (!res.ok) throw new Error('JSON not found');
                console.log('BossOni2: JSON loaded successfully');
                return res.json();
            })
            .then(data => {
                console.log('BossOni2: JSON data:', data);
                console.log('BossOni2: Frames array length:', data.frames.length);
                
                let retryCount = 0;
                const maxRetries = 10;
                
                function tryLoadImage() {
                    const img = new Image();
                    img.src = 'assets/characters/oni/bike_oni/bike_oni.png?' + new Date().getTime();
                    console.log('BossOni2: Trying to load image, attempt', retryCount + 1, 'src:', img.src);
                    
                    img.onload = () => {
                        console.log('BossOni2: Image loaded successfully');
                        console.log('BossOni2: Image dimensions:', img.width, 'x', img.height);
                        this.spriteSheet = new SpriteSheet(img, data);
                        console.log('BossOni2: SpriteSheet created, frameNames:', this.spriteSheet.frameNames);
                        console.log('BossOni2: Available frames:', Object.keys(this.spriteSheet.frames));
                        this.spriteSheet.setFrameDelay(8); // デフォルトのアニメーション速度
                        this.spriteSheet.startAnimation();
                        console.log('BossOni2: SpriteSheet initialized');
                    };
                    
                    img.onerror = () => {
                        console.log('BossOni2: Image load failed, attempt', retryCount + 1, 'src:', img.src);
                        retryCount++;
                        if (retryCount < maxRetries) {
                            setTimeout(() => tryLoadImage.call(this), 500);
                        } else {
                            console.log('BossOni2: Image load failed after', maxRetries, 'attempts');
                            this.spriteSheet = null;
                        }
                    };
                }
                
                tryLoadImage.call(this);
            })
            .catch(err => {
                console.log('BossOni2: JSON fetch failed:', err);
                this.spriteSheet = null;
            });
    }

    update() {
        // 怒りモードチェック
        this.checkRageMode();
        
        // 特殊攻撃クールダウン更新
        if (this.specialAttackCooldown > 0) {
            this.specialAttackCooldown--;
        }
        
        // デバッグ用: パーティクル状態をログ出力
        if (this.stateTimer % 60 === 0) { // 1秒ごとにログ出力
            console.log(`BossOni2 Debug - State: ${this.state}, Timer: ${this.stateTimer}, Particles: ${this.dashParticles.length}, Trail: ${this.trailEffect.length}, Rage: ${this.isRageMode}, Special: ${this.specialAttackActive}`);
        }

        // アニメーション更新
        if (this.spriteSheet) {
            this.spriteSheet.updateAnimation();
            
            // 状態に応じてアニメーション速度を調整
            switch (this.state) {
                case 'idle':
                    this.spriteSheet.setFrameDelay(this.isRageMode ? 8 : 12);
                    break;
                case 'charge':
                    this.spriteSheet.setFrameDelay(this.isRageMode ? 4 : 6);
                    break;
                case 'dashing':
                    this.spriteSheet.setFrameDelay(this.isRageMode ? 2 : 3);
                    break;
                case 'recover':
                    this.spriteSheet.setFrameDelay(this.isRageMode ? 6 : 10);
                    break;
                case 'special_attack':
                    this.spriteSheet.setFrameDelay(2);
                    break;
            }
        }

        // パーティクル更新
        this.updateParticles();
        this.updateTrailEffect();
        this.updateScreenShake();

        // 状態ごとの処理
        switch (this.state) {
            case 'idle':
                this.stateTimer++;
                this._dx = 0;
                this._dy = 0;
                
                // 特殊攻撃の実行判定
                if (this.specialAttackCooldown <= 0 && Math.random() < 0.3) {
                    this.state = 'special_attack';
                    this.stateTimer = 0;
                    this.executeSpecialAttack();
                } else if (this.stateTimer > this.idleDuration) {
                    this.state = 'charge';
                    this.stateTimer = 0;
                }
                break;
                
            case 'charge':
                this.stateTimer++;
                // プレイヤー方向を向く（予測移動対応）
                this.updateDashDirection();
                if (this.stateTimer > this.chargeDuration) {
                    this.state = 'dashing';
                    this.stateTimer = 0;
                    this.currentDashFrame = 0;
                    this.comboCount++;
                }
                break;
                
            case 'dashing':
                this._dx = this.dashDirection.x * this.dashSpeed;
                this._dy = this.dashDirection.y * this.dashSpeed;
                this.x += this._dx;
                this.y += this._dy;
                this.currentDashFrame++;
                
                // 突進エフェクトを生成
                this.createDashParticles();
                this.createTrailEffect();
                
                // 攻撃判定
                this.checkDashAttack();
                if (this.currentDashFrame > this.dashDuration || this.isOutOfBounds()) {
                    this.state = 'recover';
                    this.stateTimer = 0;
                    this._dx = 0;
                    this._dy = 0;
                    this.hasHitPlayerThisDash = false;
                    
                    // コンボ判定
                    if (this.comboCount >= this.maxCombo) {
                        this.comboCount = 0;
                        this.stateTimer = -30; // 長めの回復時間
                    }
                }
                break;
                
            case 'recover':
                this.stateTimer++;
                this._dx = 0;
                this._dy = 0;
                if (this.stateTimer > this.recoverDuration) {
                    this.state = 'idle';
                    this.stateTimer = 0;
                }
                break;
                
            case 'special_attack':
                this.stateTimer++;
                
                // 特殊攻撃の実行
                if (this.specialAttackActive && this.specialAttackCount < this.specialAttackMaxCount) {
                    if (this.stateTimer % 20 === 0) { // 20フレームごとに突進
                        this.executeQuickDash();
                        this.specialAttackCount++;
                        console.log(`BossOni2: Special dash ${this.specialAttackCount}/${this.specialAttackMaxCount}`);
                    }
                }
                
                if (this.stateTimer > 120) { // 2秒間の特殊攻撃
                    this.state = 'recover';
                    this.stateTimer = 0;
                    this.specialAttackCooldown = this.specialAttackMaxCooldown;
                    this.specialAttackActive = false;
                    this.specialAttackCount = 0;
                }
                break;
        }
    }

    checkRageMode() {
        const hpRatio = this._hp / this._maxHP;
        if (hpRatio <= this.rageModeThreshold && !this.isRageMode) {
            this.enterRageMode();
        }
    }

    enterRageMode() {
        if (this.rageModeActivated) return; // 既に怒りモードの場合は何もしない
        
        this.isRageMode = true;
        this.rageModeActivated = true;
        
        // 能力値強化
        this.dashSpeed *= 1.3;
        this.chargeDuration = Math.max(15, this.chargeDuration - 10);
        this.recoverDuration = Math.max(15, this.recoverDuration - 5);
        this.specialAttackMaxCooldown = Math.max(60, this.specialAttackMaxCooldown - 60);
        
        console.log('BossOni2: RAGE MODE ACTIVATED!');
        console.log(`BossOni2: New stats - Speed: ${this.dashSpeed}, Charge: ${this.chargeDuration}, Recover: ${this.recoverDuration}`);
        
        // 怒りモードエフェクト
        this.createRageEffect();
    }

    createRageEffect() {
        // 怒りモード時の視覚効果
        this.screenShake = 30;
        this.color = '#e74c3c'; // 赤色に変更
        
        console.log('BossOni2: RAGE MODE VISUAL EFFECTS ACTIVATED!');
        
        // パーティクル爆発
        for (let i = 0; i < 20; i++) {
            this.dashParticles.push({
                x: this.centerX + (Math.random() - 0.5) * 100,
                y: this.centerY + (Math.random() - 0.5) * 100,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 60,
                maxLife: 60,
                size: Math.random() * 15 + 10,
                alpha: 1.0,
                color: '#e74c3c'
            });
        }
        
        // 怒りモード時の色変更を確実に適用
        if (this.spriteSheet) {
            // スプライトシートの色調整（可能な場合）
            console.log('BossOni2: Applying rage mode color filter');
        }
    }

    executeSpecialAttack() {
        // 特殊攻撃: 連続突進
        console.log('BossOni2: Special Attack - Rapid Dash!');
        
        // プレイヤー周囲に複数回突進
        const player = this.game.player;
        if (player) {
            const dashCount = this.isRageMode ? 5 : 3;
            console.log(`BossOni2: Executing ${dashCount} rapid dashes!`);
            
            // 特殊攻撃中は一時的に状態を変更
            this.specialAttackActive = true;
            this.specialAttackCount = 0;
            this.specialAttackMaxCount = dashCount;
        }
    }

    executeQuickDash() {
        // 素早い突進
        console.log('BossOni2: Quick dash executed!');
        
        // 一時的に高速化
        const originalSpeed = this.dashSpeed;
        this.dashSpeed *= 1.5;
        
        // 短時間の突進
        setTimeout(() => {
            this.dashSpeed = originalSpeed;
        }, 300);
        
        // 突進エフェクトを生成
        this.createDashParticles();
        this.createTrailEffect();
    }

    updateDashDirection() {
        // プレイヤーの中心座標を取得
        const player = this.game.player;
        if (!player) return;
        
        // プレイヤーの移動を予測
        const currentPlayerPos = { x: player.centerX, y: player.centerY };
        this.playerVelocity.x = currentPlayerPos.x - this.lastPlayerPos.x;
        this.playerVelocity.y = currentPlayerPos.y - this.lastPlayerPos.y;
        
        // 予測位置を計算
        const predictedX = currentPlayerPos.x + this.playerVelocity.x * this.predictionLevel;
        const predictedY = currentPlayerPos.y + this.playerVelocity.y * this.predictionLevel;
        
        const dx = predictedX - this.centerX;
        const dy = predictedY - this.centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            this.dashDirection.x = dx / dist;
            this.dashDirection.y = dy / dist;
            this.spriteDirection = this.dashDirection.x < 0 ? 'left' : 'right';
        }
        
        this.lastPlayerPos = currentPlayerPos;
    }

    isOutOfBounds() {
        // 画面外に出たら突進終了
        const map = this.game.cameraManager.getMapDimensions();
        return (
            this.x < 0 ||
            this.y < 0 ||
            this.x + this.width > map.width ||
            this.y + this.height > map.height
        );
    }

    updateMovement() {
        // 通常移動は無効化（突進以外は動かない）
        // 突進中はupdateで直接座標を動かす
        this._dx = 0;
        this._dy = 0;
    }

    draw(ctx, scrollX, scrollY) {
        // EnemyRendererを使用するため、独自の描画処理は無効化
        // パーティクルと軌跡エフェクトのみ描画
        this.drawParticles(ctx, scrollX, scrollY);
        this.drawTrailEffect(ctx, scrollX, scrollY);
    }

    checkDashAttack() {
        // 1回の突進で1度だけ攻撃
        if (this.hasHitPlayerThisDash) return;
        const player = this.game.player;
        if (!player || player.markedForDeletion) return;
        
        // 矩形衝突判定
        if (this.collidesWith(player)) {
            if (typeof player.takeDamage === 'function') {
                const damage = this.isRageMode ? 45 : 30; // 怒りモード時はダメージ増加
                player.takeDamage(damage);
            }
            this.hasHitPlayerThisDash = true;
            
            // ノックバック効果を適用
            this.applyKnockback(player);
            
            // ノックバックエフェクト
            this.createKnockbackEffect(player);
            
            // ヒットエフェクト
            this.createHitEffect();
        }
    }

    applyKnockback(player) {
        // ノックバックの方向と強度を計算
        let knockbackStrength = this.knockbackStrength;
        if (this.isRageMode) {
            knockbackStrength *= 1.4; // 怒りモード時は40%増加
        }
        
        // プレイヤーからバイクへの方向ベクトルを計算
        const dx = player.centerX - this.centerX;
        const dy = player.centerY - this.centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // 正規化された方向ベクトル
            const normalizedDx = dx / distance;
            const normalizedDy = dy / distance;
            
            // ノックバック速度を設定
            const knockbackVx = normalizedDx * knockbackStrength;
            const knockbackVy = normalizedDy * knockbackStrength;
            
            console.log(`BossOni2: Applying knockback - Strength: ${knockbackStrength}, Direction: (${knockbackVx.toFixed(2)}, ${knockbackVy.toFixed(2)})`);
            
            // プレイヤーにノックバックを適用
            if (typeof player.applyKnockback === 'function') {
                player.applyKnockback(knockbackVx, knockbackVy);
            } else {
                // プレイヤーにノックバックメソッドがない場合は直接座標を変更
                this.applyDirectKnockback(player, knockbackVx, knockbackVy);
            }
        }
    }

    applyDirectKnockback(player, knockbackVx, knockbackVy) {
        // プレイヤーの現在位置を保存
        const originalX = player.x;
        const originalY = player.y;
        
        // ノックバック位置を計算
        const newX = player.x + knockbackVx;
        const newY = player.y + knockbackVy;
        
        // 画面内に収まるように調整
        const map = this.game.cameraManager.getMapDimensions();
        const clampedX = Math.max(0, Math.min(newX, map.width - player.width));
        const clampedY = Math.max(0, Math.min(newY, map.height - player.height));
        
        // プレイヤーの位置を更新
        player.x = clampedX;
        player.y = clampedY;
        
        // ノックバックアニメーション用の一時的な速度を設定
        if (typeof player.setVelocity === 'function') {
            player.setVelocity(knockbackVx * 0.5, knockbackVy * 0.5);
        }
        
        console.log(`BossOni2: Direct knockback applied - From: (${originalX}, ${originalY}) To: (${clampedX}, ${clampedY})`);
    }

    createKnockbackEffect(player) {
        // ノックバック時の視覚効果
        console.log('BossOni2: Creating knockback effect');
        
        // ノックバック方向を示すパーティクル
        const knockbackDirection = {
            x: player.centerX - this.centerX,
            y: player.centerY - this.centerY
        };
        const distance = Math.sqrt(knockbackDirection.x * knockbackDirection.x + knockbackDirection.y * knockbackDirection.y);
        
        if (distance > 0) {
            const normalizedDx = knockbackDirection.x / distance;
            const normalizedDy = knockbackDirection.y / distance;
            
            // ノックバック方向に沿ったパーティクルを生成
            for (let i = 0; i < 12; i++) {
                const offset = i * 8; // パーティクルを線状に配置
                const particleX = player.centerX + normalizedDx * offset;
                const particleY = player.centerY + normalizedDy * offset;
                
                this.dashParticles.push({
                    x: particleX,
                    y: particleY,
                    vx: normalizedDx * 3 + (Math.random() - 0.5) * 2,
                    vy: normalizedDy * 3 + (Math.random() - 0.5) * 2,
                    life: 40,
                    maxLife: 40,
                    size: Math.random() * 6 + 3,
                    alpha: 1.0,
                    color: '#ff6b6b' // ノックバック専用の色
                });
            }
        }
        
        // 画面シェイク効果を強化
        this.screenShake = Math.max(this.screenShake, 15);
    }

    createHitEffect() {
        // ヒット時のエフェクト
        this.screenShake = 10;
        
        // ヒットパーティクル
        for (let i = 0; i < 8; i++) {
            this.dashParticles.push({
                x: this.centerX + (Math.random() - 0.5) * 50,
                y: this.centerY + (Math.random() - 0.5) * 50,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 30,
                maxLife: 30,
                size: Math.random() * 6 + 3,
                alpha: 1.0,
                color: '#f39c12'
            });
        }
    }

    createDashParticles() {
        // 突進中にパーティクルを生成
        this.particleTimer++;
        if (this.particleTimer >= 2) { // 2フレームごとにパーティクル生成
            this.particleTimer = 0;
            
            // バイクの後ろにパーティクルを生成
            const particleX = this.x + (this.spriteDirection === 'left' ? this.width : 0);
            const particleY = this.y + this.height * 0.7; // バイクの後輪付近
            
            this.dashParticles.push({
                x: particleX,
                y: particleY,
                vx: (this.spriteDirection === 'left' ? 1 : -1) * (Math.random() * 3 + 2),
                vy: (Math.random() - 0.5) * 3,
                life: 25,
                maxLife: 25,
                size: Math.random() * 10 + 6,
                alpha: 0.9,
                color: this.isRageMode ? '#e74c3c' : '#95a5a6'
            });
        }
        
        // デバッグ用: 常にパーティクルを生成（テスト用）
        if (this.dashParticles.length === 0) {
            this.dashParticles.push({
                x: this.centerX + (Math.random() - 0.5) * 50,
                y: this.centerY + (Math.random() - 0.5) * 50,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                life: 60,
                maxLife: 60,
                size: Math.random() * 8 + 4,
                alpha: 1.0,
                color: '#ff0000'
            });
        }
    }

    createTrailEffect() {
        // 軌跡エフェクト
        if (this.state === 'dashing') {
            this.trailEffect.push({
                x: this.centerX,
                y: this.centerY,
                life: 20,
                maxLife: 20,
                alpha: 0.6
            });
        }
    }

    updateTrailEffect() {
        // 軌跡エフェクトを更新
        for (let i = this.trailEffect.length - 1; i >= 0; i--) {
            const trail = this.trailEffect[i];
            trail.life--;
            trail.alpha = (trail.life / trail.maxLife) * 0.6;
            
            if (trail.life <= 0) {
                this.trailEffect.splice(i, 1);
            }
        }
    }

    updateScreenShake() {
        if (this.screenShake > 0) {
            this.screenShake--;
        }
    }

    updateParticles() {
        // パーティクルを更新
        for (let i = this.dashParticles.length - 1; i >= 0; i--) {
            const particle = this.dashParticles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            particle.alpha = particle.life / particle.maxLife;
            
            if (particle.life <= 0) {
                this.dashParticles.splice(i, 1);
            }
        }
    }

    // サイズ変更メソッド（将来的な拡張用）
    changeSize(newWidth, newHeight) {
        this.setSize(newWidth, newHeight);
        console.log(`BossOni2: Size changed to ${newWidth}x${newHeight}`);
    }

    drawParticles(ctx, scrollX, scrollY) {
        // パーティクルを描画
        ctx.save();
        
        // デバッグ用: パーティクル数を表示
        if (this.dashParticles.length > 0) {
            console.log(`BossOni2: Drawing ${this.dashParticles.length} particles`);
        }
        
        for (const particle of this.dashParticles) {
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = particle.color || `rgba(100, 100, 100, ${particle.alpha})`;
            ctx.beginPath();
            ctx.arc(
                particle.x - scrollX,
                particle.y - scrollY,
                particle.size,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
        ctx.restore();
    }

    drawTrailEffect(ctx, scrollX, scrollY) {
        // 軌跡エフェクトを描画
        ctx.save();
        for (const trail of this.trailEffect) {
            ctx.globalAlpha = trail.alpha;
            ctx.fillStyle = `rgba(52, 152, 219, ${trail.alpha})`;
            ctx.beginPath();
            ctx.arc(
                trail.x - scrollX,
                trail.y - scrollY,
                15,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
        ctx.restore();
    }

    // 新機能: 難易度動的調整
    adjustDifficultyDynamically() {
        const player = this.game.player;
        if (player && typeof player.getScore === 'function') {
            const score = player.getScore();
            if (score > 10000 && this.difficulty === 'normal') {
                this.difficulty = 'hard';
                this.adjustDifficulty();
            } else if (score > 20000 && this.difficulty === 'hard') {
                this.difficulty = 'extreme';
                this.adjustDifficulty();
            }
        }
    }

    // 新機能: パフォーマンス統計
    getPerformanceStats() {
        return {
            difficulty: this.difficulty,
            isRageMode: this.isRageMode,
            comboCount: this.comboCount,
            specialAttackCooldown: this.specialAttackCooldown,
            predictionLevel: this.predictionLevel
        };
    }
} 