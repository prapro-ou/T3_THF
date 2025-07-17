import { BossOni } from './BossOni.js';

/**
 * BossOni2: バイクに乗って突進を繰り返すボス
 */
export class BossOni2 extends BossOni {
    constructor(game, x = null, y = null) {
        super(game, x, y);
        this.color = '#3498db'; // 青系
        this._maxHP = 350;
        this._hp = 350;
        this.name = 'BossOni2';
        this.width = 400;
        this.height = 400;

        // 状態管理
        this.state = 'idle'; // idle, charge, dashing, recover
        this.stateTimer = 0;
        this.dashDirection = { x: 0, y: 0 };
        this.dashSpeed = 16; // 突進速度
        this.dashDuration = 36; // 突進フレーム数（0.6秒@60fps）
        this.chargeDuration = 30; // 溜めフレーム数（0.5秒）
        this.recoverDuration = 24; // クールダウン（0.4秒）
        this.idleDuration = 60; // 待機（1秒）
        this.currentDashFrame = 0;
        this.spriteDirection = 'right'; // 'left' or 'right'
        // 攻撃判定用
        this.hasHitPlayerThisDash = false;
    }

    update() {
        // 状態ごとの処理
        switch (this.state) {
            case 'idle':
                this.stateTimer++;
                this._dx = 0;
                this._dy = 0;
                if (this.stateTimer > this.idleDuration) {
                    this.state = 'charge';
                    this.stateTimer = 0;
                }
                break;
            case 'charge':
                this.stateTimer++;
                // プレイヤー方向を向く
                this.updateDashDirection();
                if (this.stateTimer > this.chargeDuration) {
                    this.state = 'dashing';
                    this.stateTimer = 0;
                    this.currentDashFrame = 0;
                }
                break;
            case 'dashing':
                this._dx = this.dashDirection.x * this.dashSpeed;
                this._dy = this.dashDirection.y * this.dashSpeed;
                this.x += this._dx;
                this.y += this._dy;
                this.currentDashFrame++;
                // 攻撃判定
                this.checkDashAttack();
                if (this.currentDashFrame > this.dashDuration || this.isOutOfBounds()) {
                    this.state = 'recover';
                    this.stateTimer = 0;
                    this._dx = 0;
                    this._dy = 0;
                    this.hasHitPlayerThisDash = false; // 次の突進で再び攻撃可能に
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
        }
    }

    updateDashDirection() {
        // プレイヤーの中心座標を取得
        const player = this.game.player;
        if (!player) return;
        const dx = player.centerX - this.centerX;
        const dy = player.centerY - this.centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
            this.dashDirection.x = dx / dist;
            this.dashDirection.y = dy / dist;
            this.spriteDirection = this.dashDirection.x < 0 ? 'left' : 'right';
        }
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
        // スプライト描画（向きで画像切替）
        const imgName = this.spriteDirection === 'left' ? 'bike_oni_left.png' : 'bike_oni_right.png';
        const img = this.game.assetManager.getImage('assets/characters/oni/bike_oni/' + imgName);
        if (img) {
            ctx.drawImage(
                img,
                this.x - scrollX,
                this.y - scrollY,
                this.width,
                this.height
            );
        } else {
            // 画像がなければデフォルト矩形
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x - scrollX, this.y - scrollY, this.width, this.height);
        }
    }

    checkDashAttack() {
        // 1回の突進で1度だけ攻撃
        if (this.hasHitPlayerThisDash) return;
        const player = this.game.player;
        if (!player || player.markedForDeletion) return;
        // 矩形衝突判定
        if (this.collidesWith(player)) {
            if (typeof player.takeDamage === 'function') {
                player.takeDamage(30); // ダメージ量は調整可
            }
            this.hasHitPlayerThisDash = true;
        }
    }
} 