﻿import { Player } from '../entities/Player.js';
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
import { BgmManager } from '../managers/BgmManager.js';

export class Game {
    constructor(canvas, ctx, scoreDisplay, livesDisplay, gameOverMessage, restartButton, timerDisplay, selectedBossType = 0, bgmManager = null) {
        console.log('Game constructor called with selectedBossType:', selectedBossType);
        
        this.canvas = canvas;
        this.ctx = ctx;
        this.bgmManager = bgmManager;

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
        console.log('Game constructor - selectedBossType set to:', this.selectedBossType);

        // Otomoのレベル・経験値
        this.otomoLevel = 1;
        this.otomoExp = 0;
        this.otomoExpToLevelUp = 10;
        // レベルアップで上昇する各種倍率
        this.otomoSpeedMultiplier = 1;
        this.playerAttackMultiplier = 1;
        this.otomoAttackMultiplier = 1;

        // デバッグモード設定
        this.debugMode = false;
        
        // 当たり判定表示設定
        this.debugSettings = {
            showPlayerHitbox: false,
            showEnemyHitbox: false,
            showProjectileHitbox: false,
            showAttackRange: false,
            showCollisionDebug: false
        };

        // 高速移動設定
        this.highSpeedThreshold = 10; // 高速移動判定の閾値
        this.maxSubframeSteps = 10; // サブフレーム更新の最大ステップ数
        this.enableLineIntersection = true; // 線分交差判定の有効化

        // ボス設定
        this.bossOni1ProjectileSpeed = 3; // ボス鬼1の弾の速度
        this.bossOni1ProjectileDamage = 15; // ボス鬼1の弾のダメージ

        // 当たり判定詳細設定
        this.playerHitboxSize = 0.8; // プレイヤー当たり判定サイズ（0.8 = 80%）

        this.setupEvents();
        this.initializeGame();
        
        // cannon_ballのスプライトシート読み込みを開始
        this.projectileManager.preloadCannonBallSpriteSheet(() => {
            console.log('Cannon ball sprite sheet loaded in Game constructor');
        });
    }

    setupEvents() {
        // イベントハンドラーを保存してあとで削除できるようにする
        this.eventHandlers = {};
        
        // 右クリックを無効化
        this.eventHandlers.contextmenu = (e) => {
            e.preventDefault();
        };
        this.canvas.addEventListener('contextmenu', this.eventHandlers.contextmenu);

        // 左クリック：playerの弾攻撃のみ
        this.eventHandlers.mousedown = (event) => {
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
        };
        this.canvas.addEventListener('mousedown', this.eventHandlers.mousedown);

        // Otomoのモード切替（数字キー）
        this.eventHandlers.otomoKeydown = (e) => {
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
        };
        window.addEventListener('keydown', this.eventHandlers.otomoKeydown);

        // デバッグモード切替（F1キー）
        this.eventHandlers.debugKeydown = (e) => {
            if (e.key === 'F1') {
                e.preventDefault();
                this.debugMode = !this.debugMode;
                console.log(`Debug mode: ${this.debugMode ? 'ON' : 'OFF'}`);
            }
        };
        window.addEventListener('keydown', this.eventHandlers.debugKeydown);

        this.uiManager.setRestartCallback(() => {
            this.initializeGame();
        });

        // ページの可視性変更時の処理
        this.eventHandlers.visibilitychange = () => {
            this.pauseManager.handleVisibilityChange();
        };
        document.addEventListener('visibilitychange', this.eventHandlers.visibilitychange);
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

        if (this.bgmManager) {
            this.bgmManager.play('battleBgm');
        }
    }

    calcScroll() {
        return this.cameraManager.calcScroll(this.player.x, this.player.y);
    }

