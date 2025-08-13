import { Projectile } from './Projectile.js';

export class OfudaProjectile extends Projectile {
    constructor(game, x, y, targetX, targetY, effectType = 'slow') {
        // お札の速度とサイズを設定
        const speed = 6.0; // さらに速度を上げてプレイヤーに確実に到達させる
        const size = 40; // さらにサイズを大きくして当たり判定を確実にする
        
        // ダミーターゲットを作成（方向計算用）
        const dummyTarget = { x: targetX, y: targetY, width: 0, height: 0 };
        
        super(game, x, y, dummyTarget, speed, 0, 'ofuda');
        
        // お札固有のプロパティ（縦長長方形）
        this.width = size * 0.6; // 幅を狭く
        this.height = size * 1.4; // 高さを高く
        this.radius = Math.max(this.width, this.height) / 2; // 当たり判定用
        
        // 中心座標を設定（当たり判定用）
        this.centerX = this.x + this.width / 2;
        this.centerY = this.y + this.height / 2;
        
        // 基底クラスの速度設定を上書き（お札独自の方向計算）
        const dx = targetX - x;
        const dy = targetY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            this.vx = (dx / distance) * speed;
            this.vy = (dy / distance) * speed;
        } else {
            this.vx = 0;
            this.vy = speed;
        }
        
        // お札の効果タイプ
        this.effectType = effectType; // 'slow', 'poison', 'freeze', 'confuse'
        
        // アニメーション用
        this.rotation = 0;
        this.rotationSpeed = 0.2; // 回転速度を少し遅く
        this.pulseTimer = 0;
        this.pulseSpeed = 0.15; // パルス速度を少し遅く
        
        // お札の見た目を設定
        this.color = this.getEffectColor();
        this.symbol = this.getEffectSymbol();
        
        // ライフタイム（5秒）
        this.lifeTime = 300;
        this.currentLife = 0;
        
        // 軌跡エフェクト用
        this.trailParticles = [];
        this.maxTrailParticles = 5;
        
