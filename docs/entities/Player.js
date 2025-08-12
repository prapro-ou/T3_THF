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
}
//test
