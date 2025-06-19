import { Player } from './Player.js';
import { Enemy } from './Enemy.js';
import { Particle } from './Particle.js';

export class Game {
    constructor(canvas, ctx, scoreDisplay, livesDisplay, gameOverMessage, restartButton) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.scoreDisplay = scoreDisplay;
        this.livesDisplay = livesDisplay;
        this.gameOverMessage = gameOverMessage;
        this.restartButton = restartButton;

        this.VIEW_W = this.canvas.width;
        this.VIEW_H = this.canvas.height;
        this.MAP_W = this.VIEW_W * 3;
        this.MAP_H = this.VIEW_H * 3;

        this.INITIAL_ENEMY_SPAWN_INTERVAL = 90;
        this.MIN_ENEMY_SPAWN_INTERVAL = 30;
        this.SPAWN_INTERVAL_DECREASE_RATE = 2;
        this.SPAWN_INTERVAL_DECREASE_FREQUENCY = 300;
        this.ENEMY_BASE_SPEED = 5;
        this.PLAYER_SPEED = 7;
        this.INITIAL_PLAYER_LIVES = 3;

        this.score = 0;
        this.enemies = [];
        this.particles = [];
        this.gameFrame = 0;
        this.animationId = null;
        this.gameOver = false;
        this.currentEnemySpawnInterval = this.INITIAL_ENEMY_SPAWN_INTERVAL;
        this.keys = {};

        this.player = new Player(this);

        this.setupEvents();
        this.initializeGame();
    }

    setupEvents() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        this.canvas.addEventListener('click', (event) => {
            if (this.gameOver) return;
            let scrollX = this.player.x - this.VIEW_W / 2;
            let scrollY = this.player.y - this.VIEW_H / 2;
            scrollX = Math.max(0, Math.min(this.MAP_W - this.VIEW_W, scrollX));
            scrollY = Math.max(0, Math.min(this.MAP_H - this.VIEW_H, scrollY));
            const mouseX = event.clientX - this.canvas.getBoundingClientRect().left + scrollX;
            const mouseY = event.clientY - this.canvas.getBoundingClientRect().top + scrollY;
            let hit = false;
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const enemy = this.enemies[i];
                if (
                    mouseX > enemy.x && mouseX < enemy.x + enemy.width &&
                    mouseY > enemy.y && mouseY < enemy.y + enemy.height && !hit
                ) {
                    enemy.markedForDeletion = true;
                    this.score += 10;
                    this.scoreDisplay.textContent = `スコア: ${this.score}`;
                    hit = true;
                    for (let p = 0; p < 15; p++) {
                        this.particles.push(new Particle(this, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color));
                    }
                }
            }
        });
        this.restartButton.addEventListener('click', () => {
            this.initializeGame();
        });
    }

    initializeGame() {
        this.score = 0;
        this.enemies = [];
        this.particles = [];
        this.gameFrame = 0;
        this.gameOver = false;
        this.scoreDisplay.textContent = `スコア: ${this.score}`;
        this.player.reset();
        this.livesDisplay.textContent = `ライフ: ${this.player.lives}`;
        this.gameOverMessage.classList.add('hidden');
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.keys = {};
        this.currentEnemySpawnInterval = this.INITIAL_ENEMY_SPAWN_INTERVAL;
        this.animate();
    }

    spawnEnemy() {
        this.enemies.push(new Enemy(this));
    }

    drawBackground(scrollX, scrollY) {
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(0, 0, this.VIEW_W, this.VIEW_H);
        this.ctx.save();
        this.ctx.translate(-scrollX, -scrollY);
        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 1;
        for (let x = 0; x <= this.MAP_W; x += 80) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.MAP_H);
            this.ctx.stroke();
        }
        for (let y = 0; y <= this.MAP_H; y += 80) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.MAP_W, y);
            this.ctx.stroke();
        }
        // マップの縁取りを赤に
        this.ctx.strokeStyle = '#f00';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(0, 0, this.MAP_W, this.MAP_H);
        this.ctx.restore();
    }

    animate() {
        if (this.gameOver) {
            cancelAnimationFrame(this.animationId);
            this.gameOverMessage.classList.remove('hidden');
            return;
        }

        // スクロール位置計算
        let scrollX = this.player.x - this.VIEW_W / 2;
        let scrollY = this.player.y - this.VIEW_H / 2;
        scrollX = Math.max(0, Math.min(this.MAP_W - this.VIEW_W, scrollX));
        scrollY = Math.max(0, Math.min(this.MAP_H - this.VIEW_H, scrollY));

        this.ctx.clearRect(0, 0, this.VIEW_W, this.VIEW_H);
        this.drawBackground(scrollX, scrollY);

        this.player.update();
        this.player.draw(this.ctx, scrollX, scrollY);

        if (this.gameFrame > 0 && this.gameFrame % this.SPAWN_INTERVAL_DECREASE_FREQUENCY === 0) {
            this.currentEnemySpawnInterval = Math.max(this.MIN_ENEMY_SPAWN_INTERVAL, this.currentEnemySpawnInterval - this.SPAWN_INTERVAL_DECREASE_RATE);
        }
        const actualSpawnInterval = Math.max(1, Math.floor(this.currentEnemySpawnInterval + (Math.random() * 40 - 20)));
        if (this.gameFrame % actualSpawnInterval === 0) {
            this.spawnEnemy();
        }

        const enemiesToKeep = [];
        this.enemies.forEach(enemy => {
            enemy.update();
            enemy.draw(this.ctx, scrollX, scrollY);

            // プレイヤーとの当たり判定
            if (
                enemy.x < this.player.x + this.player.width / 2 &&
                enemy.x + enemy.width > this.player.x - this.player.width / 2 &&
                enemy.y < this.player.y + this.player.height / 2 &&
                enemy.y + enemy.height > this.player.y - this.player.height / 2
            ) {
                if (!enemy.markedForDeletion) {
                    // HPを減らす
                    this.player.hp -= 20;
                    if (this.player.hp < 0) this.player.hp = 0;
                    this.livesDisplay.textContent = `ライフ: ${this.player.lives}`;
                    enemy.markedForDeletion = true;
                    for (let p = 0; p < 15; p++) {
                        this.particles.push(new Particle(this, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color));
                    }
                }
            }
            if (!enemy.markedForDeletion) {
                enemiesToKeep.push(enemy);
            }
        });
        this.enemies = enemiesToKeep;

        if (this.player.hp <= 0) {
            this.gameOver = true;
        }

        this.particles.forEach(particle => {
            particle.update();
            particle.draw(this.ctx, scrollX, scrollY);
        });
        this.particles = this.particles.filter(particle => !particle.markedForDeletion);

        this.gameFrame++;
        this.animationId = requestAnimationFrame(() => this.animate());
    }
}