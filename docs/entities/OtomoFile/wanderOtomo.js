export class WanderOtomoBehavior {
    constructor(otomo) {
        this.otomo = otomo;
        this.wanderTarget = null;
    }

    update(player, deltaTime) {
        // ランダムな目標地点を更新
        if (
            !this.wanderTarget ||
            Math.hypot(this.otomo.x - this.wanderTarget.x, this.otomo.y - this.wanderTarget.y) < 5
        ) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * this.otomo.wanderRadius;
            this.wanderTarget = {
                x: player.x + Math.cos(angle) * r,
                y: player.y + Math.sin(angle) * r
            };
        }

        // 目標地点に向かって移動
        const dx = this.wanderTarget.x - this.otomo.x;
        const dy = this.wanderTarget.y - this.otomo.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 1) {
            this.otomo.x += (dx / dist) * this.otomo.speed * deltaTime;
            this.otomo.y += (dy / dist) * this.otomo.speed * deltaTime;
        }

        // ✅ オトモ自身の周囲にいる敵だけを攻撃
        const target = this.otomo.findEnemyNearSelf(150);
        if (target && this.otomo.canShoot) {
            this.otomo.shootAt(target);
            this.otomo.canShoot = false;
            setTimeout(() => this.otomo.canShoot = true, 1000);
        }
    }

    getColor() {
        return '#32CD32'; // ライムグリーン
    }
} 