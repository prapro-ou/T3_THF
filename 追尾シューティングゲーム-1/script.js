document.addEventListener('DOMContentLoaded', () => {
    const gameCanvas = document.getElementById('gameCanvas');
    const ctx = gameCanvas.getContext('2d');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const livesDisplay = document.getElementById('livesDisplay');
    const gameOverMessage = document.getElementById('gameOverMessage');
    const restartButton = document.getElementById('restartButton');

    let score = 0;
    let enemies = [];
    let particles = [];
    let gameFrame = 0;
    let animationId;
    let gameOver = false;

    const INITIAL_ENEMY_SPAWN_INTERVAL = 90;
    const MIN_ENEMY_SPAWN_INTERVAL = 30;
    const SPAWN_INTERVAL_DECREASE_RATE = 2;
    const SPAWN_INTERVAL_DECREASE_FREQUENCY = 300;
    let currentEnemySpawnInterval = INITIAL_ENEMY_SPAWN_INTERVAL;

    const ENEMY_BASE_SPEED = 2;
    const PLAYER_SPEED = 5;
    const INITIAL_PLAYER_LIVES = 3;
    let keys = {};

    class Player {
        constructor() {
            this.width = 80;
            this.height = 80;
            this.x = (gameCanvas.width - this.width) / 2;
            this.y = gameCanvas.height - this.height - 20;
            this.color = '#00f';
            this.lives = INITIAL_PLAYER_LIVES;
        }

        update() {
            if (keys['w']) this.y -= PLAYER_SPEED;
            if (keys['s']) this.y += PLAYER_SPEED;
            if (keys['a']) this.x -= PLAYER_SPEED;
            if (keys['d']) this.x += PLAYER_SPEED;

            if (this.x < 0) this.x = 0;
            if (this.x + this.width > gameCanvas.width) this.x = gameCanvas.width - this.width;
            if (this.y < 0) this.y = 0;
            if (this.y + this.height > gameCanvas.height) this.y = gameCanvas.height - this.height;
        }

        draw() {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeStyle = '#fff';
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }

    class Enemy {
        constructor() {
            this.width = 50;
            this.height = 50;
            this.markedForDeletion = false;
            this.color = `hsl(${Math.random() * 360}, 70%, 50%)`;
            this.speed = ENEMY_BASE_SPEED + Math.random() * 1;

            const spawnEdge = Math.floor(Math.random() * 4);
            switch (spawnEdge) {
                case 0:
                    this.x = Math.random() * (gameCanvas.width - this.width);
                    this.y = -this.height;
                    break;
                case 1:
                    this.x = gameCanvas.width;
                    this.y = Math.random() * (gameCanvas.height - this.height);
                    break;
                case 2:
                    this.x = Math.random() * (gameCanvas.width - this.width);
                    this.y = gameCanvas.height;
                    break;
                case 3:
                    this.x = -this.width;
                    this.y = Math.random() * (gameCanvas.height - this.height);
                    break;
            }
            this.dx = 0;
            this.dy = 0;
        }

        update() {
            const deltaX = player.x - this.x;
            const deltaY = player.y - this.y;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            if (distance > 0) {
                this.dx = (deltaX / distance) * this.speed;
                this.dy = (deltaY / distance) * this.speed;
            } else {
                this.dx = 0;
                this.dy = 0;
            }

            this.x += this.dx;
            this.y += this.dy;

            if (this.x < -this.width * 2 || this.x > gameCanvas.width + this.width * 2 ||
                this.y < -this.height * 2 || this.y > gameCanvas.height + this.height * 2) {
                this.markedForDeletion = true;
            }
        }

        draw() {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeStyle = '#fff';
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }

    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 7 + 3;
            this.speedX = Math.random() * 6 - 3;
            this.speedY = Math.random() * 6 - 3;
            this.color = color;
            this.life = 30;
            this.markedForDeletion = false;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.life--;
            if (this.life <= 0) {
                this.markedForDeletion = true;
            }
        }

        draw() {
            ctx.fillStyle = this.color;
            ctx.globalAlpha = this.life / 30;
            ctx.fillRect(this.x, this.y, this.size, this.size);
            ctx.globalAlpha = 1;
        }
    }

    const player = new Player();

    function initializeGame() {
        score = 0;
        enemies = [];
        particles = [];
        gameFrame = 0;
        gameOver = false;
        scoreDisplay.textContent = `スコア: ${score}`;
        player.lives = INITIAL_PLAYER_LIVES;
        livesDisplay.textContent = `ライフ: ${player.lives}`;
        gameOverMessage.classList.add('hidden');
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        keys = {};
        player.x = (gameCanvas.width - player.width) / 2;
        player.y = gameCanvas.height - player.height - 20;
        currentEnemySpawnInterval = INITIAL_ENEMY_SPAWN_INTERVAL; 
        animate();
    }

    function animate() {
        if (gameOver) {
            cancelAnimationFrame(animationId);
            gameOverMessage.classList.remove('hidden');
            return;
        }

        ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
        player.update();
        player.draw();

        if (gameFrame > 0 && gameFrame % SPAWN_INTERVAL_DECREASE_FREQUENCY === 0) {
            currentEnemySpawnInterval = Math.max(MIN_ENEMY_SPAWN_INTERVAL, currentEnemySpawnInterval - SPAWN_INTERVAL_DECREASE_RATE);
        }

        const actualSpawnInterval = Math.max(1, Math.floor(currentEnemySpawnInterval + (Math.random() * 40 - 20))); 
        if (gameFrame % actualSpawnInterval === 0) {
            spawnEnemy();
        }

        const enemiesToKeep = [];
        enemies.forEach(enemy => {
            enemy.update();
            enemy.draw();

            if (enemy.x < player.x + player.width &&
                enemy.x + enemy.width > player.x &&
                enemy.y < player.y + player.height &&
                enemy.y + enemy.height > player.y) {
                
                if (!enemy.markedForDeletion) {
                    player.lives--;
                    livesDisplay.textContent = `ライフ: ${player.lives}`;
                    enemy.markedForDeletion = true; 
                    
                    for (let p = 0; p < 15; p++) {
                        particles.push(new Particle(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color));
                    }
                }
            }
            if (!enemy.markedForDeletion) {
                enemiesToKeep.push(enemy);
            }
        });
        enemies = enemiesToKeep;

        if (player.lives <= 0) {
            gameOver = true;
        }

        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });

        particles = particles.filter(particle => !particle.markedForDeletion);

        gameFrame++;
        animationId = requestAnimationFrame(animate);
    }

    function spawnEnemy() {
        enemies.push(new Enemy());
    }

    gameCanvas.addEventListener('click', (event) => {
        if (gameOver) return;

        const mouseX = event.clientX - gameCanvas.getBoundingClientRect().left;
        const mouseY = event.clientY - gameCanvas.getBoundingClientRect().top;

        const newEnemies = [];
        let hit = false;
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            if (mouseX > enemy.x && mouseX < enemy.x + enemy.width &&
                mouseY > enemy.y && mouseY < enemy.y + enemy.height && !hit) { 
                
                enemy.markedForDeletion = true;
                score += 10;
                scoreDisplay.textContent = `スコア: ${score}`;
                hit = true;

                for (let p = 0; p < 15; p++) {
                    particles.push(new Particle(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color));
                }
            } else {
                newEnemies.unshift(enemy);
            }
        }
        enemies = newEnemies;
    });

    window.addEventListener('keydown', (e) => {
        keys[e.key.toLowerCase()] = true; 
    });

    window.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
    });

    restartButton.addEventListener('click', () => {
        initializeGame();
    });

    initializeGame();
});