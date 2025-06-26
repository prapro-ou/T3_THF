import { Player } from './Player.js';
import { Enemy, RedOni, BlueOni, BlackOni, BossOni } from './Enemy.js';
import { Particle } from './Particle.js';

//FIXME パラメータ管理の場所悩み中

export class Game {
    static INITIAL_ENEMY_SPAWN_INTERVAL = 100;
    static MIN_ENEMY_SPAWN_INTERVAL = 30;
    static SPAWN_INTERVAL_DECREASE_RATE = 2;
    static SPAWN_INTERVAL_DECREASE_FREQUENCY = 300;
    static ATTACK_RADIUS = 80; // 攻撃範囲の半径（ピクセル）

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


        this.score = 0;
        this.enemies = [];
        this.particles = [];
        this.gameFrame = 0;
        this.animationId = null;
        this.gameOver = false;
        this.currentEnemySpawnInterval = Game.INITIAL_ENEMY_SPAWN_INTERVAL;
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

        // 右クリックを無効化
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // 左クリックのみ処理（mousedownで判定）
        this.canvas.addEventListener('mousedown', (event) => {
            if (event.button !== 0) return;
            if (this.gameOver) return;
            if (this.player.ammo <= 0) return;

            let scrollX = this.player.x - this.VIEW_W / 2;
            let scrollY = this.player.y - this.VIEW_H / 2;
            scrollX = Math.max(0, Math.min(this.MAP_W - this.VIEW_W, scrollX));
            scrollY = Math.max(0, Math.min(this.MAP_H - this.VIEW_H, scrollY));
            const mouseX = event.clientX - this.canvas.getBoundingClientRect().left + scrollX;
            const mouseY = event.clientY - this.canvas.getBoundingClientRect().top + scrollY;

            const attackRadius = this.player.getAttackRadius();

            // 攻撃範囲の中心座標を保存（アニメーションで描画用）
            this.attackCircle = {
                x: mouseX,
                y: mouseY,
                radius: attackRadius,
                timer: 10
            };

            // クリック攻撃時
            let hitCount = 0;
            const damage = 20; // 1回の攻撃で与えるダメージ
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const enemy = this.enemies[i];
                const ex = enemy.x + enemy.width / 2;
                const ey = enemy.y + enemy.height / 2;
                const enemyRadius = Math.max(enemy.width, enemy.height) / 2;
                const dist = Math.hypot(mouseX - ex, mouseY - ey);
                if (dist <= attackRadius + enemyRadius) {
                    enemy.hp -= damage;
                    if (enemy.hp <= 0) {
                        enemy.markedForDeletion = true;
                        this.score += 10;
                        hitCount++;
                        for (let p = 0; p < 15; p++) {
                            this.particles.push(new Particle(this, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color));
                        }
                    }
                }
            }
            if (hitCount > 0) {
                this.scoreDisplay.textContent = `スコア: ${this.score}`;
            }
            // 弾を消費
            this.player.ammo--;
            this.livesDisplay.textContent = `残弾数: ${this.player.ammo}/${this.player.maxAmmo}`;
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
        this.livesDisplay.textContent = `残弾数: ${this.player.ammo}`;
        this.gameOverMessage.classList.add('hidden');
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.keys = {};
        this.currentEnemySpawnInterval = Game.INITIAL_ENEMY_SPAWN_INTERVAL;
        this.animate();
    }

