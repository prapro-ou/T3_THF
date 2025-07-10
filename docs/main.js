import { Game } from './core/Game.js';
import { preloadMomotaroSpriteSheet } from './components/PlayerRenderer.js';
import { preloadRedOniSpriteSheet, preloadEnemySpriteSheet } from './components/EnemyRenderer.js';

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
    const backToStartFromStageButton = document.getElementById('backToStartButton');
    const quickHelp = document.getElementById('quickHelp');
    const loadingScreen = document.getElementById('loading-screen');
    const stageSelect = document.getElementById('stageSelect');
    const stageSelectArea = document.getElementById('stageSelectArea');
    
    // ポーズ画面の要素
    const pauseMessage = document.getElementById('pauseMessage');
    const resumeButton = document.getElementById('resumeButton');
    const pauseHelpButton = document.getElementById('pauseHelpButton');
    const pauseBackToStartButton = document.getElementById('pauseBackToStartButton');
    
    // 障子風アニメーション用の要素
    const shojiContainer = document.querySelector('.shoji-container');

    // 障子風画面切り替え関数（開く方向）
    function switchToScreenWithShojiOpen(fromScreen, toScreen, callback = null) {
        // 障子コンテナを表示
        shojiContainer.classList.remove('hidden');
        
        // 障子を閉じる（画面を隠す）
        setTimeout(() => {
            shojiContainer.classList.add('shoji-close');
        }, 100);
        
        // 障子が閉じた後、画面を切り替え
        setTimeout(() => {
            if (fromScreen) {
                fromScreen.classList.add('hidden');
            }
            
            if (toScreen) {
                toScreen.classList.remove('hidden');
                // ボス選択画面の場合、確実に表示されるようにする
                if (toScreen === stageSelectArea) {
                    toScreen.style.display = 'flex';
                    toScreen.style.opacity = '1';
                    toScreen.style.transform = 'translateX(0)';
                    toScreen.style.zIndex = '5';
                }
            }
            
            // 障子を開く（新しい画面を表示）
            shojiContainer.classList.remove('shoji-close');
            shojiContainer.classList.add('shoji-open');
            
            // アニメーション完了後、障子コンテナを隠す
            setTimeout(() => {
                shojiContainer.classList.add('hidden');
                shojiContainer.classList.remove('shoji-open');
                if (callback) callback();
            }, 800);
        }, 100);
    }

    // 障子風画面切り替え関数（閉じる方向）
    function switchToScreenWithShojiClose(fromScreen, toScreen, callback = null) {
        // 障子コンテナを表示（開いた状態から開始）
        shojiContainer.classList.remove('hidden');
        shojiContainer.classList.add('shoji-open');
        
        // 障子を閉じる
        setTimeout(() => {
            shojiContainer.classList.remove('shoji-open');
            shojiContainer.classList.add('shoji-close');
        }, 100);
        
        // 障子が完全に閉じた後、画面を切り替え
        setTimeout(() => {
            // 画面を切り替え
            if (fromScreen) {
                fromScreen.classList.add('hidden');
            }
            
            if (toScreen) {
                toScreen.classList.remove('hidden');
            }
        }, 800);
        
        // アニメーション完了後、障子コンテナを隠す
        setTimeout(() => {
            shojiContainer.classList.add('hidden');
            shojiContainer.classList.remove('shoji-close');
            if (callback) callback();
        }, 900);
    }

    let game = null;
    let assetsLoaded = false;

    // 1. ゲーム開始ボタンを一時的に無効化
    startButton.disabled = true;
    startButton.textContent = 'ロード中...';
    loadingScreen.style.display = '';

    // リトライ付きプリロード
    function tryPreload(retryCount = 0) {
        preloadMomotaroSpriteSheet(() => {
            if (window.momotaroSpriteSheetLoaded) {
                preloadRedOniSpriteSheet(() => {
                    if (window.redOniSpriteSheetLoaded) {
                        preloadEnemySpriteSheet('blue', () => {
                            preloadEnemySpriteSheet('black', () => {
                                assetsLoaded = true;
                                startButton.disabled = false;
                                startButton.textContent = 'ゲームスタート';
                                loadingScreen.style.display = 'none';
                            });
                        });
                    } else if (retryCount < 10) {
                        setTimeout(() => tryPreload(retryCount + 1), 500);
                    } else {
                        startButton.textContent = 'ロード失敗（再読み込みしてください）';
                        loadingScreen.innerHTML = '<h2>ロード失敗</h2><p>ページを再読み込みしてください</p>';
                    }
                });
            } else if (retryCount < 10) {
                setTimeout(() => tryPreload(retryCount + 1), 500);
            } else {
                startButton.textContent = 'ロード失敗（再読み込みしてください）';
                loadingScreen.innerHTML = '<h2>ロード失敗</h2><p>ページを再読み込みしてください</p>';
            }
        });
    }
    tryPreload();

    startButton.addEventListener('click', () => {
        if (!assetsLoaded) return; // 念のため
        
        console.log('スタートボタンがクリックされました');
        
        // 障子風アニメーションでボス選択画面へ（開く方向）
        switchToScreenWithShojiOpen(startScreen, stageSelectArea, () => {
            console.log('障子アニメーション完了');
            // ボス選択画面が確実に表示されるようにする
            stageSelectArea.style.display = 'flex';
            stageSelectArea.style.opacity = '1';
            stageSelectArea.style.transform = 'translateX(0)';
        });
    });

    // リスタート時もゲーム画面を維持
    restartButton.addEventListener('click', () => {
        gameCanvas.classList.remove('hidden');
        scoreDisplay.classList.remove('hidden');
        livesDisplay.classList.remove('hidden');
        timerDisplay.classList.remove('hidden'); // タイマー表示を維持
        quickHelp.classList.remove('hidden'); // リスタート時も表示
        // ステージ選択値を取得
        const selectedBossType = parseInt(stageSelect.value, 10);
        game = new Game(gameCanvas, gameCanvas.getContext('2d'), scoreDisplay, livesDisplay, gameOverMessage, restartButton, timerDisplay, selectedBossType);
    });

    // 操作説明表示
    helpButton.addEventListener('click', () => {
        helpModal.classList.remove('hidden');
    });
    // 操作説明閉じる
    closeHelp.addEventListener('click', () => {
        helpModal.classList.add('hidden');
    });
    
    // ボス選択画面からスタート画面へ戻る
    backToStartFromStageButton.addEventListener('click', () => {
        console.log('ボス選択画面から戻るボタンがクリックされました');
        
        // 障子風アニメーションでスタート画面へ（閉じる方向）
        switchToScreenWithShojiClose(stageSelectArea, startScreen, () => {
            console.log('戻る障子アニメーション完了');
        });
    });
    
    // スタート画面へ戻る
    backToStartButton.addEventListener('click', () => {
        // ゲーム画面を非表示
        gameCanvas.classList.add('hidden');
        scoreDisplay.classList.add('hidden');
        livesDisplay.classList.add('hidden');
        timerDisplay.classList.add('hidden');
        gameOverMessage.classList.add('hidden');
        quickHelp.classList.add('hidden');
        
        // 障子風アニメーションでスタート画面へ（閉じる方向）
        switchToScreenWithShojiClose(null, startScreen, () => {
            if (game) {
                game.stop(); // ゲームを停止
                game = null; // ゲームインスタンスをリセット
            }
        });
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

    // ポーズ画面のボタンイベントハンドラー
    resumeButton.addEventListener('click', () => {
        if (game) {
            game.togglePause();
        }
    });
    
    pauseHelpButton.addEventListener('click', () => {
        helpModal.classList.remove('hidden');
    });
    
    pauseBackToStartButton.addEventListener('click', () => {
        // ゲーム画面を非表示
        gameCanvas.classList.add('hidden');
        scoreDisplay.classList.add('hidden');
        livesDisplay.classList.add('hidden');
        timerDisplay.classList.add('hidden');
        pauseMessage.classList.add('hidden');
        quickHelp.classList.add('hidden');
        
        // 障子風アニメーションでスタート画面へ（閉じる方向）
        switchToScreenWithShojiClose(null, startScreen, () => {
            if (game) {
                game.stop(); // ゲームを停止
                game = null; // ゲームインスタンスをリセット
            }
        });
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

    // ボスカード選択でゲーム開始
    const bossCards = document.querySelectorAll('.boss-card');
    bossCards.forEach(card => {
        card.addEventListener('click', () => {
            bossCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            // ボス種別取得
            const selectedBossType = parseInt(card.getAttribute('data-boss'), 10);
            
            // 障子風アニメーションでゲーム画面へ（開く方向）
            switchToScreenWithShojiOpen(stageSelectArea, null, () => {
                // ゲーム画面を表示
                gameCanvas.classList.remove('hidden');
                scoreDisplay.classList.remove('hidden');
                livesDisplay.classList.remove('hidden');
                timerDisplay.classList.remove('hidden');
                quickHelp.classList.remove('hidden');
                
                // ゲーム開始
                game = new Game(gameCanvas, gameCanvas.getContext('2d'), scoreDisplay, livesDisplay, gameOverMessage, restartButton, timerDisplay, selectedBossType);
            });
        });
    });
});
