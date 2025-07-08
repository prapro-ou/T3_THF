import { Projectile } from '../entities/Projectile.js';

export class ProjectileManager {
    constructor(game) {
        this.game = game;
        this.projectiles = [];
    }

    addProjectile(projectile) {
        this.projectiles.push(projectile);
    }

    update(deltaTime) {
        this.projectiles.forEach(p => p.update(deltaTime));
        this.projectiles = this.projectiles.filter(p => !p.markedForDeletion);
    }

    draw(ctx, scrollX, scrollY) {
        console.log("Drawing", this.projectiles.length, "projectiles");
        this.projectiles.forEach(p => p.draw(ctx, scrollX, scrollY));
    }

    reset() {
        this.projectiles = [];
    }

    spawnEnemyProjectile(x, y, target, speed = 6, damage = 15) {
        // 敵弾（ターゲットはプレイヤー）
        const proj = new Projectile(this.game, x, y, target, speed, damage);
        this.projectiles.push(proj);
    }
} 