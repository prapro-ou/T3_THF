import { Game } from './core/Game.js';
import { preloadMomotaroSpriteSheet } from './components/PlayerRenderer.js';
import { preloadRedOniSpriteSheet, preloadEnemySpriteSheet, preloadCannonOniSpriteSheet, preloadBossOni2SpriteSheet, preloadFuzinSpriteSheet, preloadRaizinSpriteSheet, preloadWarpOniSpriteSheet } from './components/EnemyRenderer.js';
import { BgmManager } from './managers/BgmManager.js';
import { playSE } from './managers/KoukaonManager.js';

document.addEventListener('DOMContentLoaded', () => {
    // 鬼HP上昇ログ用
    const oniHpLogContainer = document.getElementById('oniHpLogContainer');
    window.oniHpLogContainer = oniHpLogContainer;
    // ステータス割り振りUI要素取得
    const statusModal = document.getElementById('statusModal');
    const statusPointsValue = document.getElementById('statusPointsValue');
    const statusAttackValue = document.getElementById('statusAttackValue');
    const statusSpeedValue = document.getElementById('statusSpeedValue');
    const statusReloadValue = document.getElementById('statusReloadValue');
    const addAttackBtn = document.getElementById('addAttackBtn');
    const subAttackBtn = document.getElementById('subAttackBtn');
    const addSpeedBtn = document.getElementById('addSpeedBtn');
    const subSpeedBtn = document.getElementById('subSpeedBtn');
    const addReloadBtn = document.getElementById('addReloadBtn');
    const subReloadBtn = document.getElementById('subReloadBtn');
    const statusApplyBtn = document.getElementById('statusApplyBtn');
    const statusCancelBtn = document.getElementById('statusCancelBtn');

    let tempAlloc = { attack: 0, speed: 0, reload: 0 };
    let tempPoints = 0;

    function openStatusModal() {
    if (!game) return;
    // 一時停止
    if (!game.isPaused) game.togglePause();
    // crosshair非表示
    if (crosshair) crosshair.classList.add('hidden');
    // 現在の割り振りをコピー
    tempAlloc = { ...game.statusAlloc };
    tempPoints = game.statusPoints;
    updateStatusModalUI();
    statusModal.classList.remove('hidden');
    }
    function closeStatusModal() {
    statusModal.classList.add('hidden');
    // crosshair再表示
    if (crosshair) crosshair.classList.remove('hidden');
    // 再開
    if (game && game.isPaused) game.togglePause();
    }
    function updateStatusModalUI() {
        statusPointsValue.textContent = tempPoints;
        statusAttackValue.textContent = tempAlloc.attack;
        statusSpeedValue.textContent = tempAlloc.speed;
        statusReloadValue.textContent = tempAlloc.reload;
    }
    function tryAddStatus(type) {
        if (tempPoints > 0) {
            tempAlloc[type]++;
            tempPoints--;
            updateStatusModalUI();
        }
    }
    function trySubStatus(type) {
        if (tempAlloc[type] > 0) {
            tempAlloc[type]--;
            tempPoints++;
            updateStatusModalUI();
        }
    }
    addAttackBtn.onclick = () => tryAddStatus('attack');
    subAttackBtn.onclick = () => trySubStatus('attack');
    addSpeedBtn.onclick = () => tryAddStatus('speed');
    subSpeedBtn.onclick = () => trySubStatus('speed');
    addReloadBtn.onclick = () => tryAddStatus('reload');
    subReloadBtn.onclick = () => trySubStatus('reload');
    statusApplyBtn.onclick = () => {
        if (!game) return;
        // 割り振りを反映
        game.statusAlloc = { ...tempAlloc };
        game.statusPoints = tempPoints;
        game.applyStatusAllocation();
        closeStatusModal();
    };
    statusCancelBtn.onclick = () => closeStatusModal();

    // "l"キーで開閉
    window.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'l' && game && !statusModal.classList.contains('hidden')) {
            closeStatusModal();
        } else if (e.key.toLowerCase() === 'l' && game && statusModal.classList.contains('hidden')) {
            openStatusModal();
        }
    });
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
    const crosshair = document.getElementById('crosshair');

    // デバッグパネルの要素
    const debugPanel = document.getElementById('debugPanel');
    const closeDebug = document.getElementById('closeDebug');
    const applyDebugSettings = document.getElementById('applyDebugSettings');
    const resetDebugSettings = document.getElementById('resetDebugSettings');
    const spawnBossNow = document.getElementById('spawnBossNow');

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
            playSE("open-husuma"); // ← ここで効果音を鳴らす


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
            playSE("close-husuma"); // ← ここで効果音を鳴らす
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

    // 照準カーソルの機能
    function updateCrosshair(e) {
        if (crosshair && !crosshair.classList.contains('hidden')) {
            // キャンバスの境界情報を取得
            const rect = gameCanvas.getBoundingClientRect();
            // キャンバス内の相対座標を計算
            const canvasX = e.clientX - rect.left;
            const canvasY = e.clientY - rect.top;

            // 照準の位置をキャンバス座標系で設定
            crosshair.style.left = (rect.left + canvasX) + 'px';
            crosshair.style.top = (rect.top + canvasY) + 'px';
        }
    }

    function showCrosshair() {
        if (crosshair) {
            crosshair.classList.remove('hidden');
            // ゲームキャンバスにマウス移動イベントを追加
            gameCanvas.addEventListener('mousemove', updateCrosshair);
            document.addEventListener('mousemove', updateCrosshair);
        }
    }

    function hideCrosshair() {
        if (crosshair) {
            crosshair.classList.add('hidden');
            // マウス移動イベントを削除
            gameCanvas.removeEventListener('mousemove', updateCrosshair);
            document.removeEventListener('mousemove', updateCrosshair);
        }
    }

    // ゲーム状態を監視して照準の表示/非表示を制御
    function monitorGameState() {
        if (!game || !game.gameState) return;
        
        // ゲームオーバー状態になったら照準を非表示
        if (game.gameState.isGameOver() && !crosshair.classList.contains('hidden')) {
            hideCrosshair();
        }
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
                                                                            // ステージ4の風神・雷神もプリロード
                                    preloadFuzinSpriteSheet(() => {
                                        preloadRaizinSpriteSheet(() => {
                                            // BossOni3のwarp_oni_v2もプリロード
                                            preloadWarpOniSpriteSheet(() => {
                                                assetsLoaded = true;
                                                startButton.disabled = false;
                                                startButton.textContent = 'ゲームスタート';
                                                loadingScreen.style.display = 'none';
                                            });
                                        });
                                    });
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
        playSE("kettei"); // ← 決定音

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
        playSE("kettei"); // ← 決定音
        console.log('現在のselectedBossType:', selectedBossType);

        // 既存のゲームインスタンスを破棄
        if (game) {
            console.log('既存のゲームインスタンスを破棄します');
            game.destroy();
            game = null;
        }

        gameCanvas.classList.remove('hidden');
        scoreDisplay.classList.remove('hidden');
        livesDisplay.classList.remove('hidden');
        timerDisplay.classList.remove('hidden'); // タイマー表示を維持
        minimapContainer.classList.remove('hidden'); // ミニマップ表示
        quickHelp.classList.remove('hidden'); // リスタート時も表示
        
        // 回復アイテムUIを表示
        const recoveryItemDisplay = document.getElementById('recoveryItemDisplay');
        if (recoveryItemDisplay) {
            recoveryItemDisplay.classList.remove('hidden');
        }
        
        showCrosshair(); // 照準を表示
        // 選択されたボスの種類を使用
        console.log('新しいゲームインスタンスを作成、選択されたボス:', selectedBossType);

        game = new Game(gameCanvas, gameCanvas.getContext('2d'), scoreDisplay, livesDisplay, gameOverMessage, restartButton, timerDisplay, selectedBossType,bgmManager);
        
        // ゲーム状態監視を開始
        const gameStateInterval = setInterval(() => {
            if (game) {
                monitorGameState();
            } else {
                clearInterval(gameStateInterval);
            }
        }, 100); // 100ms間隔で監視
    });

    // 操作説明表示
    helpButton.addEventListener('click', () => {
        playSE("kettei"); // ← 決定音
        helpModal.classList.remove('hidden');
    });
    // 操作説明閉じる
    closeHelp.addEventListener('click', () => {
        playSE("kasoruidou"); // ← 戻り音
        helpModal.classList.add('hidden');
    });

    // ボス選択画面からスタート画面へ戻る
    backToStartFromStageButton.addEventListener('click', () => {
        console.log('ボス選択画面から戻るボタンがクリックされました');
        playSE("kasoruidou"); // ← 戻り音

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
        
        // 回復アイテムUIを非表示
        const recoveryItemDisplay = document.getElementById('recoveryItemDisplay');
        if (recoveryItemDisplay) {
            recoveryItemDisplay.classList.add('hidden');
        }
        
        hideCrosshair(); // 照準を非表示

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

        // Pキーでポーズ切り替え時の照準制御
        if (e.key.toLowerCase() === 'p' && game) {
            setTimeout(() => {
                if (game.pauseManager.isPaused) {
                    hideCrosshair(); // ポーズ時は照準を非表示
                } else {
                    showCrosshair(); // ポーズ解除時は照準を表示
                }
            }, 50); // 少し遅延させてポーズ状態の変更を待つ
        }
    });

    // ポーズ画面のボタンイベントハンドラー
    resumeButton.addEventListener('click', () => {
        if (game) {
            game.togglePause();
            // ポーズ解除時に照準を再表示
            if (!game.pauseManager.isPaused) {
                showCrosshair();
            }
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
        
        // 回復アイテムUIを非表示
        const recoveryItemDisplay = document.getElementById('recoveryItemDisplay');
        if (recoveryItemDisplay) {
            recoveryItemDisplay.classList.add('hidden');
        }
        
        hideCrosshair(); // 照準を非表示

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
        const showBossCollision = document.getElementById('showBossCollision').checked;

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

        // 回復アイテム設定を適用
        const recoveryItemDropRate = parseInt(document.getElementById('recoveryItemDropRate').value);
        const recoveryItemHealRate = parseInt(document.getElementById('recoveryItemHealRate').value);

        // デバッグ情報を出力
        console.log('UI values from debug panel:', {
            showPlayerHitbox,
            showEnemyHitbox,
            showProjectileHitbox,
            showAttackRange,
            showBossCollision,
            showCollisionDebug,
            playerHitboxSize,
            recoveryItemDropRate,
            recoveryItemHealRate
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
            showBossCollision,
            highSpeedThreshold,
            maxSubframeSteps,
            enableLineIntersection,
            bossOni1ProjectileSpeed,
            bossOni1ProjectileDamage,
            showCollisionDebug,
            playerHitboxSize,
            recoveryItemDropRate,
            recoveryItemHealRate
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
        document.getElementById('showBossCollision').checked = false;
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

        // 回復アイテム設定をデフォルトにリセット
        document.getElementById('recoveryItemDropRate').value = 3;
        document.getElementById('recoveryItemHealRate').value = 30;
    });

    // ボス鬼をすぐ出現させるボタンのイベントハンドラー
    spawnBossNow.addEventListener('click', () => {
        if (!game) return;
        
        // ボスが既に出現している場合は何もしない
        if (game.bossAppeared) {
            console.log('ボスは既に出現しています');
            return;
        }
        
        console.log('ボス鬼をすぐ出現させます');
        
        // ボス出現処理を強制実行
        game.bossAppeared = true;
        game.bossCutInStartTime = Date.now();
        const cutInMsg = (game.selectedBossType === 4) ? '風神・雷神、参上！！' : 'ボス鬼出現！！';
        game.uiManager.showBossCutIn(cutInMsg);
        game.enemyManager.clearEnemies(); // 通常敵を一掃
        game.enemyManager.spawnBoss(game.selectedBossType);
        game.bossStartTime = Date.now();
        game.bossSpawnFrame = game.enemyManager.frame;
        game.bossSpawnComplete = false;
        
        // BGM切り替え
        if (game.bgmManager) {
            if (game.selectedBossType === 5) {
                game.bgmManager.play('lastbossBgm');
            } else {
                game.bgmManager.play('bossBgm');
            }
        }
        
        console.log('ボス鬼出現完了');
    });

    // F12キーでデバッグパネルを開く、Ctrl+Bでボス鬼をすぐ出現
    window.addEventListener('keydown', (e) => {
        if (e.key === 'F12') {
            e.preventDefault();
            if (game) {
                debugPanel.classList.remove('hidden');
            }
        }
        
        // Ctrl+Bでボス鬼をすぐ出現
        if (e.ctrlKey && e.key === 'b') {
            e.preventDefault();
            if (game && !game.bossAppeared) {
                console.log('Ctrl+B: ボス鬼をすぐ出現させます');
                
                // ボス出現処理を強制実行
                game.bossAppeared = true;
                game.bossCutInStartTime = Date.now();
                const cutInMsg = (game.selectedBossType === 4) ? '風神・雷神、参上！！' : 'ボス鬼出現！！';
                game.uiManager.showBossCutIn(cutInMsg);
                game.enemyManager.clearEnemies(); // 通常敵を一掃
                game.enemyManager.spawnBoss(game.selectedBossType);
                game.bossStartTime = Date.now();
                game.bossSpawnFrame = game.enemyManager.frame;
                game.bossSpawnComplete = false;
                
                // BGM切り替え
                if (game.bgmManager) {
                    if (game.selectedBossType === 5) {
                        game.bgmManager.play('lastbossBgm');
                    } else {
                        game.bgmManager.play('bossBgm');
                    }
                }
                
                console.log('Ctrl+B: ボス鬼出現完了');
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

    // ページ離脱時やウィンドウクローズ時にゲームを破棄
    window.addEventListener('beforeunload', () => {
        if (game) {
            console.log('ページ離脱によるゲーム破棄');
            game.destroy();
            game = null;
        }
    });

    // ページ非表示時にもゲームを破棄（モバイル対応）
    document.addEventListener('visibilitychange', () => {
        if (!game) return;
        if (document.hidden && !game.isPaused) {
            game.togglePause();
        }
        // ページが長時間非表示になった場合の処理
        if (document.hidden) {
            setTimeout(() => {
                if (document.hidden && game) {
                    console.log('ページ長時間非表示によるゲーム破棄');
                    game.destroy();
                    game = null;
                }
            }, 300000); // 5分後
        }
    });

    // ボスカード選択でゲーム開始
    const bossCards = document.querySelectorAll('.boss-card');
    bossCards.forEach(card => {
        card.addEventListener('click', () => {
            playSE("kettei"); // ← 決定音
            bossCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            // ボス種別取得
            const selectedBossType = parseInt(card.getAttribute('data-boss'), 10);

            // 既存のゲームインスタンスがあれば破棄
            if (game) {
                console.log('既存のゲームインスタンスを破棄します（ボス選択）');
                game.destroy();
                game = null;
            }

            // 障子風アニメーションでゲーム画面へ（開く方向）
            switchToScreenWithShojiOpen(stageSelectArea, null, () => {
                // ゲーム画面を表示
                gameCanvas.classList.remove('hidden');
                scoreDisplay.classList.remove('hidden');
                livesDisplay.classList.remove('hidden');
                timerDisplay.classList.remove('hidden');
                minimapContainer.classList.remove('hidden'); // ミニマップ表示
                quickHelp.classList.remove('hidden');
                
                // 回復アイテムUIを表示
                const recoveryItemDisplay = document.getElementById('recoveryItemDisplay');
                if (recoveryItemDisplay) {
                    recoveryItemDisplay.classList.remove('hidden');
                }
                
                showCrosshair(); // 照準を表示

                // 新しいゲームインスタンスを作成
                console.log('新しいゲームインスタンスを作成（ボス選択）、ボス:', selectedBossType);
                
                game = new Game(gameCanvas, gameCanvas.getContext('2d'), scoreDisplay, livesDisplay, gameOverMessage, restartButton, timerDisplay, selectedBossType,bgmManager);
                
                // ゲーム状態監視を開始
                const gameStateInterval = setInterval(() => {
                    if (game) {
                        monitorGameState();
                    } else {
                        clearInterval(gameStateInterval);
                    }
                }, 100); // 100ms間隔で監視
               
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
