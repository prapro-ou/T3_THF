import { RedOni, BlueOni, BlackOni, BossOni, BossOni1, BossOni2, BossOni3, BossOni4, BossOni5 } from '../entities/enemies/index.js';
import { CollisionManager } from './CollisionManager.js';
import { EnemyRenderer } from '../components/EnemyRenderer.js';

/**
 * 敵管理クラス
 * 単一責任: 敵の生成、更新、描画の管理
 */
export class EnemyManager {
    static INITIAL_ENEMY_SPAWN_INTERVAL = 100;
    static MIN_ENEMY_SPAWN_INTERVAL = 30;
    static SPAWN_INTERVAL_DECREASE_RATE = 2;
    static SPAWN_INTERVAL_DECREASE_FREQUENCY = 300;

    constructor(game, collisionManager) {
        this.game = game;
        this.collisionManager = collisionManager;
        this.enemies = [];
        this.frame = 0;
        this.spawnTimer = 0;
        this.spawnInterval = 60; // 60フレームごとに敵を生成
        this.maxEnemies = 20;
        
        // 単一責任の原則: 描画責任を統合
        this.renderer = new EnemyRenderer(game.renderer);
    }

    update() {
        this.spawnTimer++;
        if (this.spawnTimer >= this.spawnInterval && this.enemies.length < this.maxEnemies) {
            this.spawnEnemy();
            this.spawnTimer = 0;
        }

        // 敵の更新
        this.enemies.forEach(enemy => {
            enemy.update();
        });

        // 削除マークされた敵を削除
        this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);

        // 敵同士の重複を解決
        for (let i = 0; i < this.enemies.length; i++) {
            for (let j = i + 1; j < this.enemies.length; j++) {
                this.collisionManager.resolveEnemyOverlap(this.enemies[i], this.enemies[j]);
            }
        }

        // 画面外の敵を削除
        const { width: mapWidth, height: mapHeight } = this.game.cameraManager.getMapDimensions();
        this.enemies = this.enemies.filter(enemy => 
            !this.collisionManager.isEnemyOutOfBounds(enemy, mapWidth, mapHeight)
        );
    }

    // 単一責任の原則: 描画責任を統合
    draw(ctx, scrollX, scrollY) {
        this.enemies.forEach(enemy => {
            this.renderer.drawEnemy(enemy, ctx, scrollX, scrollY);
        });
    }

    spawnEnemy() {
        const enemyTypes = [RedOni, BlueOni, BlackOni];
        const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        const enemy = new randomType(this.game);
        this.enemies.push(enemy);
    }

    spawnBoss(bossType = 0) {
        let boss;
        switch (bossType) {
            case 1:
                boss = new BossOni1(this.game); break;
            case 2:
                boss = new BossOni2(this.game); break;
            case 3:
                boss = new BossOni3(this.game); break;
            case 4:
                boss = new BossOni4(this.game); break;
            case 5:
                boss = new BossOni5(this.game); break;
            default:
                boss = new BossOni(this.game); break;
        }
        this.enemies.push(boss);
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
        this.frame++;
    }

    reset() {
        this.enemies = [];
        this.frame = 0;
        this.spawnTimer = 0;
    }
} 