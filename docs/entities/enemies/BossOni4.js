import { BossOni } from './BossOni.js';
import { playSE } from '../../managers/KoukaonManager.js'; // 効果音をインポート

export class BossOni4 extends BossOni {
    constructor(game, x = null, y = null) {
        super(game, x, y);
        this.color = '#9b59b6'; // 紫系
        this._maxHP = 400;
        this._hp = 400;
        this.name = 'BossOni4';
        // 視覚的サイズを設定
        this.setSize(250, 250);
        // 円形当たり判定の半径を設定
        this.setCircularCollision(80);

        // 風範囲攻撃パラメータ
        this.windRange = 520;           // 風の到達距離
        this.windPushStrength = 6.0;    // 押し出し量
        this.windDamage = 8;            // ダメージ（tickごと）
        this.windDamageTickFrames = 30; // ダメージ間隔

        // 攻撃サイクル・パターン
        this.attackCooldownFrames = 180; // 攻撃クールダウン
        this._attackCooldown = 60;       // 初回待機
        this._isAttacking = false;
        this._attackPhase = 'idle';      // 'telegraph' | 'active'
        this._attackType = null;         // 'cone' | 'ring'
        this._phaseTimer = 0;            // 現フェーズ残フレーム
        this._startedAtFrame = 0;        // active開始フレーム

        // コーン（扇）攻撃
        this.coneTelegraphFrames = 30;
        this.coneActiveFrames = 60;
        this.coneHalfAngleRad = this.degToRad(35);

        // リング（環状）攻撃
        this.ringTelegraphFrames = 28;
        this.ringActiveFrames = 36;
        this.ringRadius = 220;
        this.ringThickness = 80; // 当たり幅
    }

    update() {
        // 親クラスの更新処理を呼び出し
        super.update();
        // 攻撃状態の更新
        if (!this._isAttacking) {
            if (this._attackCooldown > 0) this._attackCooldown--;
            if (this._attackCooldown <= 0) {
                // パターン選択
                this._attackType = Math.random() < 0.6 ? 'cone' : 'ring';
                this._isAttacking = true;
                this._attackPhase = 'telegraph';
                this._phaseTimer = (this._attackType === 'cone') ? this.coneTelegraphFrames : this.ringTelegraphFrames;
            }
        } else {
            if (this._attackPhase === 'telegraph') {
                this.drawTelegraph();
                this._phaseTimer--;
                if (this._phaseTimer <= 0) {
                    this._attackPhase = 'active';
                    this._phaseTimer = (this._attackType === 'cone') ? this.coneActiveFrames : this.ringActiveFrames;
                    this._startedAtFrame = this.game.enemyManager.frame || 0;
                    // 攻撃開始時
                    const windSE = playSE("Wind");
                    if (windSE) windSE.volume = 0.9; // 例: 音量を90%に
                }
            } else if (this._attackPhase === 'active') {
                this.applyAttackEffect();
                this._phaseTimer--;
                if (this._phaseTimer <= 0) {
                    // 攻撃終了
                    this._isAttacking = false;
                    this._attackPhase = 'idle';
                    this._attackType = null;
                    this._phaseTimer = 0;
                    this._attackCooldown = this.attackCooldownFrames;
                }
            }
        }
    }

    // サイズ変更メソッド（将来的な拡張用）
    changeSize(newWidth, newHeight) {
        this.setSize(newWidth, newHeight);
        console.log(`BossOni4: Size changed to ${newWidth}x${newHeight}`);
    }

    updateMovement() {
        // 風攻撃中は移動を抑制
        if (this._isAttacking) {
            this._dx = 0;
            this._dy = 0;
            return;
        }
        super.updateMovement();
    }

    // Telegraph and effect helpers
    drawTelegraph() {
        if (this._attackType === 'cone') this.telegraphCone();
        else if (this._attackType === 'ring') this.telegraphRing();
    }

    applyAttackEffect() {
        if (this._attackType === 'cone') this.applyConeEffect();
        else if (this._attackType === 'ring') this.applyRingEffect();
    }

