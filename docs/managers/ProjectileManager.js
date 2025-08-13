import { Projectile } from '../entities/Projectile.js';
import { SpriteSheet } from '../utils/SpriteSheet.js';

export class ProjectileManager {
    constructor(game) {
        this.game = game;
        this.projectiles = [];
        this.cannonBallSpriteSheet = null;
        this.cannonBallLoaded = false;
    }

    // cannon_ballのスプライトシート読み込み
    preloadCannonBallSpriteSheet(callback) {
        console.log("Starting cannon ball sprite sheet preload");
        if (this.cannonBallLoaded) {
            console.log("Cannon ball already loaded");
            return callback();
        }
        
        fetch('assets/effects/boss_attack/cannon_ball.json')
            .then(res => {
                if (!res.ok) throw new Error('Cannon Ball JSON not found');
                console.log('Cannon Ball JSON fetch success');
                return res.json();
            })
            .then(json => {
                console.log('Cannon Ball JSON parsed:', json);
                let retryCount = 0;
                const maxRetries = 10;
                const tryLoadImage = () => {
                    const img = new Image();
                    img.src = `assets/effects/boss_attack/cannon_ball.png?${new Date().getTime()}`;
                    console.log(`Trying to load cannon ball image, attempt`, retryCount + 1, 'src:', img.src);
                    img.onload = () => {
                        console.log('Cannon Ball image loaded successfully');
                        this.cannonBallSpriteSheet = new SpriteSheet(img, json);
                        this.cannonBallLoaded = true;
                        console.log('Cannon Ball sprite sheet created:', this.cannonBallSpriteSheet);
                        callback();
                    };
                    img.onerror = () => {
                        console.log(`Cannon Ball image load failed, attempt`, retryCount + 1, 'src:', img.src);
                        retryCount++;
                        if (retryCount < maxRetries) {
                            setTimeout(tryLoadImage, 500);
                        } else {
                            console.log(`Cannon Ball image load failed after`, maxRetries, 'attempts');
                            callback();
                        }
                    };
                };
                tryLoadImage();
            })
            .catch(err => {
                console.log(`Cannon Ball JSON fetch or image load failed:`, err);
                callback();
            });
    }

    addProjectile(projectile) {
        this.projectiles.push(projectile);
    }

    update(deltaTime) {
        console.log('ProjectileManager: Updating', this.projectiles.length, 'projectiles');
        this.projectiles.forEach((p, index) => {
            console.log(`ProjectileManager: Updating projectile ${index}, type: ${p.type || 'unknown'}, markedForDeletion: ${p.markedForDeletion}`);
            p.update(deltaTime);
            
            // お札の当たり判定をチェック
            if (p.type === 'ofuda' && this.game.player && !p.markedForDeletion) {
                console.log('ProjectileManager: Checking ofuda collision with player');
                if (p.checkPlayerCollision && p.checkPlayerCollision(this.game.player)) {
                    console.log('ProjectileManager: Ofuda hit player, collision detected');
                    // markedForDeletionはcheckPlayerCollision内で設定されるので、ここでは設定しない
                }
            }
        });
        this.projectiles = this.projectiles.filter(p => !p.markedForDeletion);
        console.log('ProjectileManager: After cleanup,', this.projectiles.length, 'projectiles remaining');
    }

    draw(ctx, scrollX, scrollY) {
        console.log("ProjectileManager: Drawing", this.projectiles.length, "projectiles");
        this.projectiles.forEach((p, index) => {
            console.log(`ProjectileManager: Drawing projectile ${index}, type: ${p.type || 'unknown'}, position: (${p.x}, ${p.y})`);
            p.draw(ctx, scrollX, scrollY);
        });
    }

    reset() {
        this.projectiles = [];
    }

    getProjectiles() {
        return this.projectiles;
    }

    spawnEnemyProjectile(x, y, target, speed = 6, damage = 15) {
        // 敵弾（ターゲットはプレイヤー）
        const proj = new Projectile(this.game, x, y, target, speed, damage);
        this.projectiles.push(proj);
    }

    spawnCannonBallProjectile(x, y, target, speed = 6, damage = 15) {
        // cannon_ballタイプの弾（ターゲットはプレイヤー）
        console.log("Creating cannon ball projectile at:", x, y);
        const proj = new Projectile(this.game, x, y, target, speed, damage, 'cannon_ball');
        console.log("Cannon ball projectile created with type:", proj.type);
        this.projectiles.push(proj);
    }

    spawnBlackBallProjectile(x, y, target, speed = 8, damage = 10) {
        // 黒い玉（小さめで速い球）
        console.log("Creating black ball projectile at:", x, y);
        const proj = new Projectile(this.game, x, y, target, speed, damage, 'black_ball');
        console.log("Black ball projectile created with type:", proj.type);
        this.projectiles.push(proj);
    }

    spawnRedBallProjectile(x, y, target, speed = 5, damage = 12) {
        // 赤い玉（曲がる弾）
        console.log("Creating red ball projectile at:", x, y);
        const proj = new Projectile(this.game, x, y, target, speed, damage, 'red_ball');
        console.log("Red ball projectile created with type:", proj.type);
        this.projectiles.push(proj);
    }

    spawnYellowBallProjectile(x, y, target, speed = 5, damage = 12) {
        // 黄色い玉（反対方向に曲がる弾）
        console.log("Creating yellow ball projectile at:", x, y);
        const proj = new Projectile(this.game, x, y, target, speed, damage, 'yellow_ball');
        console.log("Yellow ball projectile created with type:", proj.type);
        this.projectiles.push(proj);
    }
} 