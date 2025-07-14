import { Player } from '../entities/Player.js';
import { InputManager } from '../managers/InputManager.js';
import { RenderManager } from '../managers/RenderManager.js';
import { CollisionManager } from '../managers/CollisionManager.js';
import { EnemyManager } from '../managers/EnemyManager.js';
import { ParticleManager } from '../managers/ParticleManager.js';
import { Timer } from './Timer.js';
import { UIManager } from '../managers/UIManager.js';
import { PauseManager } from '../managers/PauseManager.js';
import { AttackManager } from '../managers/AttackManager.js';
import { GameState } from './GameState.js';
import { CameraManager } from '../managers/CameraManager.js';
import { PlayerController } from '../components/PlayerController.js';
import { Otomo } from '../entities/Otomo.js';
import { ProjectileManager } from '../managers/ProjectileManager.js';

export class Game {
    constructor(canvas, ctx, scoreDisplay, livesDisplay, gameOverMessage, restartButton, timerDisplay, selectedBossType = 0) {
        this.canvas = canvas;
        this.ctx = ctx;

        // 各マネージャーの初期化
        this.renderer = new RenderManager(canvas, ctx);
        this.inputManager = new InputManager();
        this.cameraManager = new CameraManager(this.renderer);
        this.collisionManager = new CollisionManager();
        this.enemyManager = new EnemyManager(this, this.collisionManager);
        this.particleManager = new ParticleManager(this);
        this.timer = new Timer(180); // デフォルト3分
        this.uiManager = new UIManager(scoreDisplay, livesDisplay, timerDisplay, gameOverMessage, restartButton);
        this.pauseManager = new PauseManager(this, this.uiManager);
        this.attackManager = new AttackManager(this);
        this.gameState = new GameState(this);

        // ProjectileManagerの初期化
        this.projectileManager = new ProjectileManager(this);

        // プレイヤーの初期化
        const { width: mapWidth, height: mapHeight } = this.cameraManager.getMapDimensions();
        this.playerController = new PlayerController(this.inputManager, this.cameraManager);
        this.player = new Player(this, mapWidth / 2, mapHeight / 2, this.playerController);

        // Otomoの初期化
        this.otomo = null;

        this.bossAppeared = false;
        this.bossDefeated = false;
        this.bossTimer = 120; // ボス出現から2分
        this.bossStartTime = null;

        this.selectedBossType = selectedBossType;

        // Otomoのレベル・経験値
        this.otomoLevel = 1;
        this.otomoExp = 0;
        this.otomoExpToLevelUp = 10;
        // レベルアップで上昇する各種倍率
        this.otomoSpeedMultiplier = 1;
        this.playerAttackMultiplier = 1;
        this.otomoAttackMultiplier = 1;

        this.setupEvents();
        this.initializeGame();
    }

    setupEvents() {
        // 右クリックを無効化
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // 左クリック：playerの弾攻撃のみ
        this.canvas.addEventListener('mousedown', (event) => {
            if (event.button !== 0) return;
            if (this.gameState.isGameOver()) return;
            if (this.pauseManager.isPaused) return;
            if (this.player.ammo <= 0) return;

            // playerのprojectile攻撃
            const hitCount = this.attackManager.handleAttack(event, 'projectile');
            if (hitCount > 0) {
                this.uiManager.updateScore(this.gameState.getScore());
            }
            this.player.ammoManager.consumeAmmo();
            this.uiManager.updateAmmo(this.player.ammoManager.getAmmo(), this.player.ammoManager.getMaxAmmo());
        });

        // Otomoのモード切替（数字キー）
        window.addEventListener('keydown', (e) => {
            if (!this.otomo) return;
            switch (e.key) {
                case '1':
                    this.otomo.setMode('follow');
                    break;
                case '2':
                    this.otomo.setMode('wander');
                    break;
                case '3':
                    this.otomo.setMode('charge');
                    break;
            }
        });

        this.uiManager.setRestartCallback(() => {
            this.initializeGame();
        });

        // ページの可視性変更時の処理
        document.addEventListener('visibilitychange', () => {
            this.pauseManager.handleVisibilityChange();
        });
    }

    initializeGame() {
        // Otomoのレベル・経験値をリセット
        this.otomoLevel = 1;
        this.otomoExp = 0;
        this.otomoExpToLevelUp = 10;
        this.otomoSpeedMultiplier = 1;
        this.playerAttackMultiplier = 1;
        this.otomoAttackMultiplier = 1;
        this.gameState.reset();
        this.player.reset();
        this.enemyManager.reset();
        this.particleManager.clearParticles();
        this.timer.reset();
        this.attackManager.reset();
        
        this.uiManager.updateScore(this.gameState.getScore());
        this.uiManager.updateAmmo(this.player.ammoManager.getAmmo(), this.player.ammoManager.getMaxAmmo());
        this.uiManager.hideGameOver();
        
        this.otomo = new Otomo(this, this.player.x, this.player.y);
        // ProjectileManagerのリセット
        this.projectileManager.reset();
        
        this.bossAppeared = false;
        this.bossDefeated = false;
        this.bossStartTime = null;
        this.bossSpawnComplete = false;
        
        this.animate();
    }

    calcScroll() {
        return this.cameraManager.calcScroll(this.player.x, this.player.y);
    }

    animate() {
        if (this.gameState.isGameOver()) {
            this.uiManager.showGameOver();
            return;
        }
        
        if (this.pauseManager.isPaused) return;

        const deltaTime = this.gameState.updateDeltaTime();
        
        // タイマー更新
        this.timer.update();
        if (!this.bossAppeared) {
            this.uiManager.updateTimer(this.timer.getFormattedTime(), 'normal');
        } else if (this.bossAppeared && !this.bossDefeated) {
            // ボス攻略残り時間を計算
            const elapsed = Math.floor((Date.now() - this.bossStartTime) / 1000);
            const remaining = Math.max(0, this.bossTimer - elapsed);
            const minutes = String(Math.floor(remaining / 60)).padStart(2, '0');
            const seconds = String(remaining % 60).padStart(2, '0');
            this.uiManager.updateTimer(`${minutes}:${seconds}`, 'boss');
        }
        
        // ボス未出現かつ経過時間が設定された時間になったらボス演出＋出現
        const elapsedTime = this.timer.getElapsedTime(); // 経過時間を取得
        const bossSpawnTime = this.bossSpawnTime || 180; // デフォルト180秒
        if (!this.bossAppeared && elapsedTime >= bossSpawnTime) {
            console.log('ボス出現条件達成:', { elapsedTime, bossSpawnTime, selectedBossType: this.selectedBossType });
            this.bossAppeared = true;
            this.bossCutInStartTime = Date.now();
            this.uiManager.showBossCutIn();
            this.enemyManager.clearEnemies(); // 通常敵を一掃（任意）
            this.enemyManager.spawnBoss(this.selectedBossType);
            console.log('ボス生成完了、敵数:', this.enemyManager.getEnemies().length);
            this.bossStartTime = Date.now();
            this.bossSpawnFrame = this.enemyManager.frame; // ボス出現時のフレームを記録
            this.bossSpawnComplete = false; // ボス生成完了フラグをリセット
        }
        // カットインの非表示処理
        if (this.bossCutInStartTime) {
            const cutInElapsed = Date.now() - this.bossCutInStartTime;
            if (cutInElapsed >= 1500) {
                this.uiManager.hideBossCutIn();
                this.bossCutInStartTime = null;
            }
        }

        // ボス出現中の処理
        if (this.bossAppeared && !this.bossDefeated) {
            // ボス生成完了フラグの確認
            if (!this.bossSpawnComplete) {
                const enemies = this.enemyManager.getEnemies();
                const boss = enemies.find(e => this.isBossEnemy(e));
                if (boss) {
                    console.log('ボス生成完了を確認:', { 
                        bossClass: boss.constructor.name,
                        enemyCount: enemies.length,
                        currentFrame: this.enemyManager.frame
                    });
                    this.bossSpawnComplete = true;
                } else {
                    console.log('ボス生成待機中:', { 
                        currentFrame: this.enemyManager.frame,
                        spawnFrame: this.bossSpawnFrame,
                        enemyCount: enemies.length
                    });
                }
            }
            
            // ボス生成完了後にのみ判定を実行
            if (this.bossSpawnComplete) {
                // ボス鬼が生きているか判定
                const enemies = this.enemyManager.getEnemies();
                const boss = enemies.find(e => this.isBossEnemy(e));
                console.log('ボス判定:', { 
                    bossExists: !!boss, 
                    enemyCount: enemies.length,
                    enemyTypes: enemies.map(e => e.constructor.name),
                    currentFrame: this.enemyManager.frame,
                    spawnFrame: this.bossSpawnFrame,
                    bossClass: boss ? boss.constructor.name : 'none'
                });
                
                // ボスが存在しない場合の処理
                if (!boss) {
                    // ボスがいない＝倒した
                    console.log('ボスが存在しないためクリア画面を表示');
                    this.bossDefeated = true;
                    this.gameState.setGameOver();
                    this.uiManager.showGameOver('クリア！ボス鬼を倒した！');
                    return;
                }
            }
            
            // ボス用タイマー
            const elapsed = Math.floor((Date.now() - this.bossStartTime) / 1000);
            if (elapsed >= this.bossTimer) {
                this.gameState.setGameOver();
                this.uiManager.showGameOver('時間切れ！ボス鬼を倒せなかった…');
                return;
            }
        }
        // 通常の時間切れはボス未出現時のみ
        if (!this.bossAppeared && this.timer.isTimeUp()) {
            this.gameState.setGameOver();
            this.uiManager.showGameOver('時間切れでゲームオーバー');
            return;
        }

        const { scrollX, scrollY } = this.calcScroll();

        // 描画処理を各Managerに委譲（単一責任の原則）
        this.renderer.clear();
        this.renderer.drawBackground(scrollX, scrollY);
        this.renderer.drawAttackCircle(this.attackManager.getAttackCircle(), scrollX, scrollY);

        // プレイヤー更新・描画
        this.player.update(deltaTime);
        this.player.draw(this.ctx, scrollX, scrollY);

        // Otomoの更新・描画
        if (this.otomo) {
            this.otomo.updateBehavior(this.player, deltaTime);
            this.otomo.draw(this.ctx, scrollX, scrollY);
        }

        // 敵更新・描画（EnemyManagerに委譲）
        if (this.bossAppeared && !this.bossDefeated) {
            // ボスのみ更新・描画
            this.enemyManager.getEnemies().forEach(enemy => {
                if (this.isBossEnemy(enemy)) enemy.update();
            });
            this.enemyManager.draw(this.ctx, scrollX, scrollY);
        } else {
            this.enemyManager.update();
            this.enemyManager.draw(this.ctx, scrollX, scrollY);
        }
        
        // プレイヤーとの衝突判定
        this.enemyManager.getEnemies().forEach(enemy => {
            if (this.collisionManager.checkPlayerEnemyCollision(this.player, enemy)) {
                if (!enemy.markedForDeletion) {
                    // ボス鬼の場合はダメージを増加
                    const damage = this.isBossEnemy(enemy) ? 40 : 20;
                    this.player.health -= damage;
                    if (this.player.health < 0) this.player.health = 0;
                    enemy.markedForDeletion = true;
                    this.particleManager.createExplosion(
                        enemy.x + enemy.width / 2, 
                        enemy.y + enemy.height / 2, 
                        enemy.color
                    );
                }
            }
        });

        // パーティクル更新・描画
        this.particleManager.update();
        this.particleManager.draw(scrollX, scrollY);

        // ゲームオーバー判定
        if (this.player.health <= 0) {
            this.gameState.setGameOver();
        }

        this.attackManager.updateAttackCircle();
        this.projectileManager.update();
        this.projectileManager.draw(this.ctx, scrollX, scrollY);

        // 残弾数UIを毎フレーム更新
        this.uiManager.updateAmmo(this.player.ammoManager.getAmmo(), this.player.ammoManager.getMaxAmmo());
        // オトモレベルUIを毎フレーム更新
        this.uiManager.updateOtomoLevel(this.otomoLevel, this.otomoExp, this.otomoExpToLevelUp);

        this.enemyManager.incrementFrame();

        const animationId = requestAnimationFrame(() => this.animate());
        this.gameState.setAnimationId(animationId);
    }

    // ボス鬼の存在判定を修正
    isBossEnemy(enemy) {
        return enemy.constructor.name === 'BossOni' || 
               enemy.constructor.name === 'BossOni1' || 
               enemy.constructor.name === 'BossOni2' || 
               enemy.constructor.name === 'BossOni3' || 
               enemy.constructor.name === 'BossOni4' || 
               enemy.constructor.name === 'BossOni5';
    }

    stop() {
        if (this.gameState.getAnimationId()) {
            cancelAnimationFrame(this.gameState.getAnimationId());
        }
    }

    togglePause() {
        this.pauseManager.togglePause();
    }

    // 経験値加算・レベルアップ処理
    addOtomoExp(amount) {
        this.otomoExp += amount;
        let leveledUp = false;
        while (this.otomoExp >= this.otomoExpToLevelUp) {
            this.otomoExp -= this.otomoExpToLevelUp;
            this.otomoLevel++;
            // 必要経験値を1.3倍に（以前より少し減らす）
            this.otomoExpToLevelUp = Math.floor(this.otomoExpToLevelUp * 1.3);
            // レベルアップ時の各種上昇
            this.otomoSpeedMultiplier *= 1.05; // オトモ速度5%アップ
            this.playerAttackMultiplier *= 1.1; // プレイヤー攻撃力1.1倍
            this.otomoAttackMultiplier *= 1.1; // オトモ攻撃力1.1倍
            if (this.player && this.player.ammoManager) {
                this.player.ammoManager.ammoRecoveryTime /= 1.1; // リロード速度1.1倍
            }
            leveledUp = true;
        }
        // UI即時反映
        this.uiManager.updateOtomoLevel(this.otomoLevel, this.otomoExp, this.otomoExpToLevelUp);
        // レベルアップ演出が必要ならここで
    }

    // レベルに応じた攻撃クールダウン(ms)を返す
    getOtomoAttackCooldown() {
        // デフォルト攻撃速度を速く（例: レベル1で700ms、レベルごとに10%短縮、下限250ms）
        return Math.max(250, 700 * Math.pow(0.9, this.otomoLevel - 1));
    }

    // ゲッター
    get score() { return this.gameState.getScore(); }
    set score(value) { this.gameState.score = value; }
    get isPaused() { return this.pauseManager.isPaused; }

    // デバッグ設定を適用するメソッド
    applyDebugSettings(settings) {
        // 鬼の設定を適用
        if (this.enemyManager) {
            this.enemyManager.spawnInterval = settings.enemySpawnInterval;
            this.enemyManager.maxEnemies = settings.maxEnemies;
        }
        
        // プレイヤーの設定を適用
        if (this.player) {
            this.player.maxHP = settings.playerHP;
            this.player.health = settings.playerHP;
            this.player.constructor.SPEED = settings.playerSpeed;
            this.player.ammoManager.setMaxAmmo(settings.maxAmmo);
            this.player.ammoManager.ammoRecoveryTime = settings.ammoRecoveryTime;
        }
        
        // ボス出現時間を設定
        this.bossSpawnTime = settings.bossSpawnTime;
        this.timer.setGameTime(settings.bossSpawnTime); // タイマーにも反映
        // ボス攻略時間（新設）
        if (settings.bossBattleTime !== undefined) {
            this.bossTimer = settings.bossBattleTime;
        }
        else if (settings.bossSpawnTime !== undefined) {
            // 互換性のため、bossSpawnTimeもbossTimerに入れる（古い設定）
        this.bossTimer = settings.bossSpawnTime;
        }
        
        // 敵の基本パラメータを更新（新しい敵生成時に適用される）
        this.updateEnemyParameters(settings);
    }

    // 敵のパラメータを更新
    updateEnemyParameters(settings) {
        // 各敵クラスの基本パラメータを更新
        const { RedOni, BlueOni, BlackOni } = this.enemyManager.constructor;
        
        // 基本HPと速度を更新（新しい敵生成時に適用）
        this.enemyBaseHP = {
            red: settings.redOniHP,
            blue: settings.blueOniHP,
            black: settings.blackOniHP
        };
        this.enemyBaseSpeed = settings.enemyBaseSpeed;
    }
}

// スプライトシート関連のコード
let momotaroSpriteSheet;
let momotaroSpriteSheetLoaded = false;

export function preloadMomotaroSpriteSheet(callback) {
    if (momotaroSpriteSheetLoaded) return callback();
    const img = new Image();
    img.src = 'assets/characters/players/momotaro/momotaro_spritesheet.png';
    fetch('assets/characters/players/momotaro/momotaro_spritesheet.json')
        .then(res => res.json())
        .then(json => {
            img.onload = () => {
                momotaroSpriteSheet = new SpriteSheet(img, json);
                momotaroSpriteSheetLoaded = true;
                callback();
            };
        });
}