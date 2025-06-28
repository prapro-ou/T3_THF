import { CollisionManager } from './CollisionManager.js';

export class AttackManager {
    constructor(game) {
        this.game = game;
        this.collisionManager = game.collisionManager;
        this.attackCircle = null;
        this.damage = 20;
        this.scorePerKill = 10;
    }

    handleAttack(event) {
        const { scrollX, scrollY } = this.game.calcScroll();
        const rect = this.game.canvas.getBoundingClientRect();
        
        // より確実な座標計算
        const canvasX = event.clientX - rect.left;
        const canvasY = event.clientY - rect.top;
        
        // プレイヤー中心からの相対座標で攻撃判定
        const playerCenterX = this.game.canvas.width / 2;
        const playerCenterY = this.game.canvas.height / 2;
        const relativeX = canvasX - playerCenterX;
        const relativeY = canvasY - playerCenterY;
        
        // マップ座標系での攻撃位置
        const mouseX = this.game.player.x + relativeX;
        const mouseY = this.game.player.y + relativeY;
        const attackRadius = this.game.player.getAttackRadius();

        // デバッグ情報をコンソールに出力
        console.log('Attack Debug:', {
            mouseX: mouseX,
            mouseY: mouseY,
            playerX: this.game.player.x,
            playerY: this.game.player.y,
            relativeX: relativeX,
            relativeY: relativeY,
            canvasX: canvasX,
            canvasY: canvasY,
            attackRadius: attackRadius,
            clientX: event.clientX,
            clientY: event.clientY,
            canvasRect: this.game.canvas.getBoundingClientRect()
        });

        // 攻撃範囲の中心座標を保存（アニメーションで描画用）
        this.attackCircle = {
            x: mouseX,
            y: mouseY,
            radius: attackRadius,
            timer: 10
        };

        return this.processAttack(mouseX, mouseY, attackRadius);
    }

    processAttack(attackX, attackY, attackRadius) {
        let hitCount = 0;
        
        this.game.enemyManager.getEnemies().forEach(enemy => {
            // より確実な判定: プレイヤー中心からの距離ベース
            const playerToEnemyDist = Math.sqrt(
                Math.pow(this.game.player.x - (enemy.x + enemy.width / 2), 2) +
                Math.pow(this.game.player.y - (enemy.y + enemy.height / 2), 2)
            );
            
            // 攻撃位置からの距離も計算
            const attackToEnemyDist = Math.sqrt(
                Math.pow(attackX - (enemy.x + enemy.width / 2), 2) +
                Math.pow(attackY - (enemy.y + enemy.height / 2), 2)
            );
            
            // どちらかの距離が攻撃半径内なら当たり
            const isHit = playerToEnemyDist <= attackRadius || attackToEnemyDist <= attackRadius;
            
            console.log('Enemy Attack Check:', {
                enemyX: enemy.x,
                enemyY: enemy.y,
                enemyCenterX: enemy.x + enemy.width / 2,
                enemyCenterY: enemy.y + enemy.height / 2,
                playerToEnemyDist: playerToEnemyDist,
                attackToEnemyDist: attackToEnemyDist,
                attackRadius: attackRadius,
                isHit: isHit
            });
            
            if (isHit) {
                enemy.hp -= this.damage;
                if (enemy.hp <= 0) {
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