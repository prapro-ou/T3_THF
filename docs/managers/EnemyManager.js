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
        // HP倍率更新（ゲーム側で管理）
        if (this.game && typeof this.game.updateOniHpMultiplier === 'function') {
            this.game.updateOniHpMultiplier(1/60); // 1フレーム=約1/60秒
        }

        // 敵の更新
        this.enemies.forEach(enemy => {
            // 赤鬼・青鬼・黒鬼のみ速度倍率を適用
            if (enemy.constructor.name === 'RedOni' || enemy.constructor.name === 'BlueOni' || enemy.constructor.name === 'BlackOni') {
                if (!enemy._baseSpeed) enemy._baseSpeed = enemy.speed; // 初回のみ保存
                enemy.speed = enemy._baseSpeed * (this.game.enemySpeedMultiplier || 1.0);
            }
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
        
    // HP倍率を反映
    // 敵HP定数
    const ENEMY_HP = {
        RedOni: 20,
        BlueOni: 40,
        BlackOni: 60
    };
    let baseHP = ENEMY_HP.RedOni;
    if (randomType === RedOni) baseHP = ENEMY_HP.RedOni;
    if (randomType === BlueOni) baseHP = ENEMY_HP.BlueOni;
    if (randomType === BlackOni) baseHP = ENEMY_HP.BlackOni;
    const hp = Math.round(baseHP * (this.game.oniHpMultiplier || 1));
    const enemy = new randomType(this.game, undefined, hp);
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

    // 敵同士の衝突判定
    checkCollision(enemy1, enemy2) {
        const dx = enemy1.x - enemy2.x;
        const dy = enemy1.y - enemy2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = 160; // ボスの半径80 * 2
        return distance < minDistance;
    }

    // 安全な位置を見つける
    findSafePosition(x, y, existingEnemies, minDistance = 160) {
        let attempts = 0;
        let testX = x;
        let testY = y;
        
        while (attempts < 50) {
            let collision = false;
            
            for (const enemy of existingEnemies) {
                const dx = testX - enemy.x;
                const dy = testY - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < minDistance) {
                    collision = true;
                    break;
                }
            }
            
            if (!collision) {
                return { x: testX, y: testY };
            }
            
            // ランダムな方向に少し移動
            const angle = Math.random() * Math.PI * 2;
            const distance = minDistance + Math.random() * 50;
            testX = x + Math.cos(angle) * distance;
            testY = y + Math.sin(angle) * distance;
            
            // マップ境界内に収める
            const { width: mapW, height: mapH } = this.game.cameraManager.getMapDimensions();
            testX = Math.max(80, Math.min(testX, mapW - 80));
            testY = Math.max(80, Math.min(testY, mapH - 80));
            
            attempts++;
        }
        
        // 最後の手段：元の位置から十分離れた場所
        return { x: x + 200, y: y + 200 };
    }

    spawnBoss(bossType = 0) {
        console.log('ボス生成開始:', { bossType });
        
    // マップ中央の位置を計算
    const { width: mapWidth, height: mapHeight } = this.game.cameraManager.getMapDimensions();
    const centerX = mapWidth / 2;
    const centerY = mapHeight / 2;
        let boss;
        switch (bossType) {
            case 1: {
                // BossOni1 単体
                console.log('BossOni1を生成中...');
                boss = new BossOni1(this.game, centerX, centerY);
                if (boss._maxHP) boss._maxHP = Math.round(boss._maxHP * 1.5);
                if (boss._hp) boss._hp = boss._maxHP;
                this.enemies.push(boss);
                return;
            }
            case 2: {
                // BossOni2 単体
                console.log('BossOni2を生成中...');
                boss = new BossOni2(this.game, centerX, centerY);
                if (boss._maxHP) boss._maxHP = Math.round(boss._maxHP * 1.5);
                if (boss._hp) boss._hp = boss._maxHP;
                this.enemies.push(boss);
                return;
            }
            case 3: {
                // BossOni3 単体
                console.log('BossOni3を生成中...');
                boss = new BossOni3(this.game, centerX, centerY);
                if (boss._maxHP) boss._maxHP = Math.round(boss._maxHP * 1.5);
                if (boss._hp) boss._hp = boss._maxHP;
                this.enemies.push(boss);
                return;
            }
            case 4: {
                // BossOni4 単体
                console.log('BossOni4を生成中...');
                boss = new BossOni4(this.game, centerX, centerY);
                if (boss._maxHP) boss._maxHP = Math.round(boss._maxHP * 1.5);
                if (boss._hp) boss._hp = boss._maxHP;
                this.enemies.push(boss);
                return;
            }
            case 5: {
                // BossOni5 単体
                console.log('BossOni5を生成中...');
                boss = new BossOni5(this.game, centerX, centerY);
                if (boss._maxHP) boss._maxHP = Math.round(boss._maxHP * 1.5);
                if (boss._hp) boss._hp = boss._maxHP;
                this.enemies.push(boss);
                return;
            }
            case 6: {
                // 風神・雷神同時出現
                console.log('BossOni4/BossOni5(風神・雷神)を同時生成中...');
                // 風神（左側）
                const fuzinX = centerX - 300;
                const fuzinY = centerY;
                const fuzin = new BossOni4(this.game, fuzinX, fuzinY);
                if (fuzin._maxHP) fuzin._maxHP = Math.round(fuzin._maxHP * 1.5);
                if (fuzin._hp) fuzin._hp = fuzin._maxHP;
                // 雷神（右側）
                const raizinX = centerX + 300;
                const raizinY = centerY;
                const raizin = new BossOni5(this.game, raizinX, raizinY);
                if (raizin._maxHP) raizin._maxHP = Math.round(raizin._maxHP * 1.5);
                if (raizin._hp) raizin._hp = raizin._maxHP;
                // 衝突判定で位置を調整
                if (this.checkCollision(fuzin, raizin)) {
                    console.log('風神・雷神が重なっているため位置を調整します');
                    const safePos = this.findSafePosition(raizinX, raizinY, [fuzin], 200);
                    raizin.x = safePos.x;
                    raizin.y = safePos.y;
                }
                // 登場ギミック
                this.game.particleManager.createExplosion(fuzin.x, fuzin.y, '#7ed6df');
                this.game.particleManager.createExplosion(raizin.x, raizin.y, '#f9ca24');
                this.enemies.push(fuzin, raizin);
                console.log('風神・雷神を追加後敵数:', this.enemies.length);
                console.log('風神位置:', { x: fuzin.x, y: fuzin.y });
                console.log('雷神位置:', { x: raizin.x, y: raizin.y });
                return;
            }
            case 7: {
                // ラスボスステージ: BossOni1〜5を同時出現
                console.log('ラスボスステージ: BossOni1〜5を同時生成中...');
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
                    if (b._maxHP) b._maxHP = Math.round(b._maxHP * 1.5);
                    if (b._hp) b._hp = b._maxHP;
                    this.enemies.push(b);
                    const color = colors[idx % colors.length];
                    this.game.particleManager.createExplosion(p.x, p.y, color);
                });
                console.log('ラスボス5体追加後敵数:', this.enemies.length);
                return;
            }
            default: {
                console.log('デフォルトボス（BossOni1）を生成中...');
                boss = new BossOni1(this.game, centerX, centerY);
                if (boss._maxHP) boss._maxHP = Math.round(boss._maxHP * 1.5);
                if (boss._hp) boss._hp = boss._maxHP;
                this.enemies.push(boss);
                return;
            }
        }
    // 不要な重複コードを削除
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