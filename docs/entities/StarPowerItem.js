import { Enemy } from '../entities/base/Enemy.js';

export class StarPowerItem {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.radius = 18;
        this.collected = false;
        this.spawnTime = Date.now();
    }

    update() {
        // 10秒経過で自動消滅
        if (Date.now() - this.spawnTime > 10000) this.collected = true;
    }

    draw(ctx, scrollX, scrollY) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x - scrollX, this.y - scrollY, this.radius, 0, 2 * Math.PI);
        ctx.fillStyle = 'gold';
        ctx.shadowColor = 'yellow';
        ctx.shadowBlur = 16;
        ctx.fill();
        ctx.restore();
        // 星型やアニメーションは必要に応じて追加
    }
}
