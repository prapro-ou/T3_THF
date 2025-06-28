import { distance } from '../utils/Utils.js';

export class Particle {
    constructor(game, x, y, color) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 6 - 3;
        this.speedY = Math.random() * 6 - 3;
        this.gravity = 0.1;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.02;
        this.markedForDeletion = false;
    }

    update() {
        this.speedY += this.gravity;
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
        if (this.life <= 0) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx, scrollX, scrollY) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x - scrollX, this.y - scrollY, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
} 