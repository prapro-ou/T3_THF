export class UIManager {
    constructor(scoreDisplay, livesDisplay, timerDisplay, gameOverMessage, restartButton) {
        this.scoreDisplay = scoreDisplay;
        this.livesDisplay = livesDisplay;
        this.timerDisplay = timerDisplay;
        this.gameOverMessage = gameOverMessage;
        this.restartButton = restartButton;
        this.pauseMessage = null;
    }

    updateScore(score) {
        this.scoreDisplay.textContent = `スコア: ${score}`;
    }

    updateAmmo(ammo, maxAmmo) {
        this.livesDisplay.textContent = `残弾数: ${ammo}/${maxAmmo}`;
    }

    updateTimer(formattedTime) {
        this.timerDisplay.textContent = `残り時間: ${formattedTime}`;
    }

    // ボス出現までの時間とボス残り時間を表示
    updateBossTimer(game) {
        if (!game) return;
        
        let displayText = '';
        
        if (game.bossAppeared && !game.bossDefeated) {
            // ボス出現中：ボス残り時間を表示
            const elapsed = Math.floor((Date.now() - game.bossStartTime) / 1000);
            const remaining = Math.max(0, game.bossTimer - elapsed);
            const minutes = String(Math.floor(remaining / 60)).padStart(2, '0');
            const seconds = String(remaining % 60).padStart(2, '0');
            displayText = `ボス残り時間: ${minutes}:${seconds}`;
        } else {
            // ボス未出現：ボス出現までの時間を表示
            const elapsedTime = game.timer.getElapsedTime();
            const bossSpawnTime = game.bossSpawnTime || 180;
            const remaining = Math.max(0, bossSpawnTime - elapsedTime);
            const minutes = String(Math.floor(remaining / 60)).padStart(2, '0');
            const seconds = String(remaining % 60).padStart(2, '0');
            displayText = `ボス出現まで: ${minutes}:${seconds}`;
        }
        
        this.timerDisplay.textContent = displayText;
    }

    showGameOver(message = 'ゲームオーバー') {
        this.gameOverMessage.classList.remove('hidden');
        const gameOverText = this.gameOverMessage.querySelector('.game-over-text');
        if (gameOverText) {
            gameOverText.textContent = message;
        }
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

    showBossCutIn() {
        const bossCutIn = document.getElementById('bossCutIn');
        if (bossCutIn) {
            bossCutIn.classList.remove('hidden');
        }
    }

    hideBossCutIn() {
        const bossCutIn = document.getElementById('bossCutIn');
        if (bossCutIn) {
            bossCutIn.classList.add('hidden');
        }
    }

    setRestartCallback(callback) {
        this.restartCallback = callback;
        if (this.restartButton) {
            this.restartButton.addEventListener('click', () => {
                if (this.restartCallback) {
                    this.restartCallback();
                }
            });
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
}