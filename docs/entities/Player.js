import { Character } from './base/Character.js';
import { PlayerController } from '../components/PlayerController.js';
import { PlayerRenderer } from '../components/PlayerRenderer.js';
import { AmmoManager } from '../managers/AmmoManager.js';
import { playSE } from '../managers/KoukaonManager.js'; // 追加

/**
 * プレイヤークラス
 * 単一責任: プレイヤーの状態管理と行動
 * 継承: Characterから基本機能を継承
 */
export class Player extends Character {
    static SPEED = 3.5; // クラス定数として定義

    constructor(game, x, y, controller) {
        super(game, x, y, 80, 80, '#ffb347', 100);
        this.attackRadius = 80;
        this.controller = controller;
        this.renderer = new PlayerRenderer(game.renderer);
        this.ammoManager = new AmmoManager(this, 10);
        this.direction = 'down';
        this.isMoving = false;
        this.moveFrame = 0;

        // 高速移動時の衝突判定用
        this.prevX = x;
        this.prevY = y;

        // ammoManager初期化後にmaxAmmoを設定
        this.maxAmmo = 10;
        this.invincibleTimer = 0; // 無敵時間（秒）

        // 弾回復監視用
        this._prevAmmo = this.ammoManager.getAmmo();

            // スタン機能用
        this.isStunned = false;
        this.stunTimer = 0;
        this.stunDuration = 0;
        this.stunStrength = 0;
        this.originalSpeed = Player.SPEED;
        this.stunImmunityTimer = 0; // スタン免疫時間（連続スタンを防ぐ）
        this.stunImmunityDuration = 10; // 10フレームの免疫時間

        // お札効果用
        this.slowTimer = 0;
        this.slowStrength = 1;
        this.poisonTimer = 0;
        this.poisonDamage = 0;
        this.poisonInterval = 0;
        this.poisonTickTimer = 0;
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
        // 移動前の位置を保存
        this.prevX = this.x;
        this.prevY = this.y;

        // スタン状態の更新
        this.updateStunState(deltaTime);
        
        // お札効果状態の更新
        this.updateEffectStates(deltaTime);

        this.controller.updatePlayerMovement(this, deltaTime);
        this.ammoManager.update(deltaTime);
        this.updateMovementState();
        if (this.invincibleTimer > 0) {
            this.invincibleTimer -= deltaTime;
            if (this.invincibleTimer < 0) this.invincibleTimer = 0;
        }

        // 残弾数が回復したら効果音set
        const currentAmmo = this.ammoManager.getAmmo();
        if (currentAmmo > this._prevAmmo) {
            playSE("set");
        }
        this._prevAmmo = currentAmmo;
    }

    // 弾消費時のチェック用メソッド（攻撃時に呼ぶこと）
    tryConsumeAmmo() {
        if (this.ammo > 0) {
            this.ammo--;
            return true;
        } else {
            // ここでは効果音を鳴らさない
            return false;
        }
    }

    // プレイヤーが攻撃しようとしたときに呼ぶメソッド例
    tryAttack() {
        if (this.tryConsumeAmmo()) {
            // 攻撃処理（弾発射など）
            // ...
            return true;
        } else {
            // 効果音は鳴らさない
            return false;
        }
    }

    draw(ctx, scrollX, scrollY) {
        this.renderer.drawPlayer(this, ctx, scrollX, scrollY);
    }

    reset() {
        const { width: mapWidth, height: mapHeight } = this.game.cameraManager.getMapDimensions();
        super.reset(mapWidth / 2, mapHeight / 2);
        this.prevX = this.x;
        this.prevY = this.y;
        this.ammoManager.reset();
    }

    setAttackRadius(radius) {
        this.attackRadius = radius;
    }

    getAttackRadius() {
        return this.attackRadius;
    }

    getAttackPower() {
        // レベル・倍率に応じて攻撃力を返す
        const level = this.game.otomoLevel || 1;
        const base = 10 + (level - 1) * 5;
        return base * (this.game.playerAttackMultiplier || 1);
    }