        console.log('OfudaProjectile: Created with effect type:', this.effectType, 'at position:', this.x, this.y);
    }
    
    getEffectColor() {
        switch (this.effectType) {
            case 'slow':
                return '#4169E1'; // 青（減速）
            case 'poison':
                return '#32CD32'; // 緑（毒）
             default:
                return '#FFD700'; // 金色（デフォルト）
        }
    }
    
    getEffectSymbol() {
        switch (this.effectType) {
            case 'slow':
                return '⏰'; // 時計
            case 'poison':
                return '☠️'; // 毒
            default:
                return '✴️'; // 星
        }
    }
    
    update(deltaTime) {
        console.log('OfudaProjectile: update called, position:', this.x, this.y, 'life:', this.currentLife, '/', this.lifeTime, 'markedForDeletion:', this.markedForDeletion);
        
        // 位置更新
        this.x += this.vx;
        this.y += this.vy;
        
        // 中心座標も更新（当たり判定用）
        this.centerX = this.x + this.width / 2;
        this.centerY = this.y + this.height / 2;
        
        // ライフタイム更新
        this.currentLife++;
        if (this.currentLife >= this.lifeTime) {
            console.log('OfudaProjectile: Life time expired, marking for deletion');
            this.markedForDeletion = true;
        }
        
        // アニメーション更新
        this.rotation += this.rotationSpeed;
        this.pulseTimer += this.pulseSpeed;
        
        // 軌跡エフェクト更新
        this.updateTrailEffect();
        
        // 画面外チェック（範囲を広げて、お札が消えにくくする）
        if (this.x < -200 || this.x > this.game.cameraManager.getMapDimensions().width + 200 ||
            this.y < -200 || this.y > this.game.cameraManager.getMapDimensions().height + 200) {
            console.log('OfudaProjectile: Out of bounds, marking for deletion');
            this.markedForDeletion = true;
        }
    }
    
    updateTrailEffect() {
        // 新しい軌跡パーティクルを追加
        if (this.trailParticles.length < this.maxTrailParticles) {
            this.trailParticles.push({
                x: this.x,
                y: this.y,
                life: 20,
                maxLife: 20,
                alpha: 0.7
            });
        }
        
        // 軌跡パーティクルの更新
        for (let i = this.trailParticles.length - 1; i >= 0; i--) {
            const particle = this.trailParticles[i];
            particle.life--;
            particle.alpha = (particle.life / particle.maxLife) * 0.7;
            
            if (particle.life <= 0) {
                this.trailParticles.splice(i, 1);
            }
        }
    }
    
    checkPlayerCollision(player) {
        // 円形当たり判定
        const dx = this.centerX - player.centerX;
        const dy = this.centerY - player.centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // プレイヤーの当たり判定半径を取得（collisionRadiusが設定されていない場合はデフォルト値を使用）
        const playerRadius = player.collisionRadius || Math.min(player.width, player.height) / 2;
        
        console.log('OfudaProjectile: Collision check - ofuda center:', this.centerX, this.centerY, 'player center:', player.centerX, player.centerY, 'distance:', distance, 'threshold:', this.radius + playerRadius);
        
        if (distance < (this.radius + playerRadius)) {
            console.log('OfudaProjectile: Collision detected! Distance:', distance, 'Threshold:', this.radius + playerRadius);
            console.log('OfudaProjectile: About to apply effect:', this.effectType);
            this.applyEffect(player);
            console.log('OfudaProjectile: Effect applied, marking for deletion');
            this.markedForDeletion = true;
            return true;
        }
        
        return false;
    }
    
    applyEffect(player) {
        console.log('OfudaProjectile: Applying effect to player:', this.effectType);
        
        // 効果音を再生
        if (this.game.koukaonManager) {
            this.game.koukaonManager.playSE('click');
        }
        
        // パーティクルエフェクトを生成
        this.createHitEffect();
        
        // プレイヤーに効果を適用
        switch (this.effectType) {
            case 'slow':
                console.log('OfudaProjectile: Applying slow effect');
                this.applySlowEffect(player);
                break;
            case 'poison':
                console.log('OfudaProjectile: Applying poison effect');
                this.applyPoisonEffect(player);
                break;
            case 'freeze':
                console.log('OfudaProjectile: Applying freeze effect');
                this.applyFreezeEffect(player);
                break;
            case 'confuse':
                console.log('OfudaProjectile: Applying confuse effect');
                this.applyConfuseEffect(player);
                break;
        }
    }
    
    applySlowEffect(player) {
        console.log('OfudaProjectile: applySlowEffect called, player.applySlow exists:', !!player.applySlow);
        
        // 減速効果（3秒間）
        if (player.applySlow) {
            console.log('OfudaProjectile: Calling player.applySlow(180, 0.5)');
            player.applySlow(180, 0.5); // 3秒間、速度50%
        } else {
            console.log('OfudaProjectile: player.applySlow method not found!');
        }
        
        // 視覚効果
        this.createSlowEffectParticles();
    }
    
    applyPoisonEffect(player) {
        console.log('OfudaProjectile: applyPoisonEffect called, player.applyPoison exists:', !!player.applyPoison);
        
        // 毒効果（3秒間、継続ダメージ）
        if (player.applyPoison) {
            console.log('OfudaProjectile: Calling player.applyPoison(300, 1, 30)');
            player.applyPoison(180, 10, 30); // 3秒間、10ダメージ、30フレーム間隔
        } else {
            console.log('OfudaProjectile: player.applyPoison method not found!');
        }
        
        // 視覚効果
        this.createPoisonEffectParticles();
    }
    

    
    createHitEffect() {
        // ヒット時のパーティクルエフェクト
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const speed = 2 + Math.random() * 2;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            this.game.particleManager.createParticle(
                this.x,
                this.y,
                vx,
                vy,
                this.color,
                30,
                0.8
            );
        }
    }
    
    createSlowEffectParticles() {
        // 減速効果のパーティクル
        for (let i = 0; i < 5; i++) {
            this.game.particleManager.createParticle(
                this.x + (Math.random() - 0.5) * 40,
                this.y + (Math.random() - 0.5) * 40,
                (Math.random() - 0.5) * 1,
                (Math.random() - 0.5) * 1,
                '#4169E1',
                60,
                0.6
            );
        }
    }
    
    createPoisonEffectParticles() {
        // 毒効果のパーティクル
        for (let i = 0; i < 6; i++) {
            this.game.particleManager.createParticle(
                this.x + (Math.random() - 0.5) * 50,
                this.y + (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 1.5,
                '#32CD32',
                90,
                0.7
            );
        }
    }
    

    
    draw(ctx, scrollX, scrollY) {
        console.log('OfudaProjectile: draw method called, position:', this.x, this.y, 'effect:', this.effectType);
        
        const screenX = this.x - scrollX;
        const screenY = this.y - scrollY;
        
        // 軌跡エフェクトを描画
        this.drawTrailEffect(ctx, scrollX, scrollY);
        
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.rotation);
        
        // パルス効果
        const pulseScale = 1 + Math.sin(this.pulseTimer) * 0.1;
        ctx.scale(pulseScale, pulseScale);
        
        // お札の背景（和紙風）- 縦長長方形
        ctx.fillStyle = '#F5F5DC';
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // お札の枠線
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // 効果シンボル（縦長に合わせて調整）
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = this.color;
        ctx.fillText(this.symbol, 0, 0);
        
        // お札の模様（縦長長方形に適した模様）
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        
        // 縦線（中央）
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2);
        ctx.lineTo(0, this.height / 2);
        ctx.stroke();
        
        // 縦線（左右）
        ctx.beginPath();
        ctx.moveTo(-this.width / 3, -this.height / 2);
        ctx.lineTo(-this.width / 3, this.height / 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(this.width / 3, -this.height / 2);
        ctx.lineTo(this.width / 3, this.height / 2);
        ctx.stroke();
        
        // 横線（中央）
        ctx.beginPath();
        ctx.moveTo(-this.width / 2, 0);
        ctx.lineTo(this.width / 2, 0);
        ctx.stroke();
        
        // 横線（上下）
        ctx.beginPath();
        ctx.moveTo(-this.width / 2, -this.height / 3);
        ctx.lineTo(this.width / 2, -this.height / 3);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(-this.width / 2, this.height / 3);
        ctx.lineTo(this.width / 2, this.height / 3);
        ctx.stroke();
        
        ctx.restore();
    }
    
    drawTrailEffect(ctx, scrollX, scrollY) {
        // 軌跡パーティクルを描画（縦長長方形に適した形）
        this.trailParticles.forEach(particle => {
            const screenX = particle.x - scrollX;
            const screenY = particle.y - scrollY;
            
            ctx.save();
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = this.color;
            
            // 縦長の軌跡パーティクル
            ctx.fillRect(screenX - 2, screenY - 4, 4, 8);
            
            ctx.restore();
        });
    }
}
