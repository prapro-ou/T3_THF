import { playSE } from '../../managers/KoukaonManager.js'; // 追加

export class ChargeOtomoBehavior {
    constructor(otomo) {
        this.otomo = otomo;
        this.chargeTarget = null;
        this.damageInterval = 0.2; // ダメージ間隔（秒）
        this.damageTimer = 0;
        this.imageName = 'dog'; // 犬の画像
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
            this.damageTimer = 0; // 新しいターゲット時はタイマーリセット
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
                this.damageTimer += deltaTime;
                if (this.damageTimer >= this.damageInterval) {
                    this.damageTimer = 0;
                    // 統一関数で攻撃
                    this.otomo.attackTarget(target, 'charge');
                  
                    playSE('dog'); // 攻撃時に効果音dogを鳴らす

                }
                // HPが0以下ならターゲット解除
                if (target.markedForDeletion || target.hp <= 0) {
                    this.chargeTarget = null;
                }
            } else {
                // 離れたらタイマーリセット
                this.damageTimer = 0;
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
            this.damageTimer = 0;
        }
    }

    getColor() {
        return '#8B4513'; // 茶色（犬の色）
    }

    getImageName() {
        return this.imageName;
    }
}
