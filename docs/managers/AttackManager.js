import { CollisionManager } from './CollisionManager.js';

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
        const { scrollX, scrollY } = this.game.calcScroll();
        const rect = this.game.canvas.getBoundingClientRect();
        const canvasX = event.clientX - rect.left;
        const canvasY = event.clientY - rect.top;
        const { width: viewWidth, height: viewHeight } = this.game.renderer.getViewDimensions();
        const { width: mapWidth, height: mapHeight } = this.game.renderer.getMapDimensions();
        let drawX = viewWidth / 2 - this.game.player.width / 2;
        let drawY = viewHeight / 2 - this.game.player.height / 2;
        if (this.game.player.x < viewWidth / 2) drawX = this.game.player.x - scrollX - this.game.player.width / 2;
        if (this.game.player.x > mapWidth - viewWidth / 2) drawX = this.game.player.x - scrollX - this.game.player.width / 2;
        if (this.game.player.y < viewHeight / 2) drawY = this.game.player.y - scrollY - this.game.player.height / 2;
        if (this.game.player.y > mapHeight - viewHeight / 2) drawY = this.game.player.y - scrollY - this.game.player.height / 2;
        const playerDrawCenterX = drawX + this.game.player.width / 2;
        const playerDrawCenterY = drawY + this.game.player.height / 2;
        const relativeX = canvasX - playerDrawCenterX;
        const relativeY = canvasY - playerDrawCenterY;
        const mouseX = this.game.player.x + relativeX;
        const mouseY = this.game.player.y + relativeY;
        // 剣の攻撃半径（狭める: 80px）
        const attackRadius = 80;
        this.attackCircle = {
            x: mouseX,
            y: mouseY,
            radius: attackRadius,
            timer: 10
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
        const { scrollX, scrollY } = this.game.calcScroll();
        const rect = this.game.canvas.getBoundingClientRect();
        const canvasX = event.clientX - rect.left;
        const canvasY = event.clientY - rect.top;
        const { width: viewWidth, height: viewHeight } = this.game.renderer.getViewDimensions();
        const { width: mapWidth, height: mapHeight } = this.game.renderer.getMapDimensions();
        let drawX = viewWidth / 2 - this.game.player.width / 2;
        let drawY = viewHeight / 2 - this.game.player.height / 2;
        if (this.game.player.x < viewWidth / 2) drawX = this.game.player.x - scrollX - this.game.player.width / 2;
        if (this.game.player.x > mapWidth - viewWidth / 2) drawX = this.game.player.x - scrollX - this.game.player.width / 2;
        if (this.game.player.y < viewHeight / 2) drawY = this.game.player.y - scrollY - this.game.player.height / 2;
        if (this.game.player.y > mapHeight - viewHeight / 2) drawY = this.game.player.y - scrollY - this.game.player.height / 2;
        const playerDrawCenterX = drawX + this.game.player.width / 2;
        const playerDrawCenterY = drawY + this.game.player.height / 2;
        const relativeX = canvasX - playerDrawCenterX;
        const relativeY = canvasY - playerDrawCenterY;
        const mouseX = this.game.player.x + relativeX;
        const mouseY = this.game.player.y + relativeY;
        const attackRadius = this.game.player.getAttackRadius();
        this.attackCircle = {
            x: mouseX,
            y: mouseY,
            radius: attackRadius,
            timer: 10
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
                    const playerToEnemyDist = Math.sqrt(
                        Math.pow(player.x - (enemy.x + enemy.width / 2), 2) +
                        Math.pow(player.y - (enemy.y + enemy.height / 2), 2)
                    );
                    
                    const attackToEnemyDist = Math.sqrt(
                        Math.pow(attackX - (enemy.x + enemy.width / 2), 2) +
                        Math.pow(attackY - (enemy.y + enemy.height / 2), 2)
                    );
                    
                    isHit = playerToEnemyDist <= attackRadius || attackToEnemyDist <= attackRadius;
                }
            } else {
                // プレイヤー情報がない場合の通常判定
                const attackToEnemyDist = Math.sqrt(
                    Math.pow(attackX - (enemy.x + enemy.width / 2), 2) +
                    Math.pow(attackY - (enemy.y + enemy.height / 2), 2)
                );
                isHit = attackToEnemyDist <= attackRadius;
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