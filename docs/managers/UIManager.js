﻿export class UIManager {
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
}