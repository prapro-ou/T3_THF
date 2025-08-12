import { BossOni } from './BossOni.js';
import { SpriteSheet } from '../../utils/SpriteSheet.js';
import { playSE } from '../../managers/KoukaonManager.js'; // 追加

/**
 * BossOni2: バイクに乗って突進を繰り返すボス
 */
export class BossOni2 extends BossOni {
    constructor(game, x = null, y = null) {
        try {
            console.log('BossOni2: Constructor called');
            super(game, x, y);
            console.log('BossOni2: Super constructor completed');

            this.color = '#3498db'; // 青系
            this._maxHP = 350;
            this._hp = 350;
            this.name = 'BossOni2';
            // 視覚的サイズを設定
            this.setSize(120, 120);
            // 円形当たり判定の半径を設定
            this.setCircularCollision(40);

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

            // アニメーション用
            this.spriteSheet = null;
            this.initializeAnimation();

            // 突進エフェクト用
            this.dashParticles = [];
            this.particleTimer = 0;

            console.log('BossOni2: Constructor completed');
        } catch (error) {
            console.error('BossOni2: Constructor error:', error);
            throw error;
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
        // アニメーション更新
        if (this.spriteSheet) {
            this.spriteSheet.updateAnimation();

            // 状態に応じてアニメーション速度を調整
            switch (this.state) {
                case 'idle':
                    this.spriteSheet.setFrameDelay(12); // ゆっくりとしたアニメーション
                    break;
                case 'charge':
                    this.spriteSheet.setFrameDelay(6); // 中程度の速度
                    break;
                case 'dashing':
                    this.spriteSheet.setFrameDelay(3); // 高速アニメーション
                    break;
                case 'recover':
                    this.spriteSheet.setFrameDelay(10); // 回復中はゆっくり
                    break;
            }
        }

        // パーティクル更新
        this.updateParticles();

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
                    playSE("baiku1"); // ← 突進開始時に効果音を鳴らす
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
        // EnemyRendererを使用するため、独自の描画処理は無効化
        // パーティクルのみ描画
        this.drawParticles(ctx, scrollX, scrollY);
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
                vx: (this.spriteDirection === 'left' ? 1 : -1) * (Math.random() * 2 + 1),
                vy: (Math.random() - 0.5) * 2,
                life: 20,
                maxLife: 20,
                size: Math.random() * 8 + 4,
                alpha: 0.8
            });
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
        for (const particle of this.dashParticles) {
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = `rgba(100, 100, 100, ${particle.alpha})`;
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
}
