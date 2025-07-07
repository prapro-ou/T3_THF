export class Sprite {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }
    draw(ctx, scrollX, scrollY) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - scrollX, this.y - scrollY, this.width, this.height);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(this.x - scrollX, this.y - scrollY, this.width, this.height);
    }
} 