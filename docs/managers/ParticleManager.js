import { Particle } from '../entities/Particle.js';

export class ParticleManager {
    constructor(game) {
        this.game = game;
        this.particles = [];
    }

    createParticle(x, y, color) {
        this.particles.push(new Particle(this.game, x, y, color));
    }

    createExplosion(x, y, color, count = 15) {
        for (let i = 0; i < count; i++) {
            this.createParticle(x, y, color);
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