    spawnEnemy() {
        let enemy;
        let overlap;
        let tryCount = 0;
        do {
            // ランダムに敵を生成
            const r = Math.random();
            if (r < 0.65) {
                enemy = new RedOni(this);
            } else if (r < 0.9) {
                enemy = new BlueOni(this);
            } else {
                enemy = new BlackOni(this);
            }

            // 既存の敵と重なっていないか判定
            overlap = this.enemies.some(e => {
                const dx = (enemy.x + enemy.width / 2) - (e.x + e.width / 2);
                const dy = (enemy.y + enemy.height / 2) - (e.y + e.height / 2);
                const minDist = (Math.max(enemy.width, enemy.height) + Math.max(e.width, e.height)) / 2;
                return Math.abs(dx) < minDist && Math.abs(dy) < minDist;
            });

            tryCount++;
            // 無限ループ防止（20回試してもダメなら諦める）
            if (tryCount > 20) break;
        } while (overlap);

        this.enemies.push(enemy);
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

    // アニメーションメソッドに機能持たせすぎ？FIXME

    animate() {
        if (this.gameOver) {
            cancelAnimationFrame(this.animationId);
            this.gameOverMessage.classList.remove('hidden');
            return;
        }

        this.updateDeltaTime();
        const { scrollX, scrollY } = this.calcScroll();

        this.ctx.clearRect(0, 0, this.VIEW_W, this.VIEW_H);
        this.drawBackground(scrollX, scrollY);

        // 攻撃範囲の描画
        if (this.attackCircle && this.attackCircle.timer > 0) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.3;
            this.ctx.beginPath();
            this.ctx.arc(
                this.attackCircle.x - scrollX,
                this.attackCircle.y - scrollY,
                this.attackCircle.radius, // ←ここを同期
                0, Math.PI * 2
            );
            this.ctx.fillStyle = '#0af';
            this.ctx.fill();
            this.ctx.restore();
            this.attackCircle.timer--;
        }

        this.player.update(this.deltaTime);
        this.player.draw(this.ctx, scrollX, scrollY);

        this.updateEnemySpawn();
        this.updateEnemies(scrollX, scrollY);
        this.updateParticles(scrollX, scrollY);

        this.checkGameOver();

        this.gameFrame++;
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    updateDeltaTime() {
        const now = performance.now();
        this.lastTime = this.lastTime || now;
        this.deltaTime = (now - this.lastTime) / 1000;
        this.lastTime = now;
    }

    calcScroll() {
        let scrollX = this.player.x - this.VIEW_W / 2;
        let scrollY = this.player.y - this.VIEW_H / 2;
        scrollX = Math.max(0, Math.min(this.MAP_W - this.VIEW_W, scrollX));
        scrollY = Math.max(0, Math.min(this.MAP_H - this.VIEW_H, scrollY));
        return { scrollX, scrollY };
    }

    updateEnemySpawn() {
        if (this.gameFrame > 0 && this.gameFrame % this.SPAWN_INTERVAL_DECREASE_FREQUENCY === 0) {
            this.currentEnemySpawnInterval = Math.max(this.MIN_ENEMY_SPAWN_INTERVAL, this.currentEnemySpawnInterval - this.SPAWN_INTERVAL_DECREASE_RATE);
        }
        const actualSpawnInterval = Math.max(1, Math.floor(this.currentEnemySpawnInterval + (Math.random() * 40 - 20)));
        if (this.gameFrame % actualSpawnInterval === 0) {
            this.spawnEnemy();
        }
    }

    updateEnemies(scrollX, scrollY) {
        const enemiesToKeep = [];
        this.enemies.forEach(enemy => {
            enemy.update();
            enemy.draw(this.ctx, scrollX, scrollY);
            if (this.checkPlayerCollision(enemy)) {
                if (!enemy.markedForDeletion) {
                    this.player.hp -= 20;
                    if (this.player.hp < 0) this.player.hp = 0;
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
    }

    checkPlayerCollision(enemy) {
        return (
            enemy.x < this.player.x + this.player.width / 2 &&
            enemy.x + enemy.width > this.player.x - this.player.width / 2 &&
            enemy.y < this.player.y + this.player.height / 2 &&
            enemy.y + enemy.height > this.player.y - this.player.height / 2
        );
    }

    updateParticles(scrollX, scrollY) {
        this.particles.forEach(particle => {
            particle.update();
            particle.draw(this.ctx, scrollX, scrollY);
        });
        this.particles = this.particles.filter(particle => !particle.markedForDeletion);
    }

    checkGameOver() {
        if (this.player.hp <= 0) {
            this.gameOver = true;
        }
    }
}