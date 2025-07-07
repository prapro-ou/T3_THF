export class Projectile {
    constructor(game, x, y, target, speed = 5, damage = 10) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.target = target;
        this.speed = speed;
        this.damage = damage;
        this.radius = 5;
        this.markedForDeletion = false;

        // ターゲットが無効な場合は即削除
        if (!target || typeof target.x !== 'number' || typeof target.y !== 'number') {
            this.markedForDeletion = true;
            return;
        }

        const dx = target.x + (target.width || 0) / 2 - x;
        const dy = target.y + (target.height || 0) / 2 - y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1; // 0除算防止
        this.vx = (dx / dist) * speed;
        this.vy = (dy / dist) * speed;
    }

    update() {
        if (!this.target || this.target.markedForDeletion) {
        console.log("Projectile deleted: invalid target");
        this.markedForDeletion = true;
        return;
        }

        this.x += this.vx;
        this.y += this.vy;

        // ターゲット中心との距離で衝突判定
        const ex = this.target.x + (this.target.width || 0) / 2;
        const ey = this.target.y + (this.target.height || 0) / 2;
        const dist = Math.hypot(this.x - ex, this.y - ey);

        if (dist < this.radius + Math.max(this.target.width || 0, this.target.height || 0) / 2) {
            if (typeof this.target.takeDamage === 'function') {
                this.target.takeDamage(this.damage);
            }
            this.markedForDeletion = true;
        }

        // 画面外に出たら削除
        if (
            this.x < 0 || this.x > this.game.MAP_W ||
            this.y < 0 || this.y > this.game.MAP_H
        ) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx, scrollX, scrollY) {
        console.log("Projectile draw at:", this.x - scrollX, this.y - scrollY);
        ctx.beginPath();
        ctx.arc(this.x - scrollX, this.y - scrollY, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ff0';
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.stroke();
    }
} 