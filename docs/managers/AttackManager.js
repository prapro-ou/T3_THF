import { CollisionManager } from './CollisionManager.js';
import { playSE } from '../managers/KoukaonManager.js'; // 追加

export class AttackManager {
    constructor(game) {
        this.game = game;
        this.collisionManager = game.collisionManager;
        this.attackCircle = null;
        this.damage = 20;
        this.scorePerKill = 10;
    }

    // 剣攻撃（近接）
    handleSwordAttack(event) {
        playSE("click"); // ← 攻撃時に効果音
        const { scrollX, scrollY } = this.game.calcScroll();
        const rect = this.game.canvas.getBoundingClientRect();

        // キャンバス内の座標を計算
        const canvasX = event.clientX - rect.left;
        const canvasY = event.clientY - rect.top;

        // キャンバス座標をワールド座標に変換
        const mouseX = canvasX + scrollX;
        const mouseY = canvasY + scrollY;

        // 剣の攻撃半径（狭める: 80px）
        const attackRadius = 80;
        this.attackCircle = {
            x: mouseX,
            y: mouseY,
            radius: attackRadius,
            timer: 22
        };
        let hitCount = 0;
        const level = this.game.otomoLevel || 1;
        const damage = 10 + (level - 1) * 5;
        this.game.enemyManager.getEnemies().forEach(enemy => {
            const ex = enemy.x + enemy.width / 2;
            const ey = enemy.y + enemy.height / 2;
            const dist = Math.hypot(mouseX - ex, mouseY - ey);
            if (dist <= attackRadius) {
                if (typeof enemy.takeDamage === 'function') {
                    enemy.takeDamage(damage);
                    hitCount++;
                }
            }
        });
        return hitCount;
    }

    // クリック攻撃（弾）
    handleProjectileAttack(event) {
        playSE("click"); // ← 攻撃時に効果音
        const { scrollX, scrollY } = this.game.calcScroll();
        const rect = this.game.canvas.getBoundingClientRect();

        // キャンバス内の座標を計算
        const canvasX = event.clientX - rect.left;
        const canvasY = event.clientY - rect.top;

        // キャンバス座標をワールド座標に変換
        const mouseX = canvasX + scrollX;
        const mouseY = canvasY + scrollY;

        const attackRadius = this.game.player.getAttackRadius();
        this.attackCircle = {
            x: mouseX,
            y: mouseY,
            radius: attackRadius,
            timer: 22
        };
        return this.processAttack(mouseX, mouseY, attackRadius);
    }

    // 既存のhandleAttackは用途に応じて呼び分ける（デフォルトは剣攻撃）
    handleAttack(event, type = 'sword') {
        if (type === 'projectile') {
            return this.handleProjectileAttack(event);
        } else {
            return this.handleSwordAttack(event);
        }
    }

    processAttack(attackX, attackY, attackRadius) {
        let hitCount = 0;
        const player = this.game.player;

        this.game.enemyManager.getEnemies().forEach(enemy => {
            let isHit = false;

            // 高速移動時の攻撃判定
            if (player) {
                const playerPos = player.getPreviousPosition();
                const moveDistance = Math.sqrt(
                    (player.x - playerPos.x) * (player.x - playerPos.x) +
                    (player.y - playerPos.y) * (player.y - playerPos.y)
                );

                if (moveDistance > 10) { // 高速移動時
                    // 線分交差判定を使用
                    isHit = this.collisionManager.checkAttackCollisionWithMovement(
                        playerPos.x, playerPos.y,
                        player.x, player.y,
                        attackRadius, enemy
                    );
                } else {
                    // 通常の判定
                    const ex = (typeof enemy.centerX === 'number') ? enemy.centerX : (enemy.x + enemy.width / 2);
                    const ey = (typeof enemy.centerY === 'number') ? enemy.centerY : (enemy.y + enemy.height / 2);
                    const enemyRadius = (typeof enemy.collisionRadius === 'number') ? enemy.collisionRadius : Math.min(enemy.width, enemy.height) / 2;
                    const playerToEnemyDist = Math.sqrt(
                        Math.pow(player.x - ex, 2) +
                        Math.pow(player.y - ey, 2)
                    );

                    const attackToEnemyDist = Math.sqrt(
                        Math.pow(attackX - ex, 2) +
                        Math.pow(attackY - ey, 2)
                    );

                    isHit = playerToEnemyDist <= attackRadius + enemyRadius || attackToEnemyDist <= attackRadius + enemyRadius;
                }
            } else {
                // プレイヤー情報がない場合の通常判定
                const ex = (typeof enemy.centerX === 'number') ? enemy.centerX : (enemy.x + enemy.width / 2);
                const ey = (typeof enemy.centerY === 'number') ? enemy.centerY : (enemy.y + enemy.height / 2);
                const enemyRadius = (typeof enemy.collisionRadius === 'number') ? enemy.collisionRadius : Math.min(enemy.width, enemy.height) / 2;
                const attackToEnemyDist = Math.sqrt(
                    Math.pow(attackX - ex, 2) +
                    Math.pow(attackY - ey, 2)
                );
                isHit = attackToEnemyDist <= attackRadius + enemyRadius;
            }

            console.log('Enemy Attack Check:', {
                enemyX: enemy.x,
                enemyY: enemy.y,
                enemyCenterX: enemy.x + enemy.width / 2,
                enemyCenterY: enemy.y + enemy.height / 2,
                attackRadius: attackRadius,
                isHit: isHit,
                enemyHealth: enemy.health
            });

            if (isHit) {
                enemy.takeDamage(this.damage);
                if (!enemy.isAlive) {
                    enemy.markedForDeletion = true;
                    this.game.gameState.addScore(this.scorePerKill);
                    hitCount++;
                    this.game.particleManager.createExplosion(
                        enemy.x + enemy.width / 2,
                        enemy.y + enemy.height / 2,
                        enemy.color
                    );
                }
            }
        });

        return hitCount;
    }

    updateAttackCircle() {
        if (this.attackCircle && this.attackCircle.timer > 0) {
            this.attackCircle.timer--;
        }
    }

    getAttackCircle() {
        return this.attackCircle;
    }

    reset() {
        this.attackCircle = null;
    }
}
