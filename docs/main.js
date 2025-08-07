import { Game } from './core/Game.js';
import { preloadMomotaroSpriteSheet } from './components/PlayerRenderer.js';
import { preloadRedOniSpriteSheet, preloadEnemySpriteSheet, preloadCannonOniSpriteSheet, preloadBossOni2SpriteSheet } from './components/EnemyRenderer.js';
import { BgmManager } from './managers/BgmManager.js';

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
    const minimapContainer = document.getElementById('minimapContainer');
    
    // デバッグパネルの要素
    const debugPanel = document.getElementById('debugPanel');
    const closeDebug = document.getElementById('closeDebug');
    const applyDebugSettings = document.getElementById('applyDebugSettings');
    const resetDebugSettings = document.getElementById('resetDebugSettings');
    
    // ポーズ画面の要素
    const pauseMessage = document.getElementById('pauseMessage');
    const resumeButton = document.getElementById('resumeButton');
    const pauseHelpButton = document.getElementById('pauseHelpButton');
    const pauseBackToStartButton = document.getElementById('pauseBackToStartButton');
    
    // BGMマネージャーの初期化（最初のユーザー操作後に再生開始）
    const bgmManager = new BgmManager();
    bgmManager.play('mainBgm'); // ユーザー操作後まで保留される

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
    let selectedBossType = 0; // 選択されたボスの種類

    // 1. ゲーム開始ボタンを一時的に無効化
    startButton.disabled = true;
    startButton.textContent = 'ロード中...';
    loadingScreen.style.display = '';

    // ボス選択機能を追加
    const bossCardElements = document.querySelectorAll('.boss-card');
    console.log('ボスカード要素数:', bossCardElements.length);
    bossCardElements.forEach((card, index) => {
        console.log(`ボスカード${index + 1}:`, card.dataset.boss);
        card.addEventListener('click', () => {
            console.log('ボスカードがクリックされました:', card.dataset.boss);
            // 他のカードの選択状態を解除
            bossCardElements.forEach(c => c.classList.remove('selected'));
            // このカードを選択状態にする
            card.classList.add('selected');
            // 選択されたボスの種類を記録
            selectedBossType = parseInt(card.dataset.boss, 10);
            console.log('ボス選択完了:', selectedBossType);
        });
    });

    // リトライ付きプリロード
    function tryPreload(retryCount = 0) {
        preloadMomotaroSpriteSheet(() => {
            if (window.momotaroSpriteSheetLoaded) {
                preloadRedOniSpriteSheet(() => {
                    if (window.redOniSpriteSheetLoaded) {
                        preloadEnemySpriteSheet('blue', () => {
                            preloadEnemySpriteSheet('black', () => {
                                preloadCannonOniSpriteSheet(() => {
                                    // BossOni2の画像プリロードを追加
                                    preloadBossOni2SpriteSheet(() => {
                                        assetsLoaded = true;
                                        startButton.disabled = false;
                                        startButton.textContent = 'ゲームスタート';
                                        loadingScreen.style.display = 'none';
                                    });
                                });
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
        console.log('リスタートボタンがクリックされました');
        console.log('現在のselectedBossType:', selectedBossType);
        
        gameCanvas.classList.remove('hidden');
        scoreDisplay.classList.remove('hidden');
        livesDisplay.classList.remove('hidden');
        timerDisplay.classList.remove('hidden'); // タイマー表示を維持
        minimapContainer.classList.remove('hidden'); // ミニマップ表示
        quickHelp.classList.remove('hidden'); // リスタート時も表示
        // 選択されたボスの種類を使用
        console.log('ゲーム開始、選択されたボス:', selectedBossType);
        game = new Game(gameCanvas, gameCanvas.getContext('2d'), scoreDisplay, livesDisplay, gameOverMessage, restartButton, timerDisplay, selectedBossType,bgmManager);
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
        minimapContainer.classList.add('hidden'); // ミニマップ非表示
        gameOverMessage.classList.add('hidden');
        quickHelp.classList.add('hidden');
        
        // otomoLevelDisplayも非表示にする
        const otomoLevelDisplay = document.getElementById('otomoLevelDisplay');
        if (otomoLevelDisplay) {
            otomoLevelDisplay.classList.add('hidden');
        }
        
        // 障子風アニメーションでスタート画面へ（閉じる方向）
        switchToScreenWithShojiClose(null, startScreen, () => {
            if (game) {
                game.destroy(); // ゲームを完全に破棄
                game = null; // ゲームインスタンスをリセット
            }
            bgmManager.play('mainBgm');
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
        minimapContainer.classList.add('hidden'); // ミニマップ非表示
        pauseMessage.classList.add('hidden');
        quickHelp.classList.add('hidden');
        
        // otomoLevelDisplayも非表示にする
        const otomoLevelDisplay = document.getElementById('otomoLevelDisplay');
        if (otomoLevelDisplay) {
            otomoLevelDisplay.classList.add('hidden');
        }
        
        // 障子風アニメーションでスタート画面へ（閉じる方向）
        switchToScreenWithShojiClose(null, startScreen, () => {
            if (game) {
                game.destroy(); // ゲームを完全に破棄
                game = null; // ゲームインスタンスをリセット
            }
            bgmManager.play('mainBgm');
        });
    });
    
    // 操作説明ボタンもポーズ中のみ有効
    helpButton.addEventListener('click', () => {
        if (game && game.pauseManager.isPaused) {
            helpModal.classList.remove('hidden');
        }
    });

    // デバッグパネルのイベントハンドラー
    closeDebug.addEventListener('click', () => {
        debugPanel.classList.add('hidden');
    });

    applyDebugSettings.addEventListener('click', () => {
        if (!game) return;
        
        // 鬼の設定を適用
        const enemySpawnInterval = parseInt(document.getElementById('enemySpawnInterval').value);
        const maxEnemies = parseInt(document.getElementById('maxEnemies').value);
        const redOniHP = parseInt(document.getElementById('redOniHP').value);
        const blueOniHP = parseInt(document.getElementById('blueOniHP').value);
        const blackOniHP = parseInt(document.getElementById('blackOniHP').value);
        const enemyBaseSpeed = parseFloat(document.getElementById('enemyBaseSpeed').value);
        const bossSpawnTime = parseInt(document.getElementById('bossSpawnTime').value);
        const bossBattleTime = parseInt(document.getElementById('bossBattleTime').value);
        
        // プレイヤーの設定を適用
        const playerHP = parseInt(document.getElementById('playerHP').value);
        const playerSpeed = parseFloat(document.getElementById('playerSpeed').value);
        const maxAmmo = parseInt(document.getElementById('maxAmmo').value);
        const ammoRecoveryTime = parseFloat(document.getElementById('ammoRecoveryTime').value);
        
        // 当たり判定表示設定を適用
        const showPlayerHitbox = document.getElementById('showPlayerHitbox').checked;
        const showEnemyHitbox = document.getElementById('showEnemyHitbox').checked;
        const showProjectileHitbox = document.getElementById('showProjectileHitbox').checked;
        const showAttackRange = document.getElementById('showAttackRange').checked;
        
        // 高速移動設定を適用
        const highSpeedThreshold = parseInt(document.getElementById('highSpeedThreshold').value);
        const maxSubframeSteps = parseInt(document.getElementById('maxSubframeSteps').value);
        const enableLineIntersection = document.getElementById('enableLineIntersection').checked;
        
        // ボス設定を適用
        const bossOni1ProjectileSpeed = parseFloat(document.getElementById('bossOni1ProjectileSpeed').value);
        const bossOni1ProjectileDamage = parseInt(document.getElementById('bossOni1ProjectileDamage').value);
        
        // 当たり判定詳細設定を適用
        const showCollisionDebug = document.getElementById('showCollisionDebug').checked;
        const playerHitboxSize = parseFloat(document.getElementById('playerHitboxSize').value);
        
        // デバッグ情報を出力
        console.log('UI values from debug panel:', {
            showPlayerHitbox,
            showEnemyHitbox,
            showProjectileHitbox,
            showAttackRange,
            showCollisionDebug,
            playerHitboxSize
        });
        
        // 設定を適用
        const settings = {
            enemySpawnInterval,
            maxEnemies,
            redOniHP,
            blueOniHP,
            blackOniHP,
            enemyBaseSpeed,
            bossSpawnTime,
            bossBattleTime,
            playerHP,
            playerSpeed,
            maxAmmo,
            ammoRecoveryTime,
            showPlayerHitbox,
            showEnemyHitbox,
            showProjectileHitbox,
            showAttackRange,
            highSpeedThreshold,
            maxSubframeSteps,
            enableLineIntersection,
            bossOni1ProjectileSpeed,
            bossOni1ProjectileDamage,
            showCollisionDebug,
            playerHitboxSize
        };
        
        console.log('Applying settings to game:', settings);
        game.applyDebugSettings(settings);
        
        debugPanel.classList.add('hidden');
    });

    resetDebugSettings.addEventListener('click', () => {
        // デフォルト値にリセット
        document.getElementById('enemySpawnInterval').value = 60;
        document.getElementById('maxEnemies').value = 20;
        document.getElementById('redOniHP').value = 20;
        document.getElementById('blueOniHP').value = 40;
        document.getElementById('blackOniHP').value = 60;
        document.getElementById('enemyBaseSpeed').value = 1;
        document.getElementById('bossSpawnTime').value = 180;
        document.getElementById('bossBattleTime').value = 120;
        document.getElementById('playerHP').value = 100;
        document.getElementById('playerSpeed').value = 3.5;
        document.getElementById('maxAmmo').value = 10;
        document.getElementById('ammoRecoveryTime').value = 3;
        
        // 当たり判定表示設定をデフォルトにリセット
        document.getElementById('showPlayerHitbox').checked = false;
        document.getElementById('showEnemyHitbox').checked = false;
        document.getElementById('showProjectileHitbox').checked = false;
        document.getElementById('showAttackRange').checked = false;
        document.getElementById('showCollisionDebug').checked = false; // デバッグ情報もOFF
        
        // 高速移動設定をデフォルトにリセット
        document.getElementById('highSpeedThreshold').value = 10;
        document.getElementById('maxSubframeSteps').value = 10;
        document.getElementById('enableLineIntersection').checked = true;
        
        // ボス設定をデフォルトにリセット
        document.getElementById('bossOni1ProjectileSpeed').value = 3;
        document.getElementById('bossOni1ProjectileDamage').value = 15;
        
        // 当たり判定詳細設定をデフォルトにリセット
        document.getElementById('showCollisionDebug').checked = true;
        document.getElementById('playerHitboxSize').value = 0.8;
    });

    // F12キーでデバッグパネルを開く
    window.addEventListener('keydown', (e) => {
        if (e.key === 'F12') {
            e.preventDefault();
            if (game) {
                debugPanel.classList.remove('hidden');
            }
        }
    });

    // ボス画像の読み込みエラー処理
    function handleBossImageError() {
        const bossCards = document.querySelectorAll('.boss-card');
        bossCards.forEach((card, index) => {
            const img = card.querySelector('img');
            if (img) {
                img.addEventListener('error', () => {
                    // 画像読み込みエラー時に代替表示に切り替え
                    const bossNames = ['四天王1', '四天王2', '四天王3', '四天王4', 'ラスボス'];
                    const placeholder = document.createElement('div');
                    placeholder.className = 'boss-placeholder';
                    placeholder.textContent = bossNames[index] || 'ボス';
                    img.replaceWith(placeholder);
                });
            }
        });
    }

    // ページ読み込み完了時に画像エラー処理を設定
    document.addEventListener('DOMContentLoaded', () => {
        handleBossImageError();
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
                minimapContainer.classList.remove('hidden'); // ミニマップ表示
                quickHelp.classList.remove('hidden');
                
                // ゲーム開始
                game = new Game(gameCanvas, gameCanvas.getContext('2d'), scoreDisplay, livesDisplay, gameOverMessage, restartButton, timerDisplay, selectedBossType,bgmManager);
                // cannon_ballのスプライトシートも読み込み
                if (game && game.projectileManager) {
                    game.projectileManager.preloadCannonBallSpriteSheet(() => {
                        // アセット読み込み完了後の処理
                    });
                }
            });
        });
    });
});
