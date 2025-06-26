export class Particle {
    constructor(game, x, y, color) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.size = Math.random() * 7 + 3;
        this.speedX = Math.random() * 6 - 3;
        this.speedY = Math.random() * 6 - 3;
        this.color = color;
        this.life = 30;
        this.markedForDeletion = false;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life--;
        if (this.life <= 0) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx, scrollX, scrollY) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life / 30;
        ctx.fillRect(this.x - scrollX, this.y - scrollY, this.size, this.size);
        ctx.globalAlpha = 1;
    }
} 