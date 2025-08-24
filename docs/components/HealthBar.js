export class HealthBar {
    constructor(x, y, width, height, hp, maxHP, color = '#0f0') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.hp = hp;
        this.maxHP = maxHP;
        this.color = color;
    }

    draw(ctx, scrollX, scrollY) {
        // 背景（赤）
        ctx.fillStyle = '#f00';
        ctx.fillRect(this.x - scrollX, this.y - scrollY, this.width, this.height);

        // HP（緑）
        ctx.fillStyle = this.color;
        const ratio = this.hp / this.maxHP;
        ctx.fillRect(this.x - scrollX, this.y - scrollY, this.width * ratio, this.height);
    }
}
