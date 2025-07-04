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

export class Game {
    constructor(canvas, ctx, scoreDisplay, livesDisplay, gameOverMessage, restartButton, timerDisplay) {
        this.canvas = canvas;
        this.ctx = ctx;

        // 各マネージャーの初期化
        this.renderer = new RenderManager(canvas, ctx);
        this.inputManager = new InputManager();
        this.cameraManager = new CameraManager(this.renderer);
        this.collisionManager = new CollisionManager();
        this.enemyManager = new EnemyManager(this, this.collisionManager);
        this.particleManager = new ParticleManager(this);
        this.timer = new Timer();
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

        this.setupEvents();
        this.initializeGame();
    }

    setupEvents() {
        // 右クリックを無効化
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // 左クリックのみ処理（mousedownで判定）
        this.canvas.addEventListener('mousedown', (event) => {
            if (event.button !== 0) return;
            if (this.gameState.isGameOver()) return;
            if (this.pauseManager.isPaused) return;
            if (this.player.ammo <= 0) return;

            const hitCount = this.attackManager.handleAttack(event);
            if (hitCount > 0) {
                this.uiManager.updateScore(this.gameState.getScore());
            }
            
            // 弾を消費
            this.player.ammoManager.consumeAmmo();
            this.uiManager.updateAmmo(this.player.ammoManager.getAmmo(), this.player.ammoManager.getMaxAmmo());
        });

        this.uiManager.setRestartCallback(() => {
            this.initializeGame();
        });

        // ページの可視性変更時の処理
        document.addEventListener('visibilitychange', () => {
            this.pauseManager.handleVisibilityChange();
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
    }

    initializeGame() {
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
        this.uiManager.updateTimer(this.timer.getFormattedTime());
        
        if (this.timer.isTimeUp()) {
            this.gameState.setGameOver();
            this.uiManager.showGameOver('時間切れでゲームオーバー');
            return;
        }

        const { scrollX, scrollY } = this.calcScroll();

        // 描画
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

        // 敵更新・描画
        this.enemyManager.update();
        this.enemyManager.getEnemies().forEach(enemy => {
            enemy.draw(this.ctx, scrollX, scrollY);
            
            // プレイヤーとの衝突判定
            if (this.collisionManager.checkPlayerEnemyCollision(this.player, enemy)) {
                if (!enemy.markedForDeletion) {
                    this.player.hp -= 20;
                    if (this.player.hp < 0) this.player.hp = 0;
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
        if (this.player.hp <= 0) {
            this.gameState.setGameOver();
        }

        this.attackManager.updateAttackCircle();
        this.enemyManager.incrementFrame();
        
        // ProjectileManagerのupdate/draw
        this.projectileManager.update(deltaTime);
        this.projectileManager.draw(this.ctx, scrollX, scrollY);
        
        const animationId = requestAnimationFrame(() => this.animate());
        this.gameState.setAnimationId(animationId);
    }

    stop() {
        if (this.gameState.getAnimationId()) {
            cancelAnimationFrame(this.gameState.getAnimationId());
        }
    }

    togglePause() {
        this.pauseManager.togglePause();
    }

    // ゲッター
    get score() { return this.gameState.getScore(); }
    set score(value) { this.gameState.score = value; }
    get isPaused() { return this.pauseManager.isPaused; }
}

// スプライトシート関連のコード
let momotaroSpriteSheet;
let momotaroSpriteSheetLoaded = false;

export function preloadMomotaroSpriteSheet(callback) {
    if (momotaroSpriteSheetLoaded) return callback();
    const img = new Image();
    img.src = 'assets/momotaro_spritesheet.png';
    fetch('assets/momotaro_spritesheet.json')
        .then(res => res.json())
        .then(json => {
            img.onload = () => {
                momotaroSpriteSheet = new SpriteSheet(img, json);
                momotaroSpriteSheetLoaded = true;
                callback();
            };
        });
}