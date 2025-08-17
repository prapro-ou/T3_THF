export class FollowOtomoBehavior {
    constructor(otomo) {
        this.otomo = otomo;
        this.imageName = 'monkey'; // サルの画像
    }

    update(player, deltaTime) {
        const dx = player.x - this.otomo.x;
        const dy = player.y - this.otomo.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 30) {
            this.otomo.x += (dx / dist) * this.otomo.speed * deltaTime;
            this.otomo.y += (dy / dist) * this.otomo.speed * deltaTime;
        }

        // プレイヤーの近くにいる敵だけを攻撃
        const target = this.otomo.findEnemyNearPlayer(200);
        if (target && this.otomo.canShoot) {
            this.otomo.attackTarget(target, 'projectile');
            this.otomo.canShoot = false;
            setTimeout(() => this.otomo.canShoot = true, this.otomo.game.getOtomoAttackCooldown());
        }
    }

    getColor() {
        return '#8B4513'; // 茶色（サルの色）
    }

    getImageName() {
        return this.imageName;
    }
}