import { RedOni, BlueOni, BlackOni } from '../entities/Enemy.js';
import { CollisionManager } from './CollisionManager.js';

export class EnemyManager {
    static INITIAL_ENEMY_SPAWN_INTERVAL = 100;
    static MIN_ENEMY_SPAWN_INTERVAL = 30;
    static SPAWN_INTERVAL_DECREASE_RATE = 2;
    static SPAWN_INTERVAL_DECREASE_FREQUENCY = 300;

    constructor(game, collisionManager) {
        this.game = game;
        this.collisionManager = collisionManager;
        this.enemies = [];
        this.currentEnemySpawnInterval = EnemyManager.INITIAL_ENEMY_SPAWN_INTERVAL;
        this.gameFrame = 0;
    }

    update() {
        this.updateEnemySpawn();
        this.updateEnemies();
    }

    updateEnemySpawn() {
        if (this.gameFrame > 0 && this.gameFrame % EnemyManager.SPAWN_INTERVAL_DECREASE_FREQUENCY === 0) {
            this.currentEnemySpawnInterval = Math.max(
                EnemyManager.MIN_ENEMY_SPAWN_INTERVAL, 
                this.currentEnemySpawnInterval - EnemyManager.SPAWN_INTERVAL_DECREASE_RATE
            );
        }
        
        const actualSpawnInterval = Math.max(1, Math.floor(this.currentEnemySpawnInterval + (Math.random() * 40 - 20)));
        if (this.gameFrame % actualSpawnInterval === 0) {
            this.spawnEnemy();
        }
    }

    spawnEnemy() {
        let enemy;
        let overlap;
        let tryCount = 0;
        
        do {
            // ランダムに敵を生戁E
            const r = Math.random();
            if (r < 0.65) {
                enemy = new RedOni(this.game);
            } else if (r < 0.9) {
                enemy = new BlueOni(this.game);
            } else {
                enemy = new BlackOni(this.game);
            }

            // 既存�E敵と重なってぁE��ぁE��判宁E
            overlap = this.collisionManager.checkEnemySpawnOverlap(enemy, this.enemies);

            tryCount++;
            // 無限ループ防止�E�E0回試してもダメなら諦める�E�E
            if (tryCount > 20) break;
        } while (overlap);

        this.enemies.push(enemy);
    }

    updateEnemies() {
        const enemiesToKeep = [];
        const { mapWidth, mapHeight } = this.game.renderer.getMapDimensions();
        
        this.enemies.forEach(enemy => {
            enemy.update();
            
            // 敵同士の重なり解涁E
            for (const other of this.enemies) {
                if (other === enemy) continue;
                if (this.collisionManager.checkEnemyOverlap(enemy, other)) {
                    this.collisionManager.resolveEnemyOverlap(enemy, other);
                }
            }
            
            // 画面外に出た敵を削除
            if (this.collisionManager.isEnemyOutOfBounds(enemy, mapWidth, mapHeight)) {
                enemy.markedForDeletion = true;
            }
            
            if (!enemy.markedForDeletion) {
                enemiesToKeep.push(enemy);
            }
        });
        
        this.enemies = enemiesToKeep;
    }

    getEnemies() {
        return this.enemies;
    }

    removeEnemy(enemy) {
        const index = this.enemies.indexOf(enemy);
        if (index > -1) {
            this.enemies.splice(index, 1);
        }
    }

    clearEnemies() {
        this.enemies = [];
    }

    incrementFrame() {
        this.gameFrame++;
    }

    reset() {
        this.enemies = [];
        this.gameFrame = 0;
        this.currentEnemySpawnInterval = EnemyManager.INITIAL_ENEMY_SPAWN_INTERVAL;
    }
} 