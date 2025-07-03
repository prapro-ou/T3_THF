export class Character {
    constructor(game, x, y, width, height, color, maxHP) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.maxHP = maxHP;
        this.hp = maxHP;
    }

    draw(ctx, scrollX, scrollY) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - scrollX, this.y - scrollY, this.width, this.height);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(this.x - scrollX, this.y - scrollY, this.width, this.height);
        // HPバ�E描画
        const barWidth = this.width;
        const barHeight = 10;
        const hpRatio = Math.max(0, this.hp / this.maxHP);
        ctx.fillStyle = '#222';
        ctx.fillRect(this.x - scrollX, this.y - scrollY - barHeight - 4, barWidth, barHeight);
        ctx.fillStyle = '#0f0';
        ctx.fillRect(this.x - scrollX, this.y - scrollY - barHeight - 4, barWidth * hpRatio, barHeight);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(this.x - scrollX, this.y - scrollY - barHeight - 4, barWidth, barHeight);
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.hp = this.maxHP;
    }
} 