import { Character } from './base/Character.js';
import { Projectile } from './Projectile.js';
import { FollowOtomoBehavior } from './OtomoFile/followOtomo.js';
import { WanderOtomoBehavior } from './OtomoFile/wanderOtomo.js';
import { ChargeOtomoBehavior } from './OtomoFile/chargeOtomo.js';

export class Otomo extends Character {
    constructor(game, x, y) {
        super(game, x, y, 50, 50, '#8B4513', 20);
        this.speed = 140;
        this.wanderRadius = 200;
        this.canShoot = true;

        // 攻撃SEカウント
        this.attackSECount = 0;

        // 移動方向を追跡（1: 右向き, -1: 左向き）
        this.direction = 1;
        this.lastX = x;

        // 画像の読み込み
        this.images = {
            dog: new Image(),
            monkey: new Image(),
            bird: new Image()
        };

        this.images.dog.src = 'assets/characters/otomo/dog.png';
        this.images.monkey.src = 'assets/characters/otomo/monkey.png';
        this.images.bird.src = 'assets/characters/otomo/bird.png';

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
        // 移動方向を更新
        if (this.x !== this.lastX) {
            this.direction = this.x > this.lastX ? 1 : -1;
            this.lastX = this.x;
        }

        // オトモの速度はプレイヤーに追従
        this.speed = (player && player.speed) ? player.speed * 40 : 140;
        this.behavior.update(player, deltaTime);
    }

    draw(ctx, scrollX, scrollY) {
        // 動作モードに応じて画像を選択
        let image;
        const imageName = this.behavior.getImageName ? this.behavior.getImageName() : 'monkey';

        switch (imageName) {
            case 'dog':
                image = this.images.dog;
                break;
            case 'monkey':
                image = this.images.monkey;
                break;
            case 'bird':
                image = this.images.bird;
                break;
            default:
                image = this.images.monkey;
        }

        // 画像が読み込まれている場合は画像を描画、そうでなければ色付きの矩形を描画
        if (image && image.complete) {
            // 方向に応じて画像を反転
            ctx.save();
            if (this.direction === -1) {
                // 左向きの場合は画像を反転
                ctx.scale(-1, 1);
                ctx.drawImage(
                    image,
                    -(this.x - scrollX + this.width / 2),
                    this.y - scrollY - this.height / 2,
                    this.width,
                    this.height
                );
            } else {
                // 右向きの場合は通常描画
                ctx.drawImage(
                    image,
                    this.x - scrollX - this.width / 2,
                    this.y - scrollY - this.height / 2,
                    this.width,
                    this.height
                );
            }
            ctx.restore();
        } else {
            // 画像が読み込まれていない場合は従来の色付き矩形を描画
            ctx.fillStyle = this.behavior.getColor();
            ctx.fillRect(this.x - scrollX, this.y - scrollY, this.width, this.height);
        }
    }

    // type: 'projectile' or 'charge'
    attackTarget(target, type = 'projectile') {
        if (!target) return;
        // ボス鬼判定
        const isBoss = target && (typeof target.constructor === 'function') &&
            (/BossOni/.test(target.constructor.name));

        if (type === 'projectile') {
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const dist = Math.hypot(dx, dy);
            if (dist === 0) return;
            const speed = 5 * 1.2;
            const damage = isBoss ? 5 : 10;
            const projectile = new Projectile(this.game, this.x, this.y, target, speed, damage, 'normal', this, 'otomo');
            this.game.projectileManager.addProjectile(projectile);
        } else if (type === 'charge') {
            // 直接ダメージ
            const damage = isBoss ? 5 : 10;

            if (typeof target.takeDamage === 'function') {
                target.takeDamage(damage);
            } else if (typeof target.hp === 'number') {
                target.hp -= damage;
                if (target.hp <= 0) {
                    target.markedForDeletion = true;
                    this.game.particleManager.createExplosion(
                        target.x + target.width / 2,
                        target.y + target.height / 2,
                        target.color
                    );
                }
            } else {
                target.markedForDeletion = true;
            }
        }
    }

    findEnemyNearPlayer(range) {
        const enemies = this.game.enemyManager.getEnemies();
        const player = this.game.player;
        let closest = null;
        let minDist = Infinity;

        for (const enemy of enemies) {
            if (enemy.markedForDeletion) continue;

            let dist;
            // BossOni系は矩形同士の最短距離で判定
            if (enemy.constructor && enemy.constructor.name.startsWith('BossOni')) {
                const cx = player.x + player.width / 2;
                const cy = player.y + player.height / 2;
                const ex = Math.max(enemy.x, Math.min(cx, enemy.x + enemy.width));
                const ey = Math.max(enemy.y, Math.min(cy, enemy.y + enemy.height));
                dist = Math.hypot(cx - ex, cy - ey);
            } else {
                const dx = enemy.x - player.x;
                const dy = enemy.y - player.y;
                dist = Math.hypot(dx, dy);
            }

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

            let dist;
            // BossOni系は矩形同士の最短距離で判定
            if (enemy.constructor && enemy.constructor.name.startsWith('BossOni')) {
                const cx = this.x + this.width / 2;
                const cy = this.y + this.height / 2;
                const ex = Math.max(enemy.x, Math.min(cx, enemy.x + enemy.width));
                const ey = Math.max(enemy.y, Math.min(cy, enemy.y + enemy.height));
                dist = Math.hypot(cx - ex, cy - ey);
            } else {
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                dist = Math.hypot(dx, dy);
            }

            if (dist <= range && dist < minDist) {
                closest = enemy;
                minDist = dist;
            }
        }

        return closest;
    }

    // momotaro専用：自身の近くの敵をProjectileで攻撃
    //canShootは外部から制御する
    // rangeはデフォルトで1050、cooldownは2000ms
    // これにより、オトモが近くの敵を自動で攻撃する
    // ただし、canShootがfalseの場合は何もしない
    // cooldownが経過するまで再度攻撃しない
    attackNearEnemy(range = 1050, cooldown = 2000) {
        if (!this.canShoot) return;
        const target = this.findEnemyNearSelf(range);
        if (target) {
            this.shootAt(target);
            this.canShoot = false;
            setTimeout(() => this.canShoot = true, cooldown);
        }
    }
}
