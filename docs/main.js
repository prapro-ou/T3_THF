import { Game } from './Game.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM取得
    const gameCanvas = document.getElementById('gameCanvas');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const livesDisplay = document.getElementById('livesDisplay');
    const gameOverMessage = document.getElementById('gameOverMessage');
    const restartButton = document.getElementById('restartButton');
    const startScreen = document.getElementById('startScreen');
    const startButton = document.getElementById('startButton');
    const helpButton = document.getElementById('help');
    const helpModal = document.getElementById('helpModal');
    const closeHelp = document.getElementById('closeHelp');

    let game = null;

    startButton.addEventListener('click', () => {
        // スタート画面を非表示、ゲーム画面を表示
        startScreen.classList.add('hidden');
        gameCanvas.classList.remove('hidden');
        scoreDisplay.classList.remove('hidden');
        livesDisplay.classList.remove('hidden');
        // ゲーム開始
        game = new Game(gameCanvas, gameCanvas.getContext('2d'), scoreDisplay, livesDisplay, gameOverMessage, restartButton);
    });

    // リスタート時もゲーム画面を維持
    restartButton.addEventListener('click', () => {
        gameCanvas.classList.remove('hidden');
        scoreDisplay.classList.remove('hidden');
        livesDisplay.classList.remove('hidden');
    });

    // 操作説明表示
    helpButton.addEventListener('click', () => {
        helpModal.classList.remove('hidden');
    });
    // 操作説明閉じる
    closeHelp.addEventListener('click', () => {
        helpModal.classList.add('hidden');
    });
});