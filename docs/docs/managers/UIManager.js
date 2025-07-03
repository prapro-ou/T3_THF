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
        if (!this.pauseMessage) {
            this.pauseMessage = document.createElement('div');
            this.pauseMessage.id = 'pauseMessage';
            this.pauseMessage.innerHTML = 'ポーズ中 (Pキーで再開)<br><span style="font-size:0.7em;">Hキーで操作説明</span>';
            document.body.appendChild(this.pauseMessage);
        }
        this.pauseMessage.classList.remove('hidden');
    }

    hidePauseMessage() {
        if (this.pauseMessage) {
            this.pauseMessage.classList.add('hidden');
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
} 