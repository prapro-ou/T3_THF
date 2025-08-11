import { BossOni } from './BossOni.js';

export class BossOni5 extends BossOni {
    constructor(game, x = null, y = null) {
        super(game, x, y);
        this.color = '#e67e22'; // オレンジ系（雷）
        this._maxHP = 500;
        this._hp = 500;
        this.name = 'BossOni5';
        // 視覚的サイズを設定
        this.setSize(250, 250);
        // 円形当たり判定の半径を設定
        this.setCircularCollision(80);

        // 雷範囲攻撃（周辺ランダム落雷）パラメータ
        this.attackCooldownFrames = 210; // 攻撃クールダウン（約3.5秒）
        this.attackDurationFrames = 75;  // 落雷連打の稼働時間（約1.25秒）
        this.strikeEveryFrames = 40;     // 何フレームごとに次の落雷を予約するか
        this.strikesPerWave = 6;         // 1回の攻撃での落雷回数の上限
        this.strikeRadius = 90;          // 落雷の有効半径
        this.damagePerStrike = 18;       // 1発のダメージ
        this.strikeOffsetMin = 40;       // プレイヤー周囲に生成する最小距離
        this.strikeOffsetMax = 320;      // プレイヤー周囲に生成する最大距離
        this.telegraphLeadFrames = 36;   // 予兆から着弾までのフレーム数

        this._isAttacking = false;
        this._attackTimer = 0;
        this._attackCooldown = 90;       // 初回は少し待つ
        this._lastStrikeSchedule = 0;
        this._pendingStrikes = [];       // {x,y, triggerFrame, radius}
    }

    update() {
        // 親クラスの更新処理を呼び出し
        super.update();
        const nowFrame = this.game.enemyManager.frame || 0;

        if (!this._isAttacking) {
            if (this._attackCooldown > 0) this._attackCooldown--;
            if (this._attackCooldown <= 0) {
                // 攻撃開始
                this._isAttacking = true;
                this._attackTimer = this.attackDurationFrames;
                this._lastStrikeSchedule = nowFrame - this.strikeEveryFrames; // すぐ最初を打てるように
                this._pendingStrikes = [];
                this._attackCooldown = this.attackCooldownFrames; // 次回用
            }
        } else {
            // 一定間隔で新規落雷を予約
            if (
                nowFrame - this._lastStrikeSchedule >= this.strikeEveryFrames &&
                this._pendingStrikes.length < this.strikesPerWave
            ) {
                this._lastStrikeSchedule = nowFrame;
                this.scheduleRandomStrikeNearPlayer(nowFrame);
            }

            // 予兆描画と着弾処理
            this.updateStrikes(nowFrame);

            this._attackTimer--;
            if (this._attackTimer <= 0 && this._pendingStrikes.length === 0) {
                this._isAttacking = false;
            }
        }
    }

    // サイズ変更メソッド（将来的な拡張用）
    changeSize(newWidth, newHeight) {
        this.setSize(newWidth, newHeight);
        console.log(`BossOni5: Size changed to ${newWidth}x${newHeight}`);
    }

    updateMovement() {
        // 攻撃中は移動を抑制（演出重視）
        if (this._isAttacking) {
            this._dx = 0;
            this._dy = 0;
            return;
        }
        super.updateMovement();
    }

    scheduleRandomStrikeNearPlayer(nowFrame) {
        const player = this.game.player;
        if (!player) return;
        const px = player.x + player.width / 2;
        const py = player.y + player.height / 2;

        // ランダムな極座標オフセット
        const r = this.strikeOffsetMin + Math.random() * (this.strikeOffsetMax - this.strikeOffsetMin);
        const theta = Math.random() * Math.PI * 2;
        let sx = px + r * Math.cos(theta);
        let sy = py + r * Math.sin(theta);

        // マップ内にクランプ
        const { width: mapW, height: mapH } = this.game.cameraManager.getMapDimensions();
        sx = Math.max(0, Math.min(sx, mapW));
        sy = Math.max(0, Math.min(sy, mapH));

        this._pendingStrikes.push({
            x: sx,
            y: sy,
            triggerFrame: nowFrame + this.telegraphLeadFrames,
            radius: this.strikeRadius
        });
    }

    updateStrikes(nowFrame) {
        if (this._pendingStrikes.length === 0) return;

        const remaining = [];
        for (const s of this._pendingStrikes) {
            // 予兆: 円形粒子
            this.spawnTelegraphParticles(s.x, s.y, s.radius);

            if (nowFrame >= s.triggerFrame) {
                // 着弾: 雷エフェクト + ダメージ
                this.spawnLightningParticles(s.x, s.y);
                this.tryDamagePlayerAt(s.x, s.y, s.radius, this.damagePerStrike);
            } else {
                remaining.push(s);
            }
        }
        this._pendingStrikes = remaining;
    }

    tryDamagePlayerAt(x, y, radius, damage) {
        const player = this.game.player;
        if (!player) return;
        const pcx = player.x + player.width / 2;
        const pcy = player.y + player.height / 2;
        const dist = Math.hypot(pcx - x, pcy - y);
        if (dist <= radius) {
            player.takeDamage(damage);
        }
    }

    spawnTelegraphParticles(cx, cy, radius) {
        // 円周に点在する粒子で予兆を表現（黄色）
        const count = 8;
        for (let i = 0; i < count; i++) {
            const ang = (i / count) * Math.PI * 2 + Math.random() * 0.2;
            const x = cx + Math.cos(ang) * (radius + (Math.random() - 0.5) * 6);
            const y = cy + Math.sin(ang) * (radius + (Math.random() - 0.5) * 6);
            this.game.particleManager.createParticle(x, y, '#f1c40f');
        }
    }

    spawnLightningParticles(cx, cy) {
        // 落雷表現: 上空から地面への黄白色の粒子列
        const bolts = 3;
        for (let b = 0; b < bolts; b++) {
            const jitterX = (Math.random() - 0.5) * 30;
            const segments = 12;
            for (let i = 0; i < segments; i++) {
                const t = i / (segments - 1);
                const x = cx + jitterX + (Math.random() - 0.5) * 10;
                const y = cy - 280 + t * 300 + (Math.random() - 0.5) * 10;
                this.game.particleManager.createParticle(x, y, i % 2 === 0 ? '#fff59d' : '#fd9f14');
            }
        }
        // 着弾点にも強いフラッシュ
        this.game.particleManager.createExplosion(cx, cy, '#ffeaa7', 18);
    }
} 