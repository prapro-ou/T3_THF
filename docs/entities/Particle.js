import { distance } from '../utils/Utils.js';

export class Particle {
    constructor(game, x, y, vx, vy, color, lifeTime, alpha) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = Math.random() * 3 + 1;
        this.lifeTime = lifeTime || 60; // フレーム数
        this.currentLife = 0;
        this.alpha = alpha || 1.0;
        this.markedForDeletion = false;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.currentLife++;
        
        if (this.currentLife >= this.lifeTime) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx, scrollX, scrollY) {
        ctx.save();
        
        // ライフタイムに応じて透明度を調整
        const lifeRatio = 1 - (this.currentLife / this.lifeTime);
        ctx.globalAlpha = this.alpha * lifeRatio;
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x - scrollX, this.y - scrollY, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
} 