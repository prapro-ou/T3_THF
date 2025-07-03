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
} 