    // 高速移動時の衝突判定を取得
    getPreviousPosition() {
        return { x: this.prevX, y: this.prevY };
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

    takeDamage(amount) {
        if (this.invincibleTimer > 0) return; // 無敵中はダメージ無効
        const nextHp = this.health - amount;
        if (nextHp > 0) {
            playSE("receivedamage"); // 死なない場合のみ効果音
        }
        this.health = nextHp;
        this.invincibleTimer = 1.0; // 1秒間無敵
        if (!this.isAlive) {
            this.onDeath();
        }
    }

    onDeath() {
        playSE("gameover"); // ← 死亡時に効果音
        // 必要ならここにゲームオーバー演出やUI処理を追加
        // 例:
    }

    // スタン機能のメソッド
    applyStun(duration, strength) {
        // スタン免疫中は新しいスタンを適用しない
        if (this.stunImmunityTimer > 0) {
            console.log(`Player: Stun immunity active, ignoring new stun (${this.stunImmunityTimer} frames remaining)`);
            return;
        }

        // 既にスタン中の場合は、より長いスタン時間を適用
        if (this.isStunned) {
            // 現在のスタン時間と新しいスタン時間を比較して、長い方を採用
            const newDuration = Math.max(this.stunDuration, duration);
            const newStrength = Math.max(this.stunStrength, strength);
            
            // スタン時間を延長
            this.stunDuration = newDuration;
            this.stunStrength = newStrength;
            
            // スタンタイマーをリセット（新しいスタン時間でカウント開始）
            this.stunTimer = 0;
            
            console.log(`Player: Stun extended to ${newDuration} frames with strength ${newStrength}`);
        } else {
            // 初回のスタン
            this.isStunned = true;
            this.stunTimer = 0;
            this.stunDuration = duration;
            this.stunStrength = strength;
            
            // スタン中の移動速度を制限
            this.originalSpeed = Player.SPEED;
            Player.SPEED = Player.SPEED * (1 - strength);
            
            console.log(`Player: Stunned for ${duration} frames with strength ${strength}`);
        }
    }

    updateStunState(deltaTime) {
        // スタン免疫タイマーの更新
        if (this.stunImmunityTimer > 0) {
            this.stunImmunityTimer -= deltaTime * 60;
            if (this.stunImmunityTimer < 0) this.stunImmunityTimer = 0;
        }

        if (this.isStunned) {
            this.stunTimer += deltaTime * 60; // フレーム数に変換
            
            // スタン時間が終了したらスタンを解除
            if (this.stunTimer >= this.stunDuration) {
                this.removeStun();
            }
            
            // デバッグ用: スタン残り時間をログ出力（1秒ごと）
            if (Math.floor(this.stunTimer / 60) !== Math.floor((this.stunTimer - deltaTime * 60) / 60)) {
                const remainingFrames = this.stunDuration - this.stunTimer;
                const remainingSeconds = (remainingFrames / 60).toFixed(1);
                console.log(`Player: Stun remaining: ${remainingFrames} frames (${remainingSeconds}s)`);
            }
        }
    }

    removeStun() {
        // スタン状態をクリア
        this.isStunned = false;
        this.stunTimer = 0;
        this.stunDuration = 0;
        this.stunStrength = 0;
        
        // スタン免疫タイマーを設定（連続スタンを防ぐ）
        this.stunImmunityTimer = this.stunImmunityDuration;
        
        // 移動速度を元に戻す
        if (this.originalSpeed !== undefined) {
            Player.SPEED = this.originalSpeed;
            console.log(`Player: Speed restored to ${this.originalSpeed}`);
        } else {
            // 元の速度が設定されていない場合はデフォルト値を使用
            Player.SPEED = 3.5;
            console.log('Player: Speed restored to default (3.5)');
        }
        
        console.log('Player: Stun removed, speed restored, immunity activated');
    }

    setStunned(stunned) {
        this.isStunned = stunned;
        if (!stunned) {
            this.removeStun();
        }
    }

    setStunVisual(visual) {
        // スタン中の視覚効果（必要に応じて実装）
        if (visual) {
            console.log('Player: Stun visual effect activated');
        } else {
            console.log('Player: Stun visual effect deactivated');
        }
    }

    // スタン状態のgetter
    getStunned() {
        return this.isStunned;
    }

    getStunRemaining() {
        if (!this.isStunned) return 0;
        return Math.max(0, this.stunDuration - this.stunTimer);
    }

    // スタン状態を強制的にリセット（デバッグ用）
    forceRemoveStun() {
        console.log('Player: Force removing stun');
        this.removeStun();
    }

    // スタン状態の詳細情報を取得
    getStunInfo() {
        return {
            isStunned: this.isStunned,
            stunTimer: this.stunTimer,
            stunDuration: this.stunDuration,
            stunStrength: this.stunStrength,
            remainingFrames: this.getStunRemaining(),
            remainingSeconds: (this.getStunRemaining() / 60).toFixed(1)
        };
    }

    // お札効果を適用するメソッド
    applySlow(duration, strength) {
        // 減速効果（フレーム数、速度倍率）
        if (this.slowTimer > 0) {
            // 既存の効果がある場合は延長
            this.slowTimer = Math.max(this.slowTimer, duration);
            this.slowStrength = Math.min(this.slowStrength, strength);
        } else {
            // 新しい効果を適用
            this.slowTimer = duration;
            this.slowStrength = strength;
            // 速度を直接変更せず、slowStrengthを使用して制御
        }
        console.log(`Player: Slow effect applied for ${duration} frames with strength ${strength}`);
        
        // 減速効果のパーティクルを表示
        this.createSlowEffectParticles();
    }

    applyPoison(duration, damage, interval) {
        // 毒効果（フレーム数、ダメージ、間隔）
        this.poisonTimer = duration;
        this.poisonDamage = damage;
        this.poisonInterval = interval;
        this.poisonTickTimer = 0;
        console.log(`Player: Poison effect applied for ${duration} frames with ${damage} damage every ${interval} frames`);
        
        // 毒効果のパーティクルを表示
        this.createPoisonEffectParticles();
    }



    // 効果状態の更新
    updateEffectStates(deltaTime) {
        console.log(`Player: updateEffectStates called with deltaTime: ${deltaTime}`);
        
        // 減速効果の更新
        if (this.slowTimer > 0) {
            const oldTimer = this.slowTimer;
            this.slowTimer -= deltaTime * 60;
            console.log(`Player: Slow timer updated - Old: ${oldTimer.toFixed(1)}, New: ${this.slowTimer.toFixed(1)}, Delta: ${(deltaTime * 60).toFixed(1)}`);
            
            // 効果継続中は定期的にパーティクルを表示（1秒ごと）
            if (Math.floor(this.slowTimer / 60) !== Math.floor((this.slowTimer + deltaTime * 60) / 60)) {
                this.createSlowEffectParticles();
            }
            
            if (this.slowTimer <= 0) {
                console.log('Player: Slow timer expired, removing effect');
                this.removeSlow();
            } else {
                console.log(`Player: Slow effect active - Timer: ${this.slowTimer.toFixed(1)}, Strength: ${this.slowStrength}`);
            }
        } else if (this.slowTimer <= 0 && this.slowStrength !== 1) {
            // タイマーが0以下で減速効果が残っている場合は強制的に解除
            console.log(`Player: Force removing slow effect - Timer: ${this.slowTimer}, Strength: ${this.slowStrength}`);
            this.removeSlow();
        }

        // 毒効果の更新
        if (this.poisonTimer > 0) {
            this.poisonTimer -= deltaTime * 60;
            this.poisonTickTimer += deltaTime * 60;
            
            // 効果継続中は定期的にパーティクルを表示（1秒ごと）
            if (Math.floor(this.poisonTimer / 60) !== Math.floor((this.poisonTimer + deltaTime * 60) / 60)) {
                this.createPoisonEffectParticles();
            }
            
            if (this.poisonTickTimer >= this.poisonInterval) {
                this.takeDamage(this.poisonDamage);
                this.poisonTickTimer = 0;
            }
            
            if (this.poisonTimer <= 0) {
                this.removePoison();
            }
        }


    }

    // 効果の解除
    removeSlow() {
        if (this.slowTimer > 0 || this.slowStrength !== 1) {
            console.log(`Player: removeSlow called - Timer: ${this.slowTimer.toFixed(1)}, Strength: ${this.slowStrength}`);
            this.slowTimer = 0;
            this.slowStrength = 1;
            console.log('Player: Slow effect removed, speed restored to normal');
        } else {
            console.log('Player: removeSlow called but effect was already normal');
        }
    }

    removePoison() {
        if (this.poisonTimer > 0) {
            this.poisonTimer = 0;
            this.poisonDamage = 0;
            this.poisonInterval = 0;
            this.poisonTickTimer = 0;
            console.log('Player: Poison effect removed');
        }
    }

    // パーティクルエフェクトの作成
    createSlowEffectParticles() {
        // 減速効果のパーティクル（濃い青）
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const distance = 30 + Math.random() * 20; // プレイヤーの周囲30-50px
            const x = this.centerX + Math.cos(angle) * distance;
            const y = this.centerY + Math.sin(angle) * distance;
            
            // 内側に向かう速度
            const speed = 0.5 + Math.random() * 1;
            const vx = -Math.cos(angle) * speed;
            const vy = -Math.sin(angle) * speed;
            
            this.game.particleManager.createParticle(
                x,
                y,
                vx,
                vy,
                '#000080', // 濃い青
                90, // 1.5秒間表示
                0.8
            );
        }
    }

    createPoisonEffectParticles() {
        // 毒効果のパーティクル（濃い緑）
        for (let i = 0; i < 10; i++) {
            const angle = (Math.PI * 2 * i) / 10;
            const distance = 25 + Math.random() * 25; // プレイヤーの周囲25-50px
            const x = this.centerX + Math.cos(angle) * distance;
            const y = this.centerY + Math.sin(angle) * distance;
            
            // 外側に向かう速度
            const speed = 0.8 + Math.random() * 1.2;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            this.game.particleManager.createParticle(
                x,
                y,
                vx,
                vy,
                '#006400', // 濃い緑
                120, // 2秒間表示
                0.7
            );
        }
    }


}
//test
