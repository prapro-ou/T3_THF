export class UIManager {
    constructor(scoreDisplay, livesDisplay, timerDisplay, gameOverMessage, restartButton) {
        this.scoreDisplay = scoreDisplay;
        this.livesDisplay = livesDisplay;
        this.timerDisplay = timerDisplay;
        this.gameOverMessage = gameOverMessage;
        this.restartButton = restartButton;
        this.pauseMessage = null;
        
        // ミニマップ関連の初期化
        this.minimapContainer = document.getElementById('minimapContainer');
        this.minimapCanvas = document.getElementById('minimapCanvas');
        this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;
    }

    updateScore(score) {
        this.scoreDisplay.textContent = `スコア: ${score}`;
    }

    updateAmmo(ammo, maxAmmo) {
        this.livesDisplay.textContent = `残弾数: ${ammo}/${maxAmmo}`;
    }

    updateTimer(formattedTime, phase = 'normal') {
        if (phase === 'normal') {
            this.timerDisplay.textContent = `ボス出現まで: ${formattedTime}`;
        } else if (phase === 'boss') {
            this.timerDisplay.textContent = `ボス攻略残り: ${formattedTime}`;
        } else {
            this.timerDisplay.textContent = formattedTime;
        }
    }

    showGameOver(message = 'ゲームオーバー') {
        const messageElement = this.gameOverMessage.querySelector('.game-over-text');
        if (messageElement) {
            messageElement.textContent = message;
        }
        this.gameOverMessage.classList.remove('hidden');
    }

    hideGameOver() {
        this.gameOverMessage.classList.add('hidden');
    }

    showPauseMessage() {
        const pauseMessage = document.getElementById('pauseMessage');
        if (pauseMessage) {
            pauseMessage.classList.remove('hidden');
        }
    }

    hidePauseMessage() {
        const pauseMessage = document.getElementById('pauseMessage');
        if (pauseMessage) {
            pauseMessage.classList.add('hidden');
        }
    }

    showElement(element) {
        if (element.classList) {
            element.classList.remove('hidden');
        }
    }

    hideElement(element) {
        if (element.classList) {
            element.classList.add('hidden');
        }
    }

    setRestartCallback(callback) {
        this.restartButton.addEventListener('click', callback);
    }

    showBossCutIn() {
        const cutIn = document.getElementById('bossCutIn');
        if (cutIn) {
            cutIn.classList.remove('hidden');
        }
    }

    hideBossCutIn() {
        const cutIn = document.getElementById('bossCutIn');
        if (cutIn) {
            cutIn.classList.add('hidden');
        }
    }

    updateOtomoLevel(level, exp, expToLevelUp) {
        const levelDisplay = document.getElementById('otomoLevelDisplay');
        const levelValue = document.getElementById('otomoLevelValue');
        const expValue = document.getElementById('otomoExpValue');
        const expToLevelUpValue = document.getElementById('otomoExpToLevelUpValue');
        if (levelDisplay && levelValue && expValue && expToLevelUpValue) {
            levelDisplay.classList.remove('hidden');
            levelValue.textContent = level;
            expValue.textContent = exp;
            expToLevelUpValue.textContent = expToLevelUp;
        }
    }

    // ミニマップ表示/非表示
    showMinimap() {
        if (this.minimapContainer) {
            this.minimapContainer.classList.remove('hidden');
        }
    }

    hideMinimap() {
        if (this.minimapContainer) {
            this.minimapContainer.classList.add('hidden');
        }
    }

    // ミニマップの描画
    updateMinimap(player, enemies, mapWidth, mapHeight, scrollX, scrollY, renderer) {
        if (!this.minimapCtx) return;

        const canvas = this.minimapCanvas;
        const ctx = this.minimapCtx;
        
        // キャンバスをクリア
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // スケール計算（マップ全体をミニマップに収める）
        const scaleX = canvas.width / mapWidth;
        const scaleY = canvas.height / mapHeight;
        
        // 背景画像を描画
        if (renderer) {
            const backgroundInfo = renderer.getBackgroundForMinimap();
            if (backgroundInfo.loaded && backgroundInfo.image) {
                // 背景画像をミニマップサイズに合わせて描画
                ctx.drawImage(
                    backgroundInfo.image,
                    0, 0, backgroundInfo.image.width, backgroundInfo.image.height,
                    0, 0, canvas.width, canvas.height
                );
            } else {
                // 背景画像がロードされていない場合はダークグレー
                ctx.fillStyle = '#2a2a2a';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        } else {
            // rendererが提供されていない場合はダークグレー
            ctx.fillStyle = '#2a2a2a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // 現在の画面範囲を描画（半透明の四角形）
        // 実際の画面サイズを取得
        const viewportWidth = renderer ? renderer.getViewDimensions().width : 800;
        const viewportHeight = renderer ? renderer.getViewDimensions().height : 600;
        const viewX = scrollX * scaleX;
        const viewY = scrollY * scaleY;
        const viewW = viewportWidth * scaleX;
        const viewH = viewportHeight * scaleY;
        
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 1;
        ctx.strokeRect(viewX, viewY, viewW, viewH);
        ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
        ctx.fillRect(viewX, viewY, viewW, viewH);
        
        // プレイヤーを描画（青い点）
        if (player) {
            const playerX = player.x * scaleX;
            const playerY = player.y * scaleY;
            
            ctx.fillStyle = '#00aaff';
            ctx.beginPath();
            ctx.arc(playerX, playerY, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // プレイヤーの周りに白い縁を追加（視認性向上）
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(playerX, playerY, 3, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // 敵を描画（赤い点）
        if (enemies && enemies.length > 0) {
            enemies.forEach(enemy => {
                const enemyX = (enemy.x + enemy.width / 2) * scaleX;
                const enemyY = (enemy.y + enemy.height / 2) * scaleY;
                
                // ボス敵は大きく、通常の敵は小さく
                const isBoss = enemy.constructor.name.includes('Boss');
                const radius = isBoss ? 4 : 2;
                const color = isBoss ? '#ff0000' : '#ff6666';
                
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(enemyX, enemyY, radius, 0, Math.PI * 2);
                ctx.fill();
                
                // 敵の周りに白い縁を追加（視認性向上）
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(enemyX, enemyY, radius, 0, Math.PI * 2);
                ctx.stroke();
            });
        }
    }
}