import { Game } from './Game.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM取得
    const gameCanvas = document.getElementById('gameCanvas');
    const ctx = gameCanvas.getContext('2d');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const livesDisplay = document.getElementById('livesDisplay');
    const gameOverMessage = document.getElementById('gameOverMessage');
    const restartButton = document.getElementById('restartButton');

    // ゲーム開始
    new Game(gameCanvas, ctx, scoreDisplay, livesDisplay, gameOverMessage, restartButton);
}); 