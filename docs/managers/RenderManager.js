export class RenderManager {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.VIEW_W = canvas.width;
        this.VIEW_H = canvas.height;
        this.MAP_W = this.VIEW_W * 3;
        this.MAP_H = this.VIEW_H * 3;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.VIEW_W, this.VIEW_H);
    }

    drawBackground(scrollX, scrollY) {
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(0, 0, this.VIEW_W, this.VIEW_H);
        this.ctx.save();
        this.ctx.translate(-scrollX, -scrollY);
        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 1;
        
        // グリッド描画
        for (let x = 0; x <= this.MAP_W; x += 80) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.MAP_H);
            this.ctx.stroke();
        }
        for (let y = 0; y <= this.MAP_H; y += 80) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.MAP_W, y);
            this.ctx.stroke();
        }
        
        // マップの縁取りを赤に
        this.ctx.strokeStyle = '#f00';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(0, 0, this.MAP_W, this.MAP_H);
        this.ctx.restore();
    }

    drawAttackCircle(attackCircle, scrollX, scrollY) {
        if (attackCircle && attackCircle.timer > 0) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.3;
            this.ctx.beginPath();
            this.ctx.arc(
                attackCircle.x - scrollX,
                attackCircle.y - scrollY,
                attackCircle.radius,
                0, Math.PI * 2
            );
            this.ctx.fillStyle = '#0af';
            this.ctx.fill();
            this.ctx.restore();
        }
    }

    drawSprite(sprite, scrollX, scrollY) {
        sprite.draw(this.ctx, scrollX, scrollY);
    }

    drawHealthBar(healthBar, scrollX, scrollY) {
        healthBar.draw(this.ctx, scrollX, scrollY);
    }

    drawAmmoGauge(x, y, width, height, ratio) {
        this.ctx.fillStyle = '#444';
        this.ctx.fillRect(x, y, width, height);
        this.ctx.fillStyle = '#0af';
        this.ctx.fillRect(x, y, width * ratio, height);
        this.ctx.strokeStyle = '#fff';
        this.ctx.strokeRect(x, y, width, height);
    }

    getViewDimensions() {
        return { width: this.VIEW_W, height: this.VIEW_H };
    }

    getMapDimensions() {
        return { width: this.MAP_W, height: this.MAP_H };
    }
} 