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
                // ステージ4: 風神(4)と雷神(5)を同時出現
                console.log('BossOni4/BossOni5(風神・雷神)を同時生成中...');
                const offset = 300;
                const fuzinX = centerX - offset;
                const raizinX = centerX + offset;
                const fuzin = new BossOni4(this.game, fuzinX, centerY);
                const raizin = new BossOni5(this.game, raizinX, centerY);
                // 登場ギミック（簡易演出）
                this.game.particleManager.createExplosion(fuzinX, centerY, '#7ed6df'); // 風: 淡い青
                this.game.particleManager.createExplosion(raizinX, centerY, '#f9ca24'); // 雷: 黄
                this.enemies.push(fuzin, raizin);
                console.log('風神・雷神を追加後敵数:', this.enemies.length);
                return; // ここで終了（以降の単体ボス処理は不要）
            case 5:
                // ラスボスステージ: BossOni1〜5を同時出現
                console.log('ラスボスステージ: BossOni1〜5を同時生成中...');
                {
                    const positions = [
                        { Cls: BossOni1, x: centerX,         y: centerY         },
                        { Cls: BossOni2, x: centerX - 350,   y: centerY         },
                        { Cls: BossOni3, x: centerX + 350,   y: centerY         },
                        { Cls: BossOni4, x: centerX,         y: centerY - 300   },
                        { Cls: BossOni5, x: centerX,         y: centerY + 300   }
                    ];
                    const colors = ['#e74c3c', '#3498db', '#9b59b6', '#7ed6df', '#f9ca24'];
                    positions.forEach((p, idx) => {
                        const b = new p.Cls(this.game, p.x, p.y);
                        this.enemies.push(b);
                        // それぞれの登場に演出を付与
                        const color = colors[idx % colors.length];
                        this.game.particleManager.createExplosion(p.x, p.y, color);
                    });
                    console.log('ラスボス5体追加後敵数:', this.enemies.length);
                    return; // ここで終了（以降の単体ボス処理は不要）
                }
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

    clearAllEnemies() {
        this.enemies = [];
    }
} 