import { Character } from './base/Character.js';
import { Projectile } from './Projectile.js';
import { FollowOtomoBehavior } from './OtomoFile/followOtomo.js';
import { WanderOtomoBehavior } from './OtomoFile/wanderOtomo.js';
import { ChargeOtomoBehavior } from './OtomoFile/chargeOtomo.js';

export class Otomo extends Character {
    constructor(game, x, y) {
        super(game, x, y, 20, 20, '#8B4513', 20);
        this.speed = 100;
        this.wanderRadius = 200;
        this.canShoot = true;

        this.behaviors = {
            follow: new FollowOtomoBehavior(this),
            wander: new WanderOtomoBehavior(this),
            charge: new ChargeOtomoBehavior(this)
        };
        this.setMode('follow');
    }

    setMode(mode) {
        this.mode = mode;
        this.behavior = this.behaviors[mode];
    }

    updateBehavior(player, deltaTime) {
        this.behavior.update(player, deltaTime);
    }

    draw(ctx, scrollX, scrollY) {
        ctx.fillStyle = this.behavior.getColor();
        ctx.fillRect(this.x - scrollX, this.y - scrollY, this.width, this.height);
    }

    shootAt(target) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist === 0) return;

        const speed = 5;
        const projectile = new Projectile(this.game, this.x, this.y, target, speed, 10);
        this.game.projectileManager.addProjectile(projectile);
    }

    findEnemyNearPlayer(range) {
        const enemies = this.game.enemyManager.getEnemies();
        const player = this.game.player;
        let closest = null;
        let minDist = Infinity;

        for (const enemy of enemies) {
            if (enemy.markedForDeletion) continue;

            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const dist = Math.hypot(dx, dy);

            if (dist <= range && dist < minDist) {
                closest = enemy;
                minDist = dist;
            }
        }

        return closest;
    }

    findEnemyNearSelf(range) {
        const enemies = this.game.enemyManager.getEnemies();
        let closest = null;
        let minDist = Infinity;

        for (const enemy of enemies) {
            if (enemy.markedForDeletion) continue;

            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.hypot(dx, dy);

            if (dist <= range && dist < minDist) {
                closest = enemy;
                minDist = dist;
            }
        }

        return closest;
    }
} 