    telegraphCone() {
        const player = this.game.player; if (!player) return;
        const bx = this.x + this.width / 2;
        const by = this.y + this.height / 2;
        const dir = Math.atan2((player.y + player.height / 2) - by, (player.x + player.width / 2) - bx);
        // 扇形内に粒子を密にばら撒いて予兆
        const rays = 12; const steps = 12;
        for (let i = 0; i < rays; i++) {
            const r = -this.coneHalfAngleRad + (2 * this.coneHalfAngleRad) * (i / (rays - 1));
            for (let s = 1; s <= steps; s++) {
                const t = (s / steps) * this.windRange;
                const ang = dir + r + (Math.random() - 0.5) * 0.03;
                const px = bx + Math.cos(ang) * t + (Math.random() - 0.5) * 8;
                const py = by + Math.sin(ang) * t + (Math.random() - 0.5) * 8;
                this.game.particleManager.createParticle(px, py, '#7ed6df');
            }
        }
    }

    applyConeEffect() {
        const player = this.game.player; if (!player) return;
        const bx = this.x + this.width / 2;
        const by = this.y + this.height / 2;
        const px = player.x + player.width / 2;
        const py = player.y + player.height / 2;
        const dx = px - bx; const dy = py - by; const dist = Math.hypot(dx, dy);
        if (dist <= 0 || dist > this.windRange) return;

        const dir = Math.atan2(dy, dx);
        const toPlayerAngle = dir;
        const forwardAngle = dir; // 目標方向へ扇を向ける
        // 角度差
        let delta = Math.atan2(Math.sin(toPlayerAngle - forwardAngle), Math.cos(toPlayerAngle - forwardAngle));
        delta = Math.abs(delta);
        if (delta <= this.coneHalfAngleRad) {
            const nx = dx / dist; const ny = dy / dist;
            player.x += nx * this.windPushStrength;
            player.y += ny * this.windPushStrength;
            const { width: mapW, height: mapH } = this.game.cameraManager.getMapDimensions();
            player.x = Math.max(0, Math.min(player.x, mapW - player.width));
            player.y = Math.max(0, Math.min(player.y, mapH - player.height));
            const elapsed = (this.game.enemyManager.frame || 0) - this._startedAtFrame;
            if (elapsed % this.windDamageTickFrames === 0) player.takeDamage(this.windDamage);
            // 風の線
            for (let i = 0; i < 6; i++) {
                const t = Math.random() * this.windRange;
                const px2 = bx + (dx / dist) * t + (Math.random() - 0.5) * 20;
                const py2 = by + (dy / dist) * t + (Math.random() - 0.5) * 20;
                this.game.particleManager.createParticle(px2, py2, '#a7e0f5');
            }
        }
    }

    telegraphRing() {
        const bx = this.x + this.width / 2;
        const by = this.y + this.height / 2;
        const count = 36;
        for (let i = 0; i < count; i++) {
            const ang = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.05;
            const rr = this.ringRadius + (Math.random() - 0.5) * (this.ringThickness * 0.6);
            const px = bx + Math.cos(ang) * rr;
            const py = by + Math.sin(ang) * rr;
            this.game.particleManager.createParticle(px, py, '#7ed6df');
        }
        // うっすら内側も
        for (let j = 0; j < 24; j++) {
            const ang = Math.random() * Math.PI * 2;
            const rr = this.ringRadius + (Math.random() - 0.5) * this.ringThickness;
            const px = bx + Math.cos(ang) * rr;
            const py = by + Math.sin(ang) * rr;
            this.game.particleManager.createParticle(px, py, '#bdeafe');
        }
    }

    applyRingEffect() {
        const player = this.game.player; if (!player) return;
        const bx = this.x + this.width / 2;
        const by = this.y + this.height / 2;
        const px = player.x + player.width / 2;
        const py = player.y + player.height / 2;
        const dx = px - bx; const dy = py - by; const dist = Math.hypot(dx, dy);
        const inner = this.ringRadius - this.ringThickness / 2;
        const outer = this.ringRadius + this.ringThickness / 2;
        if (dist >= inner && dist <= outer) {
            const nx = dx / (dist || 1); const ny = dy / (dist || 1);
            // 外向きに強く押す
            player.x += nx * (this.windPushStrength * 1.2);
            player.y += ny * (this.windPushStrength * 1.2);
            const { width: mapW, height: mapH } = this.game.cameraManager.getMapDimensions();
            player.x = Math.max(0, Math.min(player.x, mapW - player.width));
            player.y = Math.max(0, Math.min(player.y, mapH - player.height));
            const elapsed = (this.game.enemyManager.frame || 0) - this._startedAtFrame;
            if (elapsed % this.windDamageTickFrames === 0) player.takeDamage(this.windDamage);
        }
        // 視覚効果：リング上の風
        this.telegraphRing();
    }

    degToRad(d) { return d * Math.PI / 180; }
}
