import { Particle } from '../entities/Particle.js';

export class ParticleManager {
    constructor(game) {
        this.game = game;
        this.particles = [];
    }

    createParticle(x, y, vx, vy, color, lifeTime, alpha) {
        this.particles.push(new Particle(this.game, x, y, vx, vy, color, lifeTime, alpha));
    }

    createExplosion(x, y, color, count = 15) {
        for (let i = 0; i < count; i++) {
            const vx = (Math.random() - 0.5) * 4;
            const vy = (Math.random() - 0.5) * 4;
            this.createParticle(x, y, vx, vy, color, 60, 1.0);
        }
    }

    update() {
        this.particles.forEach(particle => {
            particle.update();
        });
        
        // 削除対象のパ�EチE��クルを除去
        this.particles = this.particles.filter(particle => !particle.markedForDeletion);
    }

    draw(scrollX, scrollY) {
        this.particles.forEach(particle => {
            particle.draw(this.game.renderer.ctx, scrollX, scrollY);
        });
    }

    getParticles() {
        return this.particles;
    }

    clearParticles() {
        this.particles = [];
    }
} 