import { distance } from '../utils/Utils.js';

export class CollisionManager {
    constructor() {}

    // 線分と円の交差判定
    checkLineCircleIntersection(x1, y1, x2, y2, cx, cy, radius) {
        // 線分の方向ベクトル
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        
        if (len === 0) return false;
        
        // 正規化された方向ベクトル
        const ux = dx / len;
        const uy = dy / len;
        
        // 線分の始点から円の中心へのベクトル
        const px = cx - x1;
        const py = cy - y1;
        
        // 線分上の最近接点までの距離
        const t = Math.max(0, Math.min(len, px * ux + py * uy));
        
        // 最近接点の座標
        const closestX = x1 + ux * t;
        const closestY = y1 + uy * t;
        
        // 最近接点から円の中心までの距離
        const distToCenter = Math.sqrt(
            (closestX - cx) * (closestX - cx) + 
            (closestY - cy) * (closestY - cy)
        );
        
        return distToCenter <= radius;
    }

    // 高速移動時のプレイヤー-敵衝突判定
    checkPlayerEnemyCollisionWithMovement(player, enemy, playerPrevX, playerPrevY) {
        // 桃太郎と敵の中心座標を計算
        const playerCenterX = player.x;
        const playerCenterY = player.y;
        const enemyCenterX = enemy.x + enemy.width / 2;
        const enemyCenterY = enemy.y + enemy.height / 2;
        
        // 桃太郎の半径（設定可能なサイズ）
        const playerHitboxSize = player.game.playerHitboxSize || 0.8;
        const playerRadius = Math.min(player.width, player.height) / 2 * playerHitboxSize;
        
        // 敵の半径（より自然な当たり判定のため、大きめに設定）
        const enemyRadius = Math.max(enemy.width, enemy.height) / 2;
        
        // 線分交差判定（高速移動時）
        if (playerPrevX !== undefined && playerPrevY !== undefined) {
            const moveDistance = Math.sqrt(
                (player.x - playerPrevX) * (player.x - playerPrevX) + 
                (player.y - playerPrevY) * (player.y - playerPrevY)
            );
            
            if (moveDistance > 10) { // 高速移動時
                return this.checkLineCircleIntersection(
                    playerPrevX, playerPrevY, 
                    player.x, player.y, 
                    enemyCenterX, enemyCenterY, 
                    playerRadius + enemyRadius
                );
            }
        }
        
        // 通常の円形当たり判定
        const dx = playerCenterX - enemyCenterX;
        const dy = playerCenterY - enemyCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < (playerRadius + enemyRadius);
    }

    checkPlayerEnemyCollision(player, enemy) {
        return this.checkPlayerEnemyCollisionWithMovement(player, enemy);
    }

    checkAttackCollision(attackX, attackY, attackRadius, enemy) {
        const ex = enemy.x + enemy.width / 2;
        const ey = enemy.y + enemy.height / 2;
        const enemyRadius = Math.max(enemy.width, enemy.height) / 2 * 1.1;
        const dist = distance(attackX, ex, attackY, ey);
        const isHit = dist <= attackRadius + enemyRadius;
        
        return isHit;
    }

    // 高速移動時の攻撃判定
    checkAttackCollisionWithMovement(attackStartX, attackStartY, attackEndX, attackEndY, attackRadius, enemy) {
        const ex = enemy.x + enemy.width / 2;
        const ey = enemy.y + enemy.height / 2;
        const enemyRadius = Math.max(enemy.width, enemy.height) / 2 * 1.1;
        
        // 移動距離を計算
        const moveDistance = Math.sqrt(
            (attackEndX - attackStartX) * (attackEndX - attackStartX) + 
            (attackEndY - attackStartY) * (attackEndY - attackStartY)
        );
        
        if (moveDistance > 10) { // 高速移動時
            return this.checkLineCircleIntersection(
                attackStartX, attackStartY,
                attackEndX, attackEndY,
                ex, ey,
                attackRadius + enemyRadius
            );
        } else {
            // 通常の判定
            const dist = distance(attackEndX, ex, attackEndY, ey);
            return dist <= attackRadius + enemyRadius;
        }
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