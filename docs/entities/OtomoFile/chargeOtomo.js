export class ChargeOtomoBehavior {
    constructor(otomo) {
        this.otomo = otomo;
        this.chargeTarget = null;
    }

    update(player, deltaTime) {
        const enemies = this.otomo.game.enemyManager.getEnemies();
        const { scrollX, scrollY } = this.otomo.game.calcScroll();
        const screenWidth = this.otomo.game.canvas.width;
        const screenHeight = this.otomo.game.canvas.height;

        const visibleEnemies = enemies.filter(enemy =>
            enemy.x + enemy.width > scrollX &&
            enemy.x < scrollX + screenWidth &&
            enemy.y + enemy.height > scrollY &&
            enemy.y < scrollY + screenHeight &&
            !enemy.markedForDeletion
        );

        if (!this.chargeTarget || this.chargeTarget.markedForDeletion || !visibleEnemies.includes(this.chargeTarget)) {
            let closest = null;
            let minDist = Infinity;
            for (const enemy of visibleEnemies) {
                const dx = enemy.x - this.otomo.x;
                const dy = enemy.y - this.otomo.y;
                const dist = Math.hypot(dx, dy);
                if (dist < minDist) {
                    closest = enemy;
                    minDist = dist;
                }
            }
            this.chargeTarget = closest;
        }

        const target = this.chargeTarget;
        if (target) {
            const dx = target.x - this.otomo.x;
            const dy = target.y - this.otomo.y;
            const dist = Math.hypot(dx, dy);

            if (dist > 1) {
                this.otomo.x += (dx / dist) * this.otomo.speed * deltaTime;
                this.otomo.y += (dy / dist) * this.otomo.speed * deltaTime;
            }

            if (dist < (this.otomo.width + target.width) / 2) {
                // 弾の攻撃力と同じにする
                const level = this.otomo.game.otomoLevel || 1;
                const damage = 10 + (level - 1) * 5;
                if (typeof target.takeDamage === 'function') {
                    target.takeDamage(damage);
                } else if (typeof target.hp === 'number') {
                    target.hp -= damage;
                    if (target.hp <= 0) {
                        target.markedForDeletion = true;
                        this.otomo.game.particleManager.createExplosion(
                            target.x + target.width / 2,
                            target.y + target.height / 2,
                            target.color
                        );
                    }
                } else {
                    target.markedForDeletion = true;
                }
                this.chargeTarget = null;
            }
        } else {
            // 敵が画面内にいないときはプレイヤーに戻る
            const dx = player.x - this.otomo.x;
            const dy = player.y - this.otomo.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 30) {
                this.otomo.x += (dx / dist) * this.otomo.speed * deltaTime;
                this.otomo.y += (dy / dist) * this.otomo.speed * deltaTime;
            }
        }
    }

    getColor() {
        return '#FF4500'; // オレンジレッド
    }
}