    animate() {
        if (this.gameState.isGameOver()) {
            this.uiManager.showGameOver();
            if (this.bgmManager) {
                this.bgmManager.stop();
            }
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
        
        // --- ボス出現・撃破などのギミック管理 ---
        const elapsedTime = this.timer.getElapsedTime(); // 経過時間を取得
        const bossSpawnTime = this.bossSpawnTime || 180; // デフォルト180秒
        if (!this.bossAppeared && elapsedTime >= bossSpawnTime) {
            // ボス出現処理
            this.bossAppeared = true;
            this.bossCutInStartTime = Date.now();
            const cutInMsg = (this.selectedBossType === 4) ? '風神・雷神、参上！！' : 'ボス鬼出現！！';
            this.uiManager.showBossCutIn(cutInMsg);
            this.enemyManager.clearEnemies(); // 通常敵を一掃
            this.enemyManager.spawnBoss(this.selectedBossType);
            this.bossStartTime = Date.now();

            this.bossSpawnFrame = this.enemyManager.frame; // ボス出現時のフレームを記録
            this.bossSpawnComplete = false; // ボス生成完了フラグをリセット
            if (this.bgmManager) {
                if (this.selectedBossType === 5) {
                    this.bgmManager.play('lastbossBgm');
                }else {
                    this.bgmManager.play('bossBgm');
                }
            }

        }
        if (this.bossCutInStartTime) {
            const cutInElapsed = Date.now() - this.bossCutInStartTime;
            if (cutInElapsed >= 1500) {
                this.uiManager.hideBossCutIn();
                this.bossCutInStartTime = null;
            }
        }
        if (this.bossAppeared && !this.bossDefeated) {
            // ボス生成完了フラグの確認
            if (!this.bossSpawnComplete) {
                const enemies = this.enemyManager.getEnemies();
                const boss = enemies.find(e => this.isBossEnemy(e));
                if (boss) {
                    this.bossSpawnComplete = true;
                }
            }
            // ボス撃破判定
            if (this.bossSpawnComplete) {
                const enemies = this.enemyManager.getEnemies();
                const boss = enemies.find(e => this.isBossEnemy(e));
                if (!boss) {
                    this.bossDefeated = true;
                    this.gameState.setGameOver();
                    const clearMsg = (this.selectedBossType === 4)
                        ? 'クリア！風神・雷神を倒した！'
                        : 'クリア！ボス鬼を倒した！';
                    this.uiManager.showGameOver(clearMsg);
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
        if (!this.bossAppeared && this.timer.isTimeUp()) {
            this.gameState.setGameOver();
            this.uiManager.showGameOver('時間切れでゲームオーバー');
            return;
        }

        // --- バトル処理は常に共通 ---
        const { scrollX, scrollY } = this.calcScroll();

        // 描画処理を各Managerに委譲（単一責任の原則）
        this.renderer.clear();
        this.renderer.drawBackground(scrollX, scrollY, this.selectedBossType, this.bossAppeared);
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
            // markedForDeletionな敵の削除だけは必ず行う
            this.enemyManager.enemies = this.enemyManager.enemies.filter(enemy => !enemy.markedForDeletion);
            // 全ての敵をupdate
            this.enemyManager.getEnemies().forEach(enemy => {
                enemy.update();
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
                    const damage = this.isBossEnemy(enemy) ? 40 : 20;
                    this.player.takeDamage(damage);
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

        // 攻撃判定（プレイヤー・オトモの攻撃）
        this.attackManager.updateAttackCircle();
        // 弾の描画を先に実行
        this.projectileManager.draw(this.ctx, scrollX, scrollY);
        // 当たり判定の描画
        this.drawHitboxes(scrollX, scrollY);
        // 弾の更新を描画後に実行（当たり判定チェック）
        this.projectileManager.update();

        // 残弾数UIを毎フレーム更新
        this.uiManager.updateAmmo(this.player.ammoManager.getAmmo(), this.player.ammoManager.getMaxAmmo());
        // オトモレベルUIを毎フレーム更新
        this.uiManager.updateOtomoLevel(this.otomoLevel, this.otomoExp, this.otomoExpToLevelUp);
        
        // ミニマップを更新（背景画像も含む）
        const { width: mapWidth, height: mapHeight } = this.cameraManager.getMapDimensions();
        this.uiManager.updateMinimap(this.player, this.enemyManager.getEnemies(), mapWidth, mapHeight, scrollX, scrollY, this.renderer);

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

    // 当たり判定の描画
    drawHitboxes(scrollX, scrollY) {
        const ctx = this.ctx;
        
        // プレイヤーの当たり判定
        if (this.debugSettings.showPlayerHitbox) {
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            
            // プレイヤーの実際の中心座標（プレイヤーの位置 + width/2, height/2を中心とする）
            const playerCenterX = this.player.x + this.player.width / 2 - scrollX;
            const playerCenterY = this.player.y + this.player.height / 2 - scrollY;
            const playerRadius = Math.min(this.player.width, this.player.height) / 2 * (this.playerHitboxSize || 0.8);
            
            // 当たり判定円を描画
            ctx.beginPath();
            ctx.arc(playerCenterX, playerCenterY, playerRadius, 0, Math.PI * 2);
            ctx.stroke();
            
            // プレイヤーの実際の描画範囲も表示（デバッグ用）
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 2]);
            ctx.strokeRect(this.player.x - scrollX, this.player.y - scrollY, this.player.width, this.player.height);
        }
        
        // 敵の当たり判定
        if (this.debugSettings.showEnemyHitbox) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            
            this.enemyManager.getEnemies().forEach(enemy => {
                const enemyCenterX = enemy.x + enemy.width / 2 - scrollX;
                const enemyCenterY = enemy.y + enemy.height / 2 - scrollY;
                const enemyRadius = Math.max(enemy.width, enemy.height) / 2;
                
                ctx.beginPath();
                ctx.arc(enemyCenterX, enemyCenterY, enemyRadius, 0, Math.PI * 2);
                ctx.stroke();
            });
        }
        
        // 弾の当たり判定
        if (this.debugSettings.showProjectileHitbox) {
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            
            this.projectileManager.getProjectiles().forEach(projectile => {
                // すべての弾を円形の当たり判定で表示
                ctx.beginPath();
                ctx.arc(projectile.x - scrollX, projectile.y - scrollY, projectile.radius, 0, Math.PI * 2);
                ctx.stroke();
            });
        }
        
        // 攻撃範囲の表示
        if (this.debugSettings.showAttackRange && this.attackManager.attackCircle) {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3;
            ctx.setLineDash([]);
            
            const attackX = this.attackManager.attackCircle.x - scrollX;
            const attackY = this.attackManager.attackCircle.y - scrollY;
            const radius = this.attackManager.attackCircle.radius;
            
            ctx.beginPath();
            ctx.arc(attackX, attackY, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // 線のスタイルをリセット
        ctx.setLineDash([]);
    }

    // デバッグ設定を適用
    applyDebugSettings(settings) {
        console.log('Applying debug settings:', settings);
        
        // 敵の設定
        if (settings.enemySpawnInterval !== undefined) {
            this.enemyManager.spawnInterval = settings.enemySpawnInterval;
        }
        if (settings.maxEnemies !== undefined) {
            this.enemyManager.maxEnemies = settings.maxEnemies;
        }
        if (settings.redOniHP !== undefined || settings.blueOniHP !== undefined || settings.blackOniHP !== undefined) {
            this.enemyBaseHP = {
                red: settings.redOniHP || 20,
                blue: settings.blueOniHP || 40,
                black: settings.blackOniHP || 60
            };
        }
        if (settings.enemyBaseSpeed !== undefined) {
            this.enemyBaseSpeed = settings.enemyBaseSpeed;
        }
        if (settings.bossSpawnTime !== undefined) {
            this.bossSpawnTime = settings.bossSpawnTime;
            this.timer.setGameTime(settings.bossSpawnTime);
        }
        if (settings.bossBattleTime !== undefined) {
            this.bossTimer = settings.bossBattleTime;
        }
        
        // プレイヤーの設定
        if (settings.playerHP !== undefined) {
            this.player.maxHP = settings.playerHP;
            this.player.health = settings.playerHP;
        }
        if (settings.playerSpeed !== undefined) {
            this.player.constructor.SPEED = settings.playerSpeed;
        }
        if (settings.maxAmmo !== undefined) {
            this.player.ammoManager.setMaxAmmo(settings.maxAmmo);
        }
        if (settings.ammoRecoveryTime !== undefined) {
            this.player.ammoManager.ammoRecoveryTime = settings.ammoRecoveryTime;
        }
        
        // 当たり判定表示設定
        if (settings.showPlayerHitbox !== undefined) {
            console.log('Setting showPlayerHitbox:', settings.showPlayerHitbox);
            this.debugSettings.showPlayerHitbox = settings.showPlayerHitbox;
        }
        if (settings.showEnemyHitbox !== undefined) {
            console.log('Setting showEnemyHitbox:', settings.showEnemyHitbox);
            this.debugSettings.showEnemyHitbox = settings.showEnemyHitbox;
        }
        if (settings.showProjectileHitbox !== undefined) {
            console.log('Setting showProjectileHitbox:', settings.showProjectileHitbox);
            this.debugSettings.showProjectileHitbox = settings.showProjectileHitbox;
        }
        if (settings.showAttackRange !== undefined) {
            console.log('Setting showAttackRange:', settings.showAttackRange);
            this.debugSettings.showAttackRange = settings.showAttackRange;
        }
        
        // 高速移動設定
        if (settings.highSpeedThreshold !== undefined) {
            this.highSpeedThreshold = settings.highSpeedThreshold;
        }
        if (settings.maxSubframeSteps !== undefined) {
            this.maxSubframeSteps = settings.maxSubframeSteps;
        }
        if (settings.enableLineIntersection !== undefined) {
            this.enableLineIntersection = settings.enableLineIntersection;
        }
        
        // ボス設定
        if (settings.bossOni1ProjectileSpeed !== undefined) {
            this.bossOni1ProjectileSpeed = settings.bossOni1ProjectileSpeed;
        }
        if (settings.bossOni1ProjectileDamage !== undefined) {
            this.bossOni1ProjectileDamage = settings.bossOni1ProjectileDamage;
        }
        
        // 当たり判定詳細設定
        if (settings.showCollisionDebug !== undefined) {
            console.log('Setting showCollisionDebug:', settings.showCollisionDebug);
            this.debugSettings.showCollisionDebug = settings.showCollisionDebug;
        }
        if (settings.playerHitboxSize !== undefined) {
            console.log('Setting playerHitboxSize:', settings.playerHitboxSize);
            this.playerHitboxSize = settings.playerHitboxSize;
        }
        
        console.log('Debug settings after apply:', this.debugSettings);
    }

    stop() {
        if (this.gameState.getAnimationId()) {
            cancelAnimationFrame(this.gameState.getAnimationId());
        }
    }

    // ゲームを完全に破棄する関数
    destroy() {
        console.log('Game destroy called');
        
        // アニメーションループを停止
        if (this.gameState.getAnimationId()) {
            cancelAnimationFrame(this.gameState.getAnimationId());
            this.gameState.setAnimationId(null);
        }
        
        // BGMを停止
        if (this.bgmManager) {
            this.bgmManager.stop();
        }
        
        // イベントリスナーを削除
        if (this.eventHandlers) {
            if (this.canvas && this.eventHandlers.contextmenu) {
                this.canvas.removeEventListener('contextmenu', this.eventHandlers.contextmenu);
            }
            if (this.canvas && this.eventHandlers.mousedown) {
                this.canvas.removeEventListener('mousedown', this.eventHandlers.mousedown);
            }
            if (this.eventHandlers.otomoKeydown) {
                window.removeEventListener('keydown', this.eventHandlers.otomoKeydown);
            }
            if (this.eventHandlers.debugKeydown) {
                window.removeEventListener('keydown', this.eventHandlers.debugKeydown);
            }
            if (this.eventHandlers.visibilitychange) {
                document.removeEventListener('visibilitychange', this.eventHandlers.visibilitychange);
            }
            this.eventHandlers = null;
        }
        
        // すべてのマネージャーをクリア
        if (this.enemyManager) {
            this.enemyManager.reset();
            this.enemyManager.clearAllEnemies();
        }
        
        if (this.particleManager) {
            this.particleManager.clearParticles();
        }
        
        if (this.projectileManager) {
            this.projectileManager.reset();
        }
        
        if (this.inputManager) {
            this.inputManager.destroy();
        }
        
        if (this.pauseManager) {
            this.pauseManager.destroy();
        }
        
        if (this.timer) {
            this.timer.stop();
        }
        
        if (this.attackManager) {
            this.attackManager.reset();
        }
        
        // UIの状態もリセット
        if (this.uiManager) {
            this.uiManager.hideGameOver();
            this.uiManager.hidePauseMessage();
            this.uiManager.hideBossCutIn();
            this.uiManager.hideMinimap();
        }
        
        // オブジェクト参照をクリア
        this.player = null;
        this.otomo = null;
        this.canvas = null;
        this.ctx = null;
        this.enemyManager = null;
        this.particleManager = null;
        this.projectileManager = null;
        this.inputManager = null;
        this.pauseManager = null;
        this.timer = null;
        this.attackManager = null;
        this.uiManager = null;
        this.cameraManager = null;
        this.renderer = null;
        this.collisionManager = null;
        this.gameState = null;
        this.bgmManager = null;
        
        console.log('Game destroyed successfully');
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