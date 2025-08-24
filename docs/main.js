import { Game } from './core/Game.js';
import { preloadMomotaroSpriteSheet } from './components/PlayerRenderer.js';
import { preloadRedOniSpriteSheet, preloadEnemySpriteSheet, preloadCannonOniSpriteSheet, preloadBossOni2SpriteSheet, preloadFuzinSpriteSheet, preloadRaizinSpriteSheet, preloadWarpOniSpriteSheet } from './components/EnemyRenderer.js';
import { BgmManager } from './managers/BgmManager.js';
import { playSE } from './managers/KoukaonManager.js';
import { BossProgressManager } from './managers/BossProgressManager.js';
import { HelpManager } from './help/index.js';
import { VolumeManager } from './managers/VolumeManager.js';

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
    const loadingScreen = document.getElementById('loading-screen');
    const stageSelect = document.getElementById('stageSelect');
    const stageSelectArea = document.getElementById('stageSelectArea');
    const minimapContainer = document.getElementById('minimapContainer');
    const crosshair = document.getElementById('crosshair');

    
    // ゲーム中操作ボタンの要素
    const gameControlButtons = document.getElementById('gameControlButtons');
    const levelUpButton = document.getElementById('levelUpButton');
    const pauseButton = document.getElementById('pauseButton');
    
    // ゲーム中基本操作説明の要素
    const gameBasicControls = document.getElementById('gameBasicControls');
    
    // お供切り替えUIの要素
    const otomoSwitchUI = document.getElementById('otomoSwitchUI');
    
    // お供切り替えUIの状態管理
    let currentOtomoMode = 1; // デフォルトはフォロー（モード1）
    
    // お供切り替えUIの状態を更新する関数
    function updateOtomoSwitchUI(mode) {
        currentOtomoMode = mode;
        
        // すべてのモードアイテムからactiveクラスを削除
        const modeItems = otomoSwitchUI.querySelectorAll('.otomo-mode-item');
        modeItems.forEach(item => item.classList.remove('active'));
        
        // 現在のモードに対応するアイテムにactiveクラスを追加
        const currentItem = otomoSwitchUI.querySelector(`[data-mode="${mode}"]`);
        if (currentItem) {
            currentItem.classList.add('active');
        }
    }
    
    // キーボードでお供切り替え
    window.addEventListener('keydown', (e) => {
        if (game && !game.pauseManager.isPaused) {
            const key = e.key;
            if (key === '1' || key === '2' || key === '3') {
                const mode = parseInt(key);
                if (mode >= 1 && mode <= 3) {
                    // お供切り替え処理（実際のゲームロジックと連携）
                    console.log(`お供モード切り替え: ${mode}`);
                    updateOtomoSwitchUI(mode);
                    
                    // 効果音再生
                    playSE("kettei");
                }
            }
        }
    });


    // デバッグパネルの要素
    const debugPanel = document.getElementById('debugPanel');
    const closeDebug = document.getElementById('closeDebug');
    const applyDebugSettings = document.getElementById('applyDebugSettings');
    const resetDebugSettings = document.getElementById('resetDebugSettings');
    const spawnBossNow = document.getElementById('spawnBossNow');
    const resetBossProgress = document.getElementById('resetBossProgress');
    const unlockAllBosses = document.getElementById('unlockAllBosses');
    const bossProgressStatus = document.getElementById('bossProgressStatus');

    // ポーズ画面の要素
    const pauseMessage = document.getElementById('pauseMessage');
    const resumeButton = document.getElementById('resumeButton');
    const pauseHelpButton = document.getElementById('pauseHelpButton');
    const pauseVolumeButton = document.getElementById('pauseVolumeButton');
    const pauseBackToStartButton = document.getElementById('pauseBackToStartButton');

    // BGMマネージャーの初期化（最初のユーザー操作後に再生開始）
    const bgmManager = new BgmManager();
    window.bgmManager = bgmManager;
    bgmManager.play('mainBgm'); // ユーザー操作後まで保留される

    // ボス進捗マネージャーの初期化
    const bossProgressManager = new BossProgressManager();

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

    // ゲーム内UIを一括で非表示にするヘルパー
    function hideInGameUI() {
        // キャンバス/左下系
        gameCanvas.classList.add('hidden');
        scoreDisplay.classList.add('hidden');
        livesDisplay.classList.add('hidden');
        timerDisplay.classList.add('hidden');
        minimapContainer.classList.add('hidden');
        gameOverMessage.classList.add('hidden');

        // 右側UI
        const gameControlButtons = document.getElementById('gameControlButtons');
        if (gameControlButtons) gameControlButtons.classList.add('hidden');
        const gameBasicControls = document.getElementById('gameBasicControls');
        if (gameBasicControls) gameBasicControls.classList.add('hidden');
        const otomoSwitchUI = document.getElementById('otomoSwitchUI');
        if (otomoSwitchUI) otomoSwitchUI.classList.add('hidden');
        const pauseButtonEl = document.getElementById('pauseButton');
        if (pauseButtonEl) pauseButtonEl.classList.add('hidden');

        // 桃太郎Lv/回復カウンター
        const otomoLevelDisplay = document.getElementById('otomoLevelDisplay');
        if (otomoLevelDisplay) otomoLevelDisplay.classList.add('hidden');
        const recoveryItemDisplay = document.getElementById('recoveryItemDisplay');
        if (recoveryItemDisplay) recoveryItemDisplay.classList.add('hidden');

        // 照準
        hideCrosshair();
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
    
    // ボスカードの進捗状況を更新する関数
    function updateBossCardProgress() {
        bossCardElements.forEach((card) => {
            const bossId = parseInt(card.dataset.boss, 10);
            const bossData = bossProgressManager.getAllBossData()[bossId];
            
            if (bossData) {
                const defeatedElement = card.querySelector('.boss-progress.defeated');
                const lockedElement = card.querySelector('.boss-progress.locked');
                const unlockedElement = card.querySelector('.boss-progress.unlocked');
                const bossImage = card.querySelector('.boss-select-btn');
                
                // 既存の進捗表示を非表示
                [defeatedElement, lockedElement, unlockedElement].forEach(el => {
                    if (el) el.classList.add('hidden');
                });
                
                // ボスの画像を状態に応じて更新
                if (bossImage) {
                    const displayImage = bossProgressManager.getBossDisplayImage(bossId);
                    if (displayImage) {
                        bossImage.src = `assets/UI/UI/boss_select/${displayImage}`;
                    }
                }
                
                if (bossData.defeated) {
                    // 討伐済み（選択可能）
                    if (defeatedElement) defeatedElement.classList.remove('hidden');
                    card.style.opacity = '1';
                    card.style.cursor = 'pointer';
                } else if (bossData.unlocked) {
                    // アンロック済み
                    if (unlockedElement) unlockedElement.classList.remove('hidden');
                    card.style.opacity = '1';
                    card.style.cursor = 'pointer';
                } else {
                    // 未開放
                    if (lockedElement) lockedElement.classList.remove('hidden');
                    card.style.opacity = '0.5';
                    card.style.cursor = 'not-allowed';
                }
            }
        });
    }
    
    // 初期表示時に進捗状況を更新
    updateBossCardProgress();
    
    // 初期表示時にボス画像を更新
    bossCardElements.forEach((card) => {
        const bossId = parseInt(card.dataset.boss, 10);
        const bossImage = card.querySelector('.boss-select-btn');
        if (bossImage) {
            const displayImage = bossProgressManager.getBossDisplayImage(bossId);
            if (displayImage) {
                bossImage.src = `assets/UI/UI/boss_select/${displayImage}`;
            }
        }
    });
    
    // ボス進捗更新イベントをリッスン
    window.addEventListener('bossProgressUpdated', () => {
        updateBossCardProgress();
        
        // ボス画像も更新
        bossCardElements.forEach((card) => {
            const bossId = parseInt(card.dataset.boss, 10);
            const bossImage = card.querySelector('.boss-select-btn');
            if (bossImage) {
                const displayImage = bossProgressManager.getBossDisplayImage(bossId);
                if (displayImage) {
                    bossImage.src = `assets/UI/UI/boss_select/${displayImage}`;
                }
            }
        });
    });
    
    bossCardElements.forEach((card, index) => {
        console.log(`ボスカード${index + 1}:`, card.dataset.boss);
        card.addEventListener('click', () => {
            const bossId = parseInt(card.dataset.boss, 10);
            const bossData = bossProgressManager.getAllBossData()[bossId];
            
            // 未開放のボスは選択できない（討伐済みでも選択可能）
            if (!bossData || !bossData.unlocked) {
                console.log('このボスは選択できません:', bossId);
                return;
            }
            
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

        // 初回ログイン時のチュートリアル表示チェック
        const isFirstTime = !localStorage.getItem('kibidan_tutorial_completed');
        
        if (isFirstTime) {
            console.log('初回ログインです。操作説明を表示します。');
            // 初回ログイン時は操作説明を表示
            helpManager.show();
            // 操作説明が閉じられた後にボス選択画面へ進む
            // 操作説明の閉じるイベントを監視
            const checkHelpClosed = setInterval(() => {
                if (helpManager.elements.modal.classList.contains('hidden')) {
                    clearInterval(checkHelpClosed);
                    // 操作説明が閉じられたらボス選択画面へ
                    switchToScreenWithShojiOpen(startScreen, stageSelectArea, () => {
                        console.log('障子アニメーション完了');
                        // ボス選択画面が確実に表示されるようにする
                        stageSelectArea.style.display = 'flex';
                        stageSelectArea.style.opacity = '1';
                        stageSelectArea.style.transform = 'translateX(0)';
                    });
                }
            }, 100);
        } else {
            // 通常の流れ：直接ボス選択画面へ
            switchToScreenWithShojiOpen(startScreen, stageSelectArea, () => {
                console.log('障子アニメーション完了');
                // ボス選択画面が確実に表示されるようにする
                stageSelectArea.style.display = 'flex';
                stageSelectArea.style.opacity = '1';
                stageSelectArea.style.transform = 'translateX(0)';
            });
        }
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

        // ゲーム中UIを表示
        gameCanvas.classList.remove('hidden');
        scoreDisplay.classList.remove('hidden');
        livesDisplay.classList.remove('hidden');
        timerDisplay.classList.remove('hidden');
        minimapContainer.classList.remove('hidden');
        gameControlButtons.classList.remove('hidden');
        gameBasicControls.classList.remove('hidden');
        otomoSwitchUI.classList.remove('hidden');
        pauseButton.classList.remove('hidden');
        
        // お供切り替えUIの初期状態を設定
        updateOtomoSwitchUI(1);
        
        // 桃太郎レベル表示を表示
        const otomoLevelDisplay = document.getElementById('otomoLevelDisplay');
        if (otomoLevelDisplay) {
            otomoLevelDisplay.classList.remove('hidden');
        }
        
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

    // 操作説明マネージャーの初期化
    const helpManager = new HelpManager();
    
    // デバッグ用：ローカルストレージのチュートリアル状態をリセット
    // コンソールから resetTutorialStatus() を呼び出してリセット可能
    window.resetTutorialStatus = () => {
        localStorage.removeItem('kibidan_tutorial_completed');
        console.log('チュートリアル状態をリセットしました。次回の開始ボタンクリック時に操作説明が表示されます。');
    };
    
    // 操作説明表示
    helpButton.addEventListener('click', () => {
        playSE("kettei"); // ← 決定音
        helpManager.show();
    });
    

    // 音量調節マネージャーの初期化
    const volumeManager = new VolumeManager();

    // 音量調整画面表示
    pauseVolumeButton.addEventListener('click', () => {
        const volumeModal = document.getElementById('volumeModal');
        if (volumeModal) {
            volumeModal.classList.remove('hidden');

    // ゲーム中操作ボタンのイベントハンドリング
    levelUpButton.addEventListener('click', () => {
        if (game && !game.pauseManager.isPaused) {
            playSE("kettei"); // ← 決定音
            openStatusModal();
        }
    });
    
    pauseButton.addEventListener('click', () => {
        if (game) {
            playSE("kettei"); // ← 決定音
            game.togglePause();
            // ポーズ切り替え時の照準制御
            setTimeout(() => {
                if (game.pauseManager.isPaused) {
                    hideCrosshair(); // ポーズ時は照準を非表示
                } else {
                    showCrosshair(); // ポーズ解除時は照準を表示
                }
            }, 50);

        }
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
        // ゲーム中UIを非表示（ゲームオーバーからの戻りも含む）
        hideInGameUI();

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
                helpManager.show();
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
        playSE("kettei"); // 決定音を追加
        helpManager.show();
    });

    pauseVolumeButton.addEventListener('click', () => {
        const volumeModal = document.getElementById('volumeModal');
        playSE("kettei"); // 決定音を追加
        if (volumeModal) {
            volumeModal.classList.remove('hidden');
        }
    });

    pauseBackToStartButton.addEventListener('click', () => {
        // ゲーム中UIを非表示（帰還ボタンからの戻りも含む）
        hideInGameUI();
        
        // ゲームのポーズ状態を確実に解除（右側UIが再表示されないように）
        if (game && game.pauseManager) {
            game.pauseManager.isPaused = false;
        }
        
        // ポーズ画面を非表示（右側UIは再表示しない）
        const pauseMessage = document.getElementById('pauseMessage');
        if (pauseMessage) {
            pauseMessage.classList.add('hidden');
        }

        // 障子風アニメーションでスタート画面へ（閉じる方向）
        switchToScreenWithShojiClose(null, startScreen, () => {
            if (game) {
                // ゲームのポーズ状態を解除（右側UIが再表示されないように）
                if (game.pauseManager && game.pauseManager.isPaused) {
                    game.pauseManager.isPaused = false;
                }
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

    // ボス進捗状況を表示する関数
    function updateBossProgressStatus() {
        if (bossProgressStatus) {
            const bossData = bossProgressManager.getAllBossData();
            const defeatedCount = bossProgressManager.getDefeatedBossCount();
            const unlockedCount = bossProgressManager.getUnlockedBossCount();
            const otomoStatus = bossProgressManager.getOtomoUnlockStatus();
            
            let statusHTML = `<div>討伐済み: ${defeatedCount}/5</div>`;
            statusHTML += `<div>アンロック済み: ${unlockedCount}/5</div>`;
            statusHTML += `<div>ラスボス解放条件:</div>`;
            statusHTML += `<div>・鋼鉄鬼: ${bossData[1]?.defeated ? '✓' : '✗'}</div>`;
            statusHTML += `<div>・暴走鬼: ${bossData[2]?.defeated ? '✓' : '✗'}</div>`;
            statusHTML += `<div>・妖術鬼: ${bossData[3]?.defeated ? '✓' : '✗'}</div>`;
            statusHTML += `<div>・風神・雷神: ${bossData[4]?.defeated ? '✓' : '✗'}</div>`;
            statusHTML += `<div>ラスボス: ${bossData[5]?.unlocked ? '✓ アンロック済み' : '✗ 未解放'}</div>`;
            statusHTML += `<div>お供開放状況:</div>`;
            statusHTML += `<div>・犬: ${otomoStatus.dog ? '✓' : '✗'}</div>`;
            statusHTML += `<div>・猿: ${otomoStatus.monkey ? '✓' : '✗'}</div>`;
            statusHTML += `<div>・雉: ${otomoStatus.bird ? '✓' : '✗'}</div>`;
            
            bossProgressStatus.innerHTML = statusHTML;
        }
    }

    // ボス進捗管理のデバッグ機能
    if (resetBossProgress) {
        resetBossProgress.addEventListener('click', () => {
            if (confirm('全ボスの進捗をリセットしますか？')) {
                bossProgressManager.resetBossProgress();
                updateBossCardProgress();
                updateBossProgressStatus();
                console.log('全ボス進捗をリセットしました');
            }
        });
    }

    // 個別ボスの進捗リセット機能
    const resetBoss1 = document.getElementById('resetBoss1');
    const resetBoss2 = document.getElementById('resetBoss2');
    const resetBoss3 = document.getElementById('resetBoss3');
    const resetBoss4 = document.getElementById('resetBoss4');

    if (resetBoss1) {
        resetBoss1.addEventListener('click', () => {
            if (confirm('砲鬼の進捗をリセットしますか？')) {
                bossProgressManager.resetBossProgressById(1);
                updateBossCardProgress();
                updateBossProgressStatus();
                console.log('砲鬼の進捗をリセットしました');
            }
        });
    }

    if (resetBoss2) {
        resetBoss2.addEventListener('click', () => {
            if (confirm('バイク鬼の進捗をリセットしますか？')) {
                bossProgressManager.resetBossProgressById(2);
                updateBossCardProgress();
                updateBossProgressStatus();
                console.log('バイク鬼の進捗をリセットしました');
            }
        });
    }

    if (resetBoss3) {
        resetBoss3.addEventListener('click', () => {
            if (confirm('ワープ鬼の進捗をリセットしますか？')) {
                bossProgressManager.resetBossProgressById(3);
                updateBossCardProgress();
                updateBossProgressStatus();
                console.log('ワープ鬼の進捗をリセットしました');
            }
        });
    }

    if (resetBoss4) {
        resetBoss4.addEventListener('click', () => {
            if (confirm('風神・雷神の進捗をリセットしますか？')) {
                bossProgressManager.resetBossProgressById(4);
                updateBossCardProgress();
                updateBossProgressStatus();
                console.log('風神・雷神の進捗をリセットしました');
            }
        });
    }

    if (unlockAllBosses) {
        unlockAllBosses.addEventListener('click', () => {
            if (confirm('全ボスをアンロックしますか？')) {
                for (let i = 1; i <= 5; i++) {
                    bossProgressManager.forceUnlockBoss(i);
                }
                // ラストステージ（ボスID 7）もアンロック
                bossProgressManager.forceUnlockBoss(7);
                updateBossCardProgress();
                updateBossProgressStatus();
                updateBossToggleButtons();
                console.log('全ボスをアンロックしました');
            }
        });
    }

    // 個別ボスの討伐状況切り替え機能
    const toggleBoss1 = document.getElementById('toggleBoss1');
    const toggleBoss2 = document.getElementById('toggleBoss2');
    const toggleBoss3 = document.getElementById('toggleBoss3');
    const toggleBoss4 = document.getElementById('toggleBoss4');
    const toggleBoss5 = document.getElementById('toggleBoss5');
    const toggleBoss7 = document.getElementById('toggleBoss7');

    // ボス討伐状況切り替えボタンの初期化
    function updateBossToggleButtons() {
        const bosses = [
            { id: 1, button: toggleBoss1, name: '砲鬼' },
            { id: 2, button: toggleBoss2, name: 'バイク鬼' },
            { id: 3, button: toggleBoss3, name: 'ワープ鬼' },
            { id: 4, button: toggleBoss4, name: '風神・雷神' },
            { id: 5, button: toggleBoss5, name: 'ラスボス' },
            { id: 7, button: toggleBoss7, name: 'ラストステージ' }
        ];

        bosses.forEach(boss => {
            if (boss.button) {
                const bossData = bossProgressManager.getAllBossData()[boss.id];
                if (bossData) {
                    if (bossData.defeated) {
                        boss.button.textContent = '討伐済み';
                        boss.button.className = 'debug-btn boss-toggle-btn defeated';
                    } else if (bossData.unlocked) {
                        boss.button.textContent = '未討伐';
                        boss.button.className = 'debug-btn boss-toggle-btn unlocked';
                    } else {
                        boss.button.textContent = '未開放';
                        boss.button.className = 'debug-btn boss-toggle-btn';
                    }
                }
            }
        });
    }

    // ボス討伐状況切り替えボタンのイベントリスナー
    if (toggleBoss1) {
        toggleBoss1.addEventListener('click', () => {
            const bossData = bossProgressManager.getAllBossData()[1];
            if (bossData.defeated) {
                bossProgressManager.resetBossProgressById(1);
            } else {
                bossProgressManager.forceDefeatBoss(1);
            }
            updateBossCardProgress();
            updateBossProgressStatus();
            updateBossToggleButtons();
        });
    }

    if (toggleBoss2) {
        toggleBoss2.addEventListener('click', () => {
            const bossData = bossProgressManager.getAllBossData()[2];
            if (bossData.defeated) {
                bossProgressManager.resetBossProgressById(2);
            } else {
                bossProgressManager.forceDefeatBoss(2);
            }
            updateBossCardProgress();
            updateBossProgressStatus();
            updateBossToggleButtons();
        });
    }

    if (toggleBoss3) {
        toggleBoss3.addEventListener('click', () => {
            const bossData = bossProgressManager.getAllBossData()[3];
            if (bossData.defeated) {
                bossProgressManager.resetBossProgressById(3);
            } else {
                bossProgressManager.forceDefeatBoss(3);
            }
            updateBossCardProgress();
            updateBossProgressStatus();
            updateBossToggleButtons();
        });
    }

    if (toggleBoss4) {
        toggleBoss4.addEventListener('click', () => {
            const bossData = bossProgressManager.getAllBossData()[4];
            if (bossData.defeated) {
                bossProgressManager.resetBossProgressById(4);
            } else {
                bossProgressManager.forceDefeatBoss(4);
            }
            updateBossCardProgress();
            updateBossProgressStatus();
            updateBossToggleButtons();
        });
    }

    if (toggleBoss5) {
        toggleBoss5.addEventListener('click', () => {
            const bossData = bossProgressManager.getAllBossData()[5];
            if (bossData.defeated) {
                bossProgressManager.resetBossProgressById(5);
            } else {
                bossProgressManager.forceDefeatBoss(5);
            }
            updateBossCardProgress();
            updateBossProgressStatus();
            updateBossToggleButtons();
        });
    }

    if (toggleBoss7) {
        toggleBoss7.addEventListener('click', () => {
            const bossData = bossProgressManager.getAllBossData()[7];
            if (bossData.defeated) {
                bossProgressManager.resetBossProgressById(7);
            } else {
                bossProgressManager.forceDefeatBoss(7);
            }
            updateBossCardProgress();
            updateBossProgressStatus();
            updateBossToggleButtons();
        });
    }

    // 初期表示時にボス進捗状況を更新
    updateBossProgressStatus();
    updateBossToggleButtons();

    // ボスカード選択でゲーム開始
    const bossCards = document.querySelectorAll('.boss-card');
    bossCards.forEach(card => {
        card.addEventListener('click', () => {
            const bossId = parseInt(card.dataset.boss, 10);
            const bossData = bossProgressManager.getAllBossData()[bossId];
            
            // 未開放のボスは選択できない（討伐済みでも選択可能）
            if (!bossData || !bossData.unlocked) {
                console.log('このボスは選択できません:', bossId);
                return;
            }
            
            playSE("kettei"); // ← 決定音
            bossCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            // ボス種別取得
            selectedBossType = parseInt(card.getAttribute('data-boss'), 10);
            console.log('ボス選択: ボスID', selectedBossType, 'が選択されました');

            // 既存のゲームインスタンスがあれば破棄
            if (game) {
                console.log('既存のゲームインスタンスを破棄します（ボス選択）');
                game.destroy();
                game = null;
            }

            // 障子風アニメーションでゲーム画面へ（開く方向）
            switchToScreenWithShojiOpen(stageSelectArea, null, () => {
                // ゲーム中UIを表示
                gameCanvas.classList.remove('hidden');
                scoreDisplay.classList.remove('hidden');
                livesDisplay.classList.remove('hidden');
                timerDisplay.classList.remove('hidden');
                minimapContainer.classList.remove('hidden');
                gameControlButtons.classList.remove('hidden');
                gameBasicControls.classList.remove('hidden');
                otomoSwitchUI.classList.remove('hidden');
                pauseButton.classList.remove('hidden');
                
                // お供切り替えUIの初期状態を設定
                updateOtomoSwitchUI(1);
                
                // 桃太郎レベル表示を表示
                const otomoLevelDisplay = document.getElementById('otomoLevelDisplay');
                if (otomoLevelDisplay) {
                    otomoLevelDisplay.classList.remove('hidden');
                }
                
                // 回復アイテムUIを表示
                const recoveryItemDisplay = document.getElementById('recoveryItemDisplay');
                if (recoveryItemDisplay) {
                    recoveryItemDisplay.classList.remove('hidden');
                }
                
                showCrosshair(); // 照準を表示

                // 新しいゲームインスタンスを作成
                console.log('新しいゲームインスタンスを作成（ボス選択）、ボス:', selectedBossType);
                console.log('グローバルselectedBossType:', window.selectedBossType || 'undefined');
                
                game = new Game(gameCanvas, gameCanvas.getContext('2d'), scoreDisplay, livesDisplay, gameOverMessage, restartButton, timerDisplay, selectedBossType, bgmManager);
                console.log('ゲームインスタンス作成完了。選択されたボス:', selectedBossType);
                
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
