import { distance } from '../utils/Utils.js';

export class CollisionManager {
    constructor() {}

    checkPlayerEnemyCollision(player, enemy) {
        return (
            enemy.x < player.x + player.width / 2 &&
            enemy.x + enemy.width > player.x - player.width / 2 &&
            enemy.y < player.y + player.height / 2 &&
            enemy.y + enemy.height > player.y - player.height / 2
        );
    }

    checkAttackCollision(attackX, attackY, attackRadius, enemy) {
        const ex = enemy.x + enemy.width / 2;
        const ey = enemy.y + enemy.height / 2;
        const enemyRadius = Math.max(enemy.width, enemy.height) / 2 * 1.1;
        const dist = distance(attackX, ex, attackY, ey);
        const isHit = dist <= attackRadius + enemyRadius;
        
        // デバッグ情報をコンソールに出力
        console.log('Collision Debug:', {
            attackX: attackX,
            attackY: attackY,
            attackRadius: attackRadius,
            enemyX: enemy.x,
            enemyY: enemy.y,
            enemyCenterX: ex,
            enemyCenterY: ey,
            enemyRadius: enemyRadius,
            distance: dist,
            isHit: isHit
        });
        
        return isHit;
    }

    checkEnemyOverlap(enemy1, enemy2) {
        const dx = (enemy1.x + enemy1.width / 2) - (enemy2.x + enemy2.width / 2);
        const dy = (enemy1.y + enemy1.height / 2) - (enemy2.y + enemy2.height / 2);
        const dist = distance(
            enemy1.x + enemy1.width / 2, 
            enemy1.y + enemy1.height / 2, 
            enemy2.x + enemy2.width / 2, 
            enemy2.y + enemy2.height / 2
        );
        const minDist = (Math.max(enemy1.width, enemy1.height) + Math.max(enemy2.width, enemy2.height)) / 2;
        return dist > 0 && dist < minDist;
    }

    resolveEnemyOverlap(enemy1, enemy2) {
        const dx = (enemy1.x + enemy1.width / 2) - (enemy2.x + enemy2.width / 2);
        const dy = (enemy1.y + enemy1.height / 2) - (enemy2.y + enemy2.height / 2);
        const dist = distance(
            enemy1.x + enemy1.width / 2, 
            enemy1.y + enemy1.height / 2, 
            enemy2.x + enemy2.width / 2, 
            enemy2.y + enemy2.height / 2
        );
        const minDist = (Math.max(enemy1.width, enemy1.height) + Math.max(enemy2.width, enemy2.height)) / 2;
        
        if (dist > 0 && dist < minDist) {
            const overlap = minDist - dist;
            enemy1.x += (dx / dist) * (overlap / 2);
            enemy1.y += (dy / dist) * (overlap / 2);
            enemy2.x -= (dx / dist) * (overlap / 2);
            enemy2.y -= (dy / dist) * (overlap / 2);
        }
    }

    checkEnemySpawnOverlap(newEnemy, existingEnemies) {
        return existingEnemies.some(e => {
            const dx = (newEnemy.x + newEnemy.width / 2) - (e.x + e.width / 2);
            const dy = (newEnemy.y + newEnemy.height / 2) - (e.y + e.height / 2);
            const minDist = (Math.max(newEnemy.width, newEnemy.height) + Math.max(e.width, e.height)) / 2;
            return Math.abs(dx) < minDist && Math.abs(dy) < minDist;
        });
    }

    isEnemyOutOfBounds(enemy, mapWidth, mapHeight) {
        return (
            enemy.x < -enemy.width * 2 || 
            enemy.x > mapWidth + enemy.width * 2 ||
            enemy.y < -enemy.height * 2 || 
            enemy.y > mapHeight + enemy.height * 2
        );
    }
} 