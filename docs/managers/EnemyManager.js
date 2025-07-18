import { RedOni, BlueOni, BlackOni, BossOni, BossOni1, BossOni2, BossOni3, BossOni4, BossOni5 } from '../entities/enemies/index.js';
import { Enemy } from '../entities/base/Enemy.js';
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
        this.renderer = new EnemyRenderer(game);
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

        // 高速移動時のプレイヤー-敵衝突判定
        const player = this.game.player;
        if (player) {
            const playerPos = player.getPreviousPosition();
            this.enemies.forEach(enemy => {
                if (this.collisionManager.checkPlayerEnemyCollisionWithMovement(
                    player, enemy, playerPos.x, playerPos.y
                )) {
                    if (typeof player.takeDamage === 'function') {
                        player.takeDamage(enemy.damage || 10);
                    }
                }
            });
        }

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
        
        // デバッグ設定がある場合は適用
        let enemy;
        if (this.game.enemyBaseHP && this.game.enemyBaseSpeed) {
            // デバッグ設定を使用して敵を生成
            enemy = this.spawnEnemyWithDebugSettings(randomType);
        } else {
            // 通常の敵生成
            enemy = new randomType(this.game);
        }
        
        this.enemies.push(enemy);
    }

    spawnEnemyWithDebugSettings(EnemyClass) {
        // 敵の種類に応じてHPを設定
        let maxHP;
        if (EnemyClass === RedOni) {
            maxHP = this.game.enemyBaseHP.red;
        } else if (EnemyClass === BlueOni) {
            maxHP = this.game.enemyBaseHP.blue;
        } else if (EnemyClass === BlackOni) {
            maxHP = this.game.enemyBaseHP.black;
        } else {
            maxHP = Enemy.BASE_HP;
        }
        
        // 敵を生成
        const enemy = new EnemyClass(this.game, undefined, maxHP);
        
        // デバッグ設定の速度を適用
        if (this.game.enemyBaseSpeed) {
            enemy.speed = this.game.enemyBaseSpeed + Math.random();
        }
        
        return enemy;
    }

    spawnBoss(bossType = 0) {
        console.log('ボス生成開始:', { bossType });
        
        // マップ中央の位置を計算
        const { width: mapWidth, height: mapHeight } = this.game.cameraManager.getMapDimensions();
        const centerX = mapWidth / 2;
        const centerY = mapHeight / 2;
        
        let boss;
        switch (bossType) {
            case 1:
                console.log('BossOni1を生成中...');
                boss = new BossOni1(this.game, centerX, centerY); break;
            case 2:
                console.log('BossOni2を生成中...');
                boss = new BossOni2(this.game, centerX, centerY); break;
            case 3:
                console.log('BossOni3を生成中...');
                boss = new BossOni3(this.game, centerX, centerY); break;
            case 4:
                console.log('BossOni4を生成中...');
                boss = new BossOni4(this.game, centerX, centerY); break;
            case 5:
                console.log('BossOni5を生成中...');
                boss = new BossOni5(this.game, centerX, centerY); break;
            default:
                console.log('デフォルトボスを生成中...');
                boss = new BossOni(this.game, centerX, centerY); break;
        }
        console.log('ボス生成完了:', { 
            bossType, 
            bossClass: boss.constructor.name,
            bossExists: !!boss,
            enemyCount: this.enemies.length,
            position: { x: centerX, y: centerY }
        });
        this.enemies.push(boss);
        console.log('ボス追加後敵数:', this.enemies.length);
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