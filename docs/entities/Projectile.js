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
        this.lifetime = 0;
        this.maxLifetime = 600; // 10秒間生存（60FPS想定）

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
        this.lifetime++;

        // 生存時間を超えたら削除
        if (this.lifetime >= this.maxLifetime) {
            this.markedForDeletion = true;
            return;
        }

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

        // 画面外判定を緩和（より遠くまで飛ばす）
        const margin = 200; // 画面外200pxまで許容
        const { width: mapWidth, height: mapHeight } = this.game.cameraManager.getMapDimensions();
        if (
            this.x < -margin || this.x > mapWidth + margin ||
            this.y < -margin || this.y > mapHeight + margin
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