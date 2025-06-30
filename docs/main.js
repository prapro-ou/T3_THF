import { Game } from './core/Game.js';
import { preloadMomotaroSpriteSheet } from './components/PlayerRenderer.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM取得
    const gameCanvas = document.getElementById('gameCanvas');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const livesDisplay = document.getElementById('livesDisplay');
    const timerDisplay = document.getElementById('timerDisplay');
    const gameOverMessage = document.getElementById('gameOverMessage');
    const restartButton = document.getElementById('restartButton');
    const startScreen = document.getElementById('startScreen');
    const startButton = document.getElementById('startButton');
    const helpButton = document.getElementById('help');
    const helpModal = document.getElementById('helpModal');
    const closeHelp = document.getElementById('closeHelp');
    const backToStartButton = document.querySelector('.backToStart');
    const quickHelp = document.getElementById('quickHelp');

    let game = null;

    startButton.addEventListener('click', () => {
        preloadMomotaroSpriteSheet(() => {
            // スタート画面を非表示、ゲーム画面を表示
            startScreen.classList.add('hidden');
            gameCanvas.classList.remove('hidden');
            scoreDisplay.classList.remove('hidden');
            livesDisplay.classList.remove('hidden');
            timerDisplay.classList.remove('hidden'); // タイマー表示を有効化
            // ゲーム開始
            game = new Game(gameCanvas, gameCanvas.getContext('2d'), scoreDisplay, livesDisplay, gameOverMessage, restartButton, timerDisplay);
            quickHelp.classList.remove('hidden'); // ゲーム開始時に表示
        });
    });

    // リスタート時もゲーム画面を維持
    restartButton.addEventListener('click', () => {
        gameCanvas.classList.remove('hidden');
        scoreDisplay.classList.remove('hidden');
        livesDisplay.classList.remove('hidden');
        timerDisplay.classList.remove('hidden'); // タイマー表示を維持
        quickHelp.classList.remove('hidden'); // リスタート時も表示
    });

    // 操作説明表示
    helpButton.addEventListener('click', () => {
        helpModal.classList.remove('hidden');
    });
    // 操作説明閉じる
    closeHelp.addEventListener('click', () => {
        helpModal.classList.add('hidden');
    });
    // スタート画面へ戻る
    backToStartButton.addEventListener('click', () => {
        gameCanvas.classList.add('hidden');
        scoreDisplay.classList.add('hidden');
        livesDisplay.classList.add('hidden');
        timerDisplay.classList.add('hidden'); // タイマー表示を非表示
        gameOverMessage.classList.add('hidden');
        startScreen.classList.remove('hidden');
        quickHelp.classList.add('hidden'); // スタート画面では非表示
        if (game) {
            game.stop(); // ゲームを停止
            game = null; // ゲームインスタンスをリセット
        }
    });

    // Hキーで操作説明モーダルを開く（ポーズ中のみ）
    window.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'h') {
            // ゲームインスタンスが存在し、ポーズ中のみ許可
            if (game && game.pauseManager.isPaused) {
                helpModal.classList.remove('hidden');
            }
        }
    });

    // 操作説明ボタンもポーズ中のみ有効
    helpButton.addEventListener('click', () => {
        if (game && game.pauseManager.isPaused) {
            helpModal.classList.remove('hidden');
        }
    });

    document.addEventListener('visibilitychange', () => {
        if (!game) return;
        if (document.hidden && !game.isPaused) {
            game.togglePause();
        }
    });
});
