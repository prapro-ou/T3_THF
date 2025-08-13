import { Projectile } from './Projectile.js';

/**
 * 音符型の弾クラス
 * - 数秒間滞留する
 * - 当たると一定時間スタンさせる
 * - 音符の形状で描画
 */
export class NoteProjectile extends Projectile {
    constructor(game, x, y, direction, speed = 3) {
        // ダミーのターゲットを作成してProjectileクラスのコンストラクタを呼び出す
        const dummyTarget = { x: x + direction.x * 1000, y: y + direction.y * 1000, width: 0, height: 0 };
        super(game, x, y, dummyTarget, speed, 0, 'note');
        
        this.direction = direction; // 方向ベクトル
        this.name = 'NoteProjectile';
        
        // 音符特有のプロパティを上書き
        this.width = 20;
        this.height = 20;
        this.radius = 10; // 円形当たり判定の半径
        
        // 速度ベクトルを設定（Projectileクラスのvx, vyを上書き）
        this.vx = direction.x * speed;
        this.vy = direction.y * speed;
        
        // 音符特有のプロパティ
        this.lifeTime = 180; // 3秒間滞留（60fps）
        this.currentLife = 0;
        this.stunDuration = 120; // スタン時間（2秒）
        this.stunStrength = 0.8; // スタン強度
        
        // 音符のアニメーション用
        this.animationTimer = 0;
        this.animationSpeed = 0.1;
        this.floatOffset = 0;
        this.rotationAngle = 0;
        
        // 音符の色とスタイル
        this.noteColor = '#8e44ad';
        this.noteOutlineColor = '#2c3e50';
        this.glowColor = '#9b59b6';
        
        // 音符の種類（ランダム）
        this.noteType = Math.floor(Math.random() * 4); // 0-3の音符タイプ
        
        // エフェクト用
        this.particles = [];
        this.trailEffect = [];
    }

    update() {
        // 位置を更新
        this.x += this.vx;
        this.y += this.vy;
        
        // 音符の滞留時間を更新
        this.currentLife++;
        if (this.currentLife >= this.lifeTime) {
            this.markedForDeletion = true;
            return;
        }
        
        // アニメーション更新
        this.animationTimer += this.animationSpeed;
        this.floatOffset = Math.sin(this.animationTimer) * 3;
        this.rotationAngle += 0.02;
        
        // パーティクル更新
        this.updateParticles();
        this.updateTrailEffect();
        
        // プレイヤーとの衝突判定
        this.checkPlayerCollision();
        
        // 画面外に出たら削除
        if (
            this.x < 0 || this.x > this.game.MAP_W ||
            this.y < 0 || this.y > this.game.MAP_H
        ) {
            this.markedForDeletion = true;
        }
    }

    checkPlayerCollision() {
        const player = this.game.player;
        if (!player || player.markedForDeletion) return;
        
        if (this.checkCollisionWithPlayer(player)) {
            // スタン効果を適用
            this.applyStunEffect(player);
            
            // ヒットエフェクト
            this.createHitEffect();
            
            // 弾を削除
            this.markedForDeletion = true;
        }
    }

    checkCollisionWithPlayer(player) {
        // 円形当たり判定
        const dx = this.x + this.width / 2 - (player.x + player.width / 2);
        const dy = this.y + this.height / 2 - (player.y + player.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // プレイヤーの当たり判定半径（プレイヤーサイズの80%）
        const playerRadius = Math.min(player.width, player.height) / 2 * 0.8;
        
        return distance < this.radius + playerRadius;
    }

    applyStunEffect(player) {
        if (typeof player.applyStun === 'function') {
            player.applyStun(this.stunDuration, this.stunStrength);
        } else {
            // プレイヤーにスタンメソッドがない場合は直接適用
            this.applyDirectStun(player);
        }
        
        console.log(`NoteProjectile: Stun applied to player for ${this.stunDuration} frames`);
    }

    applyDirectStun(player) {
        // プレイヤーの移動を一時的に無効化
        if (typeof player.setStunned === 'function') {
            player.setStunned(true);
            
            // スタン時間後に解除
            setTimeout(() => {
                if (player && typeof player.setStunned === 'function') {
                    player.setStunned(false);
                }
            }, this.stunDuration * 16.67); // フレーム数をミリ秒に変換
        }
        
        // スタン中の視覚効果
        if (typeof player.setStunVisual === 'function') {
            player.setStunVisual(true);
            setTimeout(() => {
                if (player && typeof player.setStunVisual === 'function') {
                    player.setStunVisual(false);
                }
            }, this.stunDuration * 16.67);
        }
    }

    createHitEffect() {
        // ヒット時のパーティクルエフェクト
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 30,
                maxLife: 30,
                size: Math.random() * 4 + 2,
                alpha: 1.0,
                color: this.noteColor
            });
        }
        
        // スタンエフェクトの音
        if (this.game.koukaonManager) {
            this.game.koukaonManager.playSE('set');
        }
    }

    updateParticles() {
        // パーティクルを更新
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            particle.alpha = particle.life / particle.maxLife;

            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    updateTrailEffect() {
        // 軌跡エフェクトを更新
        this.trailEffect.push({
            x: this.x + this.width / 2,
            y: this.y + this.height / 2,
            life: 15,
            maxLife: 15,
            alpha: 0.6
        });
        
        for (let i = this.trailEffect.length - 1; i >= 0; i--) {
            const trail = this.trailEffect[i];
            trail.life--;
            trail.alpha = (trail.life / trail.maxLife) * 0.6;
            
            if (trail.life <= 0) {
                this.trailEffect.splice(i, 1);
            }
        }
    }

    draw(ctx, scrollX, scrollY) {
        const drawX = this.x - scrollX;
        const drawY = this.y - scrollY + this.floatOffset;
        
        ctx.save();
        
        // 軌跡エフェクトを描画
        this.drawTrailEffect(ctx, scrollX, scrollY);
        
        // パーティクルを描画
        this.drawParticles(ctx, scrollX, scrollY);
        
        // 音符を描画
        ctx.translate(drawX + this.width / 2, drawY + this.height / 2);
        ctx.rotate(this.rotationAngle);
        
        // 音符の形状を描画
        this.drawNoteShape(ctx);
        
        ctx.restore();
    }

    drawNoteShape(ctx) {
        const centerX = 0;
        const centerY = 0;
        const size = 8;
        
        // 音符の種類に応じて描画
        switch (this.noteType) {
            case 0: // 四分音符
                this.drawQuarterNote(ctx, centerX, centerY, size);
                break;
            case 1: // 八分音符
                this.drawEighthNote(ctx, centerX, centerY, size);
                break;
            case 2: // 二分音符
                this.drawHalfNote(ctx, centerX, centerY, size);
                break;
            case 3: // 全音符
                this.drawWholeNote(ctx, centerX, centerY, size);
                break;
        }
    }

    drawQuarterNote(ctx, x, y, size) {
        // 四分音符（黒い音符）
        ctx.fillStyle = this.noteColor;
        ctx.strokeStyle = this.noteOutlineColor;
        ctx.lineWidth = 1;
        
        // 音符の頭（楕円）
        ctx.beginPath();
        ctx.ellipse(x, y, size, size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // 音符の幹
        ctx.beginPath();
        ctx.moveTo(x + size, y);
        ctx.lineTo(x + size, y - size * 2);
        ctx.stroke();
    }

    drawEighthNote(ctx, x, y, size) {
        // 八分音符（黒い音符 + 旗）
        this.drawQuarterNote(ctx, x, y, size);
        
        // 旗
        ctx.beginPath();
        ctx.moveTo(x + size, y - size * 2);
        ctx.quadraticCurveTo(x + size * 1.5, y - size * 1.5, x + size * 2, y - size * 1.8);
        ctx.stroke();
    }

    drawHalfNote(ctx, x, y, size) {
        // 二分音符（白い音符）
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = this.noteOutlineColor;
        ctx.lineWidth = 1;
        
        // 音符の頭（楕円）
        ctx.beginPath();
        ctx.ellipse(x, y, size, size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // 音符の幹
        ctx.beginPath();
        ctx.moveTo(x + size, y);
        ctx.lineTo(x + size, y - size * 2);
        ctx.stroke();
    }

    drawWholeNote(ctx, x, y, size) {
        // 全音符（白い音符、幹なし）
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = this.noteOutlineColor;
        ctx.lineWidth = 1;
        
        // 音符の頭（楕円）
        ctx.beginPath();
        ctx.ellipse(x, y, size, size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    drawTrailEffect(ctx, scrollX, scrollY) {
        ctx.save();
        for (const trail of this.trailEffect) {
            ctx.globalAlpha = trail.alpha;
            ctx.fillStyle = this.glowColor;
            ctx.beginPath();
            ctx.arc(
                trail.x - scrollX,
                trail.y - scrollY,
                8,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
        ctx.restore();
    }

    drawParticles(ctx, scrollX, scrollY) {
        ctx.save();
        for (const particle of this.particles) {
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = particle.color;
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

    // 音符の滞留時間を延長
    extendLifeTime(additionalFrames) {
        this.lifeTime += additionalFrames;
        console.log(`NoteProjectile: Life time extended by ${additionalFrames} frames`);
    }

    // スタン効果を強化
    enhanceStunEffect(durationMultiplier, strengthMultiplier) {
        this.stunDuration = Math.floor(this.stunDuration * durationMultiplier);
        this.stunStrength = Math.min(1.0, this.stunStrength * strengthMultiplier);
        console.log(`NoteProjectile: Stun enhanced - Duration: ${this.stunDuration}, Strength: ${this.stunStrength}`);
    }
}
