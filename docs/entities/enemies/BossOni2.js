import { BossOni } from './BossOni.js';
import { SpriteSheet } from '../../utils/SpriteSheet.js';
import { playSE } from '../../managers/KoukaonManager.js'; // 追加
import { NoteProjectile } from '../NoteProjectile.js';

/**
 * BossOni2: バイクに乗って突進を繰り返すボス（強化改良版）
 * - 多様な攻撃パターン
 * - 改善されたAI
 * - 強化された視覚効果
 * - 難易度調整機能
 * - 特殊能力
 */
export class BossOni2 extends BossOni {
    constructor(game, x = null, y = null) {
        try {
            console.log('BossOni2: Constructor called');
            super(game, x, y);
            console.log('BossOni2: Super constructor completed');

            this.color = '#3498db'; // 青系
            this._baseMaxHP = 1400; // 基本最大HP
            this._maxHP = this._baseMaxHP * (game.oniHpMultiplier || 1);
            this._hp = this._maxHP;
            this.name = 'BossOni2';
            // 視覚的サイズを設定
            this.setSize(120, 120);
            // 円形当たり判定の半径を設定
            this.setCircularCollision(40);

            // 状態管理（拡張）
            this.state = 'idle'; // idle, charge, dashing, consecutive_charge, recover, special_attack, rage_mode
            this.stateTimer = 0;
            this.dashDirection = { x: 0, y: 0 };
            this.dashSpeed = 18; // 突進速度向上
            this.dashDuration = 45; // 突進フレーム数（0.6秒@60fps）
            this.chargeDuration = 45; // 溜めフレーム数短縮（0.4秒）
            this.recoverDuration = 30; // クールダウン短縮（0.33秒）
            this.idleDuration = 55; // 待機短縮（0.75秒）
            this.currentDashFrame = 0;
            this.spriteDirection = 'right'; // 'left' or 'right'

            // 攻撃判定用
            this.hasHitPlayerThisDash = false;
            this.comboCount = 0; // コンボカウント
            this.maxCombo = 3; // 最大コンボ数

            // 連続突進用
            this.consecutiveDashCount = 0; // 現在の連続突進回数
            this.maxConsecutiveDashes = 3; // 最大連続突進回数
            this.consecutiveDashDelay = 15; // 連続突進間の遅延フレーム数
            this.consecutiveDashTimer = 0; // 連続突進タイマー
            this.isConsecutiveDashing = false; // 連続突進中フラグ

            // 新機能: 特殊攻撃
            this.specialAttackCooldown = 0;
            this.specialAttackMaxCooldown = 180; // 3秒
            this.rageModeThreshold = 0.3; // HP30%以下で怒りモード
            this.isRageMode = false;
            this.specialAttackActive = false;
            this.specialAttackCount = 0;
            this.specialAttackMaxCount = 3;

            // 新機能: 音符攻撃
            this.noteAttackCooldown = 0;
            this.noteAttackMaxCooldown = 120; // 2秒
            this.noteAttackActive = false;
            this.noteAttackCount = 0;
            this.noteAttackMaxCount = 5; // 一度に5発の音符
            this.noteAttackPattern = 'spread'; // 'spread', 'circle', 'target'

            // 新機能: 予測移動
            this.predictionLevel = 0.7; // プレイヤーの移動を予測するレベル
            this.lastPlayerPos = { x: 0, y: 0 };
            this.playerVelocity = { x: 0, y: 0 };

            // 中心座標の計算用
            this._centerX = 0;
            this._centerY = 0;

            // アニメーション用
            this.spriteSheet = null;
            this.initializeAnimation();

            // 突進エフェクト用（強化）
            this.dashParticles = [];
            this.particleTimer = 0;
            this.trailEffect = []; // 軌跡エフェクト
            this.screenShake = 0; // 画面シェイク効果

            // 新機能: 難易度調整
            this.difficulty = this.game.difficulty || 'normal';
            this.knockbackStrength = 18; // デフォルトのノックバック強度
            this.adjustDifficulty();

            // 怒りモードの初期化
            this.rageModeActivated = false;

            console.log('BossOni2: Constructor completed');
        } catch (error) {
            console.error('BossOni2: Constructor error:', error);
            throw error;
        }
    }

    // 中心座標のgetter
    get centerX() {
        return this.x + this.width / 2;
    }

    get centerY() {
        return this.y + this.height / 2;
    }

    adjustDifficulty() {
        switch (this.difficulty) {
            case 'easy':
                this.dashSpeed = 14;
                this._baseMaxHP = 1200;
                this._maxHP = this._baseMaxHP * (this.game.oniHpMultiplier || 1);
                this._hp = this._maxHP;
                this.specialAttackMaxCooldown = 240;
                this.knockbackStrength = 15; // 弱いノックバック
                this.noteAttackMaxCooldown = 180; // 音符攻撃のクールダウン長め
                this.noteAttackMaxCount = 3; // 音符数少なめ
                this.maxConsecutiveDashes = 2; // 連続突進回数少なめ
                this.consecutiveDashDelay = 20; // 連続突進間の遅延長め
                break;
            case 'normal':
                this.dashSpeed = 18;
                this._baseMaxHP = 800;
                this._maxHP = this._baseMaxHP * (this.game.oniHpMultiplier || 1);
                this._hp = this._maxHP;
                this.specialAttackMaxCooldown = 180;
                this.knockbackStrength = 18; // 通常のノックバック
                this.noteAttackMaxCooldown = 120; // 音符攻撃のクールダウン通常
                this.noteAttackMaxCount = 5; // 音符数通常
                this.maxConsecutiveDashes = 3; // 連続突進回数通常
                this.consecutiveDashDelay = 15; // 連続突進間の遅延通常
                break;
            case 'hard':
                this.dashSpeed = 22;
                this._baseMaxHP = 1000;
                this._maxHP = this._baseMaxHP * (this.game.oniHpMultiplier || 1);
                this._hp = this._maxHP;
                this.specialAttackMaxCooldown = 120;
                this.predictionLevel = 0.9;
                this.knockbackStrength = 22; // 強いノックバック
                this.noteAttackMaxCooldown = 90; // 音符攻撃のクールダウン短め
                this.noteAttackMaxCount = 6; // 音符数多め
                this.maxConsecutiveDashes = 4; // 連続突進回数多め
                this.consecutiveDashDelay = 12; // 連続突進間の遅延短め
                break;
            case 'extreme':
                this.dashSpeed = 26;
                this._maxHP = 1200;
                this._hp = 1200;
                this.specialAttackMaxCooldown = 90;
                this.predictionLevel = 1.0;
                this.rageModeThreshold = 0.5; // HP50%以下で怒りモード
                this.knockbackStrength = 28; // 非常に強いノックバック
                this.noteAttackMaxCooldown = 60; // 音符攻撃のクールダウン非常に短い
                this.noteAttackMaxCount = 7; // 音符数非常に多い
                this.maxConsecutiveDashes = 5; // 連続突進回数非常に多い
                this.consecutiveDashDelay = 8; // 連続突進間の遅延非常に短い
                break;
        }
    }

    initializeAnimation() {
        // bike_oniのスプライトシートを直接読み込み
        console.log('BossOni2: Loading bike_oni sprite sheet...');

        fetch('assets/characters/oni/bike_oni/bike_oni.json')
            .then(res => {
                if (!res.ok) throw new Error('JSON not found');
                console.log('BossOni2: JSON loaded successfully');
                return res.json();
            })
            .then(data => {
                console.log('BossOni2: JSON data:', data);
                console.log('BossOni2: Frames array length:', data.frames.length);

                let retryCount = 0;
                const maxRetries = 10;

                function tryLoadImage() {
                    const img = new Image();
                    img.src = 'assets/characters/oni/bike_oni/bike_oni.png?' + new Date().getTime();
                    console.log('BossOni2: Trying to load image, attempt', retryCount + 1, 'src:', img.src);

                    img.onload = () => {
                        console.log('BossOni2: Image loaded successfully');
                        console.log('BossOni2: Image dimensions:', img.width, 'x', img.height);
                        this.spriteSheet = new SpriteSheet(img, data);
                        console.log('BossOni2: SpriteSheet created, frameNames:', this.spriteSheet.frameNames);
                        console.log('BossOni2: Available frames:', Object.keys(this.spriteSheet.frames));
                        this.spriteSheet.setFrameDelay(8); // デフォルトのアニメーション速度
                        this.spriteSheet.startAnimation();
                        console.log('BossOni2: SpriteSheet initialized');
                    };

                    img.onerror = () => {
                        console.log('BossOni2: Image load failed, attempt', retryCount + 1, 'src:', img.src);
                        retryCount++;
                        if (retryCount < maxRetries) {
                            setTimeout(() => tryLoadImage.call(this), 500);
                        } else {
                            console.log('BossOni2: Image load failed after', maxRetries, 'attempts');
                            this.spriteSheet = null;
                        }
                    };
                }

                tryLoadImage.call(this);
            })
            .catch(err => {
                console.log('BossOni2: JSON fetch failed:', err);
                this.spriteSheet = null;
            });
    }

    update() {
        // ゲームがポーズ中またはレベルアップ中は処理を停止
        if (this.game.pauseManager && this.game.pauseManager.isPaused) {
            return;
        }

        // 怒りモードチェック
        this.checkRageMode();

        // 特殊攻撃クールダウン更新
        if (this.specialAttackCooldown > 0) {
            this.specialAttackCooldown--;
        }

        // 音符攻撃クールダウン更新
        if (this.noteAttackCooldown > 0) {
            this.noteAttackCooldown--;
        }

        // デバッグ用: パーティクル状態をログ出力
        if (this.stateTimer % 60 === 0) { // 1秒ごとにログ出力
            console.log(`BossOni2 Debug - State: ${this.state}, Timer: ${this.stateTimer}, Particles: ${this.dashParticles.length}, Trail: ${this.trailEffect.length}, Rage: ${this.isRageMode}, Special: ${this.specialAttackActive}`);
        }

        // アニメーション更新
        if (this.spriteSheet) {
            this.spriteSheet.updateAnimation();

            // 状態に応じてアニメーション速度を調整
            switch (this.state) {
                case 'idle':
                    this.spriteSheet.setFrameDelay(this.isRageMode ? 8 : 12);
                    break;
                case 'charge':
                    this.spriteSheet.setFrameDelay(this.isRageMode ? 4 : 6);
                    break;
                case 'dashing':
                    this.spriteSheet.setFrameDelay(this.isRageMode ? 2 : 3);
                    break;
                case 'consecutive_charge':
                    this.spriteSheet.setFrameDelay(this.isRageMode ? 3 : 5);
                    break;
                case 'recover':
                    this.spriteSheet.setFrameDelay(this.isRageMode ? 6 : 10);
                    break;
                case 'special_attack':
                    this.spriteSheet.setFrameDelay(2);
                    break;
            }
        }

        // パーティクル更新
        this.updateParticles();
        this.updateTrailEffect();
        this.updateScreenShake();

        // 状態ごとの処理
        switch (this.state) {
            case 'idle':
                this.stateTimer++;
                this._dx = 0;
                this._dy = 0;

                // 特殊攻撃の実行判定
                if (this.specialAttackCooldown <= 0 && Math.random() < 0.3) {
                    this.state = 'special_attack';
                    this.stateTimer = 0;
                    this.executeSpecialAttack();
                } else if (this.noteAttackCooldown <= 0 && Math.random() < 0.4) {
                    // 音符攻撃の実行
                    this.executeNoteAttack();
                } else if (this.stateTimer > this.idleDuration) {
                    this.state = 'charge';
                    this.stateTimer = 0;
                }
                break;

            case 'charge':
                this.stateTimer++;
                // プレイヤー方向を向く（予測移動対応）
                this.updateDashDirection();

                // 突進開始前の事前エフェクト
                if (this.stateTimer === 1) {
                    this.createPreDashEffect();
                    playSE("baiku2"); // 突進準備開始時に効果音を鳴らす
                }

                if (this.stateTimer > this.chargeDuration) {
                    this.state = 'dashing';
                    this.stateTimer = 0;
                    this.currentDashFrame = 0;
                    this.comboCount++;
                    this.isConsecutiveDashing = true;
                    this.consecutiveDashCount = 1;
                    playSE("baiku1"); // ← 突進開始時に効果音を鳴らす
                }
                break;

            case 'dashing':
                this._dx = this.dashDirection.x * this.dashSpeed;
                this._dy = this.dashDirection.y * this.dashSpeed;
                this.x += this._dx;
                this.y += this._dy;
                this.currentDashFrame++;

                // 突進エフェクトを生成
                this.createDashParticles();
                this.createTrailEffect();

                // 攻撃判定
                this.checkDashAttack();

                // 突進終了判定
                if (this.currentDashFrame > this.dashDuration || this.isOutOfBounds()) {
                    this.handleDashEnd();
                }
                break;

            case 'consecutive_charge':
                this.stateTimer++;
                this._dx = 0;
                this._dy = 0;

                // 連続突進準備エフェクト
                if (this.stateTimer % 5 === 0) {
                    this.createConsecutiveChargeEffect();
                }

                if (this.stateTimer > this.consecutiveDashDelay) {
                    this.state = 'dashing';
                    this.stateTimer = 0;
                    this.currentDashFrame = 0;
                    playSE("baiku1"); // 連続突進開始時の効果音
                }
                break;

            case 'recover':
                this.stateTimer++;
                this._dx = 0;
                this._dy = 0;
                if (this.stateTimer > this.recoverDuration) {
                    this.state = 'idle';
                    this.stateTimer = 0;
                }
                break;

            case 'special_attack':
                this.stateTimer++;

                // 特殊攻撃の実行
                if (this.specialAttackActive && this.specialAttackCount < this.specialAttackMaxCount) {
                    if (this.stateTimer % 20 === 0) { // 20フレームごとに突進
                        this.executeQuickDash();
                        this.specialAttackCount++;
                        console.log(`BossOni2: Special dash ${this.specialAttackCount}/${this.specialAttackMaxCount}`);
                    }
                }

                if (this.stateTimer > 120) { // 2秒間の特殊攻撃
                    this.state = 'recover';
                    this.stateTimer = 0;
                    this.specialAttackCooldown = this.specialAttackMaxCooldown;
                    this.specialAttackActive = false;
                    this.specialAttackCount = 0;
                }
                break;
        }
    }

    checkRageMode() {
        const hpRatio = this._hp / this._maxHP;
        if (hpRatio <= this.rageModeThreshold && !this.isRageMode) {
            this.enterRageMode();
        }
    }

    enterRageMode() {
        if (this.rageModeActivated) return; // 既に怒りモードの場合は何もしない

        this.isRageMode = true;
        this.rageModeActivated = true;

        // 能力値強化
        this.dashSpeed *= 1.3;
        this.chargeDuration = Math.max(15, this.chargeDuration - 10);
        this.recoverDuration = Math.max(15, this.recoverDuration - 5);
        this.specialAttackMaxCooldown = Math.max(60, this.specialAttackMaxCooldown - 60);

        console.log('BossOni2: RAGE MODE ACTIVATED!');
        console.log(`BossOni2: New stats - Speed: ${this.dashSpeed}, Charge: ${this.chargeDuration}, Recover: ${this.recoverDuration}`);

        // 怒りモードエフェクト
        this.createRageEffect();
    }

    createRageEffect() {
        // 怒りモード時の視覚効果
        this.screenShake = 30;
        this.color = '#e74c3c'; // 赤色に変更

        console.log('BossOni2: RAGE MODE VISUAL EFFECTS ACTIVATED!');

        // パーティクル爆発
        for (let i = 0; i < 20; i++) {
            this.dashParticles.push({
                x: this.centerX + (Math.random() - 0.5) * 100,
                y: this.centerY + (Math.random() - 0.5) * 100,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 60,
                maxLife: 60,
                size: Math.random() * 15 + 10,
                alpha: 1.0,
                color: '#e74c3c'
            });
        }

        // 怒りモード時の色変更を確実に適用
        if (this.spriteSheet) {
            // スプライトシートの色調整（可能な場合）
            console.log('BossOni2: Applying rage mode color filter');
        }

        // 怒りモード時は音符攻撃も強化
        this.noteAttackMaxCount = 8; // 音符数を増加
        this.noteAttackMaxCooldown = Math.max(60, this.noteAttackMaxCooldown - 60); // クールダウン短縮

        // 怒りモード時は連続突進も強化
        this.maxConsecutiveDashes = 5; // 最大連続突進回数を増加
        this.consecutiveDashDelay = Math.max(8, this.consecutiveDashDelay - 7); // 連続突進間の遅延を短縮
    }

    executeSpecialAttack() {
        // 特殊攻撃: 連続突進
        console.log('BossOni2: Special Attack - Rapid Dash!');

        // プレイヤー周囲に複数回突進
        const player = this.game.player;
        if (player) {
            const dashCount = this.isRageMode ? 5 : 3;
            console.log(`BossOni2: Executing ${dashCount} rapid dashes!`);

            // 特殊攻撃中は一時的に状態を変更
            this.specialAttackActive = true;
            this.specialAttackCount = 0;
            this.specialAttackMaxCount = dashCount;
        }
    }

    executeQuickDash() {
        // 素早い突進
        console.log('BossOni2: Quick dash executed!');

        // 一時的に高速化
        const originalSpeed = this.dashSpeed;
        this.dashSpeed *= 1.5;

        // 短時間の突進
        setTimeout(() => {
            this.dashSpeed = originalSpeed;
        }, 300);

        // 突進エフェクトを生成
        this.createDashParticles();
        this.createTrailEffect();
    }

    handleDashEnd() {
        // 突進終了時の処理
        this._dx = 0;
        this._dy = 0;
        this.hasHitPlayerThisDash = false;

        if (this.isConsecutiveDashing && this.consecutiveDashCount < this.maxConsecutiveDashes) {
            // 連続突進の準備
            this.prepareNextDash();
        } else {
            // 連続突進終了
            this.finishConsecutiveDash();
        }
    }

    prepareNextDash() {
        // 次の突進の準備
        this.consecutiveDashCount++;
        this.state = 'consecutive_charge';
        this.stateTimer = 0;
        this.consecutiveDashTimer = 0;

        // 次の突進方向を更新
        this.updateDashDirection();

        console.log(`BossOni2: Preparing consecutive dash ${this.consecutiveDashCount}/${this.maxConsecutiveDashes}`);

        // 連続突進準備エフェクト
        this.createConsecutiveDashEffect();
    }

    finishConsecutiveDash() {
        // 連続突進終了
        this.isConsecutiveDashing = false;
        this.consecutiveDashCount = 0;
        this.state = 'recover';
        this.stateTimer = 0;

        // コンボ判定
        if (this.comboCount >= this.maxCombo) {
            this.comboCount = 0;
            this.stateTimer = -30; // 長めの回復時間
        }

        console.log('BossOni2: Consecutive dash finished');
    }

    executeNoteAttack() {
        // 音符攻撃の実行
        console.log('BossOni2: Note Attack - Musical Notes!');

        this.noteAttackActive = true;
        this.noteAttackCount = 0;
        this.noteAttackPattern = this.getRandomNotePattern();

        // 音符攻撃の音
        playSE('syoukan-syutugen');

        // 音符攻撃エフェクト
        this.createNoteAttackEffect();

        // 音符を発射
        this.fireNotes();

        // クールダウン設定
        this.noteAttackCooldown = this.noteAttackMaxCooldown;
    }

    getRandomNotePattern() {
        const patterns = ['spread', 'circle', 'target'];
        return patterns[Math.floor(Math.random() * patterns.length)];
    }

    fireNotes() {
        const player = this.game.player;
        if (!player) return;

        const noteCount = this.isRageMode ? this.noteAttackMaxCount : 5;
        const centerX = this.centerX;
        const centerY = this.centerY;

        switch (this.noteAttackPattern) {
            case 'spread':
                this.fireSpreadNotes(centerX, centerY, noteCount);
                break;
            case 'circle':
                this.fireCircleNotes(centerX, centerY, noteCount);
                break;
            case 'target':
                this.fireTargetNotes(centerX, centerY, noteCount, player);
                break;
        }
    }

    fireSpreadNotes(centerX, centerY, noteCount) {
        // 扇形に音符を発射
        const angleStep = (Math.PI * 2) / noteCount;
        const startAngle = -Math.PI / 2; // 上方向から開始

        for (let i = 0; i < noteCount; i++) {
            const angle = startAngle + angleStep * i;
            const direction = {
                x: Math.cos(angle),
                y: Math.sin(angle)
            };

            const note = new NoteProjectile(this.game, centerX, centerY, direction, 2);
            this.game.projectileManager.addProjectile(note);
        }
    }

    fireCircleNotes(centerX, centerY, noteCount) {
        // 円形に音符を発射
        const angleStep = (Math.PI * 2) / noteCount;

        for (let i = 0; i < noteCount; i++) {
            const angle = angleStep * i;
            const direction = {
                x: Math.cos(angle),
                y: Math.sin(angle)
            };

            const note = new NoteProjectile(this.game, centerX, centerY, direction, 1.5);
            this.game.projectileManager.addProjectile(note);
        }
    }

    fireTargetNotes(centerX, centerY, noteCount, player) {
        // プレイヤーを狙って音符を発射
        const dx = player.centerX - centerX;
        const dy = player.centerY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            const baseDirection = {
                x: dx / distance,
                y: dy / distance
            };

            for (let i = 0; i < noteCount; i++) {
                // 少しずつ角度をずらして発射
                const angleOffset = (i - (noteCount - 1) / 2) * 0.3;
                const direction = {
                    x: baseDirection.x * Math.cos(angleOffset) - baseDirection.y * Math.sin(angleOffset),
                    y: baseDirection.x * Math.sin(angleOffset) + baseDirection.y * Math.cos(angleOffset)
                };

                const note = new NoteProjectile(this.game, centerX, centerY, direction, 2.5);
                this.game.projectileManager.addProjectile(note);
            }
        }
    }

    createNoteAttackEffect() {
        // 音符攻撃開始時のエフェクト
        console.log('BossOni2: Creating note attack effect');

        // 音符攻撃開始パーティクル
        for (let i = 0; i < 15; i++) {
            this.dashParticles.push({
                x: this.centerX + (Math.random() - 0.5) * 80,
                y: this.centerY + (Math.random() - 0.5) * 80,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 45,
                maxLife: 45,
                size: Math.random() * 8 + 4,
                alpha: 1.0,
                color: '#8e44ad' // 音符の色
            });
        }

        // 画面シェイク効果
        this.screenShake = Math.max(this.screenShake, 8);
    }

    createPreDashEffect() {
        // 突進開始前の事前エフェクト
        console.log('BossOni2: Creating pre-dash effect');

        // 突進方向を示す矢印エフェクト
        const arrowLength = 80;
        const arrowX = this.centerX + this.dashDirection.x * arrowLength;
        const arrowY = this.centerY + this.dashDirection.y * arrowLength;

        // 1. 大きな警告サークル
        this.createWarningCircle();

        // 2. 矢印パーティクル（より目立つ）
        this.createArrowParticles(arrowLength);

        // 3. 突進経路のライン
        this.createDashPathLine(arrowLength);

        // 4. ボス鬼の周囲の警告エフェクト
        this.createBossWarningEffect();

        // 突進予告の音
        playSE('teki-syutugen');

        // 画面シェイク効果（強化）
        this.screenShake = Math.max(this.screenShake, 8);
    }

    createWarningCircle() {
        // 大きな警告サークルを生成
        for (let i = 0; i < 30; i++) {
            const angle = (i / 30) * Math.PI * 2;
            const radius = 50 + Math.sin(Date.now() * 0.01) * 10; // 脈動する半径

            this.dashParticles.push({
                x: this.centerX + Math.cos(angle) * radius,
                y: this.centerY + Math.sin(angle) * radius,
                vx: 0,
                vy: 0,
                life: 60,
                maxLife: 60,
                size: 4,
                alpha: 1.0,
                color: '#ff0000' // 真っ赤な警告色
            });
        }
    }

    createArrowParticles(arrowLength) {
        // 矢印パーティクル（より目立つ）
        for (let i = 0; i < 25; i++) {
            const progress = i / 25;
            const particleX = this.centerX + this.dashDirection.x * arrowLength * progress;
            const particleY = this.centerY + this.dashDirection.y * arrowLength * progress;

            // サイズを大きくして目立たせる
            const size = 8 + progress * 8; // 8から16までサイズが大きくなる

            this.dashParticles.push({
                x: particleX,
                y: particleY,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                life: 45 + progress * 45,
                maxLife: 45 + progress * 45,
                size: size,
                alpha: 1.0,
                color: '#ff0000' // 真っ赤な警告色
            });
        }

        // 矢印の先端を強調
        for (let i = 0; i < 8; i++) {
            this.dashParticles.push({
                x: this.centerX + this.dashDirection.x * arrowLength,
                y: this.centerY + this.dashDirection.y * arrowLength,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 60,
                maxLife: 60,
                size: 12,
                alpha: 1.0,
                color: '#ffff00' // 黄色で先端を強調
            });
        }
    }

    createDashPathLine(arrowLength) {
        // 突進経路のライン
        for (let i = 0; i < 40; i++) {
            const progress = i / 40;
            const particleX = this.centerX + this.dashDirection.x * arrowLength * progress;
            const particleY = this.centerY + this.dashDirection.y * arrowLength * progress;

            this.dashParticles.push({
                x: particleX,
                y: particleY,
                vx: 0,
                vy: 0,
                life: 90,
                maxLife: 90,
                size: 3,
                alpha: 0.8,
                color: '#ff4444' // 薄い赤色でラインを形成
            });
        }
    }

    createBossWarningEffect() {
        // ボス鬼の周囲の警告エフェクト
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const radius = 40;

            this.dashParticles.push({
                x: this.centerX + Math.cos(angle) * radius,
                y: this.centerY + Math.sin(angle) * radius,
                vx: Math.cos(angle) * 2,
                vy: Math.sin(angle) * 2,
                life: 40,
                maxLife: 40,
                size: 6,
                alpha: 1.0,
                color: '#ff6666' // 明るい赤色
            });
        }
    }

    createConsecutiveDashEffect() {
        // 連続突進準備時のエフェクト
        console.log('BossOni2: Creating consecutive dash effect');

        // 1. 連続突進を示す大きなサークル
        this.createConsecutiveWarningCircle();

        // 2. 連続突進を示すパーティクル
        for (let i = 0; i < 15; i++) {
            this.dashParticles.push({
                x: this.centerX + (Math.random() - 0.5) * 70,
                y: this.centerY + (Math.random() - 0.5) * 70,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 35,
                maxLife: 35,
                size: Math.random() * 6 + 4,
                alpha: 1.0,
                color: '#ff8800' // 明るいオレンジ色
            });
        }

        // 3. 連続突進カウンター表示
        this.createConsecutiveCounter();

        // 連続突進準備の音
        playSE('syoukan-syutugen');

        // 画面シェイク効果
        this.screenShake = Math.max(this.screenShake, 6);
    }

    createConsecutiveWarningCircle() {
        // 連続突進を示す大きなサークル
        for (let i = 0; i < 25; i++) {
            const angle = (i / 25) * Math.PI * 2;
            const radius = 60;

            this.dashParticles.push({
                x: this.centerX + Math.cos(angle) * radius,
                y: this.centerY + Math.sin(angle) * radius,
                vx: 0,
                vy: 0,
                life: 50,
                maxLife: 50,
                size: 5,
                alpha: 1.0,
                color: '#ff8800' // 明るいオレンジ色
            });
        }
    }

    createConsecutiveCounter() {
        // 連続突進カウンター表示
        const counterText = `${this.consecutiveDashCount}/${this.maxConsecutiveDashes}`;
        const counterSize = 8;

        // カウンターの背景
        for (let i = 0; i < 12; i++) {
            this.dashParticles.push({
                x: this.centerX + (Math.random() - 0.5) * 30,
                y: this.centerY + (Math.random() - 0.5) * 30,
                vx: 0,
                vy: 0,
                life: 60,
                maxLife: 60,
                size: counterSize,
                alpha: 0.9,
                color: '#000000' // 黒い背景
            });
        }

        // カウンターの数字（簡易的な表現）
        for (let i = 0; i < 8; i++) {
            this.dashParticles.push({
                x: this.centerX + (Math.random() - 0.5) * 20,
                y: this.centerY + (Math.random() - 0.5) * 20,
                vx: 0,
                vy: 0,
                life: 60,
                maxLife: 60,
                size: 6,
                alpha: 1.0,
                color: '#ffffff' // 白い数字
            });
        }
    }

    createConsecutiveChargeEffect() {
        // 連続突進準備中の継続エフェクト
        const intensity = this.consecutiveDashCount / this.maxConsecutiveDashes;

        // 1. 強度に応じたパーティクル生成
        for (let i = 0; i < 5; i++) {
            this.dashParticles.push({
                x: this.centerX + (Math.random() - 0.5) * 50,
                y: this.centerY + (Math.random() - 0.5) * 50,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: 25,
                maxLife: 25,
                size: Math.random() * 5 + 3,
                alpha: intensity,
                color: `hsl(${30 + intensity * 30}, 100%, 50%)` // オレンジから赤へのグラデーション
            });
        }

        // 2. 脈動する警告サークル
        if (this.stateTimer % 10 === 0) {
            this.createPulsingWarningCircle(intensity);
        }

        // 3. 方向指示エフェクト
        this.createDirectionIndicator(intensity);
    }

    createPulsingWarningCircle(intensity) {
        // 脈動する警告サークル
        const pulseRadius = 45 + Math.sin(Date.now() * 0.02) * 15;

        for (let i = 0; i < 15; i++) {
            const angle = (i / 15) * Math.PI * 2;

            this.dashParticles.push({
                x: this.centerX + Math.cos(angle) * pulseRadius,
                y: this.centerY + Math.sin(angle) * pulseRadius,
                vx: 0,
                vy: 0,
                life: 30,
                maxLife: 30,
                size: 4,
                alpha: intensity * 0.8,
                color: `hsl(${20 + intensity * 40}, 100%, 60%)` // オレンジから赤へのグラデーション
            });
        }
    }

    createDirectionIndicator(intensity) {
        // 方向指示エフェクト
        const indicatorLength = 40;
        const indicatorX = this.centerX + this.dashDirection.x * indicatorLength;
        const indicatorY = this.centerY + this.dashDirection.y * indicatorLength;

        // 方向を示すパーティクル
        for (let i = 0; i < 3; i++) {
            this.dashParticles.push({
                x: indicatorX + (Math.random() - 0.5) * 20,
                y: indicatorY + (Math.random() - 0.5) * 20,
                vx: 0,
                vy: 0,
                life: 20,
                maxLife: 20,
                size: 6,
                alpha: intensity,
                color: '#ffff00' // 黄色で方向を強調
            });
        }
    }

    updateDashDirection() {
        // プレイヤーの中心座標を取得
        const player = this.game.player;
        if (!player) return;

        // プレイヤーの移動を予測
        const currentPlayerPos = { x: player.centerX, y: player.centerY };
        this.playerVelocity.x = currentPlayerPos.x - this.lastPlayerPos.x;
        this.playerVelocity.y = currentPlayerPos.y - this.lastPlayerPos.y;

        // 予測位置を計算
        const predictedX = currentPlayerPos.x + this.playerVelocity.x * this.predictionLevel;
        const predictedY = currentPlayerPos.y + this.playerVelocity.y * this.predictionLevel;

        const dx = predictedX - this.centerX;
        const dy = predictedY - this.centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            this.dashDirection.x = dx / dist;
            this.dashDirection.y = dy / dist;
            this.spriteDirection = this.dashDirection.x < 0 ? 'left' : 'right';
        }

        this.lastPlayerPos = currentPlayerPos;
    }

    isOutOfBounds() {
        // 画面外に出たら突進終了
        const map = this.game.cameraManager.getMapDimensions();
        return (
            this.x < 0 ||
            this.y < 0 ||
            this.x + this.width > map.width ||
            this.y + this.height > map.height
        );
    }

    updateMovement() {
        // 通常移動は無効化（突進以外は動かない）
        // 突進中はupdateで直接座標を動かす
        this._dx = 0;
        this._dy = 0;

        // 他の敵との衝突を避ける（位置調整のみ）
        this.avoidCollisionWithOtherEnemies();
    }

    // 他の敵との衝突を避ける（位置調整のみ）
    avoidCollisionWithOtherEnemies() {
        const enemies = this.game.enemyManager.getEnemies();
        const minDistance = 300; // ボス2の半径150 * 2

        for (const enemy of enemies) {
            if (enemy === this) continue; // 自分は除外

            const dx = this.x - enemy.x;
            const dy = this.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < minDistance) {
                // 衝突を避けるために少し移動
                const angle = Math.atan2(dy, dx);
                const pushDistance = minDistance - distance + 20;
                this.x += Math.cos(angle) * pushDistance;
                this.y += Math.sin(angle) * pushDistance;

                // マップ境界内に収める
                const { width: mapW, height: mapH } = this.game.cameraManager.getMapDimensions();
                this.x = Math.max(150, Math.min(this.x, mapW - 150));
                this.y = Math.max(150, Math.min(this.y, mapH - 150));
            }
        }
    }

    draw(ctx, scrollX, scrollY) {
        // EnemyRendererを使用するため、独自の描画処理は無効化
        // パーティクルと軌跡エフェクトのみ描画
        this.drawParticles(ctx, scrollX, scrollY);
        this.drawTrailEffect(ctx, scrollX, scrollY);
    }

    checkDashAttack() {
        // 1回の突進で1度だけ攻撃
        if (this.hasHitPlayerThisDash) return;
        const player = this.game.player;
        if (!player || player.markedForDeletion) return;

        // 矩形衝突判定
        if (this.collidesWith(player)) {
            if (typeof player.takeDamage === 'function') {
                const damage = this.isRageMode ? 45 : 30; // 怒りモード時はダメージ増加
                player.takeDamage(damage);
            }
            this.hasHitPlayerThisDash = true;

            // ノックバック効果を適用
            this.applyKnockback(player);

            // ノックバックエフェクト
            this.createKnockbackEffect(player);

            // ヒットエフェクト
            this.createHitEffect();
        }
    }

    applyKnockback(player) {
        // ノックバックの方向と強度を計算
        let knockbackStrength = this.knockbackStrength;
        if (this.isRageMode) {
            knockbackStrength *= 1.4; // 怒りモード時は40%増加
        }

        // プレイヤーからバイクへの方向ベクトルを計算
        const dx = player.centerX - this.centerX;
        const dy = player.centerY - this.centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            // 正規化された方向ベクトル
            const normalizedDx = dx / distance;
            const normalizedDy = dy / distance;

            // ノックバック速度を設定
            const knockbackVx = normalizedDx * knockbackStrength;
            const knockbackVy = normalizedDy * knockbackStrength;

            console.log(`BossOni2: Applying knockback - Strength: ${knockbackStrength}, Direction: (${knockbackVx.toFixed(2)}, ${knockbackVy.toFixed(2)})`);

            // プレイヤーにノックバックを適用
            if (typeof player.applyKnockback === 'function') {
                player.applyKnockback(knockbackVx, knockbackVy);
            } else {
                // プレイヤーにノックバックメソッドがない場合は直接座標を変更
                this.applyDirectKnockback(player, knockbackVx, knockbackVy);
            }
        }
    }

    applyDirectKnockback(player, knockbackVx, knockbackVy) {
        // プレイヤーの現在位置を保存
        const originalX = player.x;
        const originalY = player.y;

        // ノックバック位置を計算
        const newX = player.x + knockbackVx;
        const newY = player.y + knockbackVy;

        // 画面内に収まるように調整
        const map = this.game.cameraManager.getMapDimensions();
        const clampedX = Math.max(0, Math.min(newX, map.width - player.width));
        const clampedY = Math.max(0, Math.min(newY, map.height - player.height));

        // プレイヤーの位置を更新
        player.x = clampedX;
        player.y = clampedY;

        // ノックバックアニメーション用の一時的な速度を設定
        if (typeof player.setVelocity === 'function') {
            player.setVelocity(knockbackVx * 0.5, knockbackVy * 0.5);
        }

        console.log(`BossOni2: Direct knockback applied - From: (${originalX}, ${originalY}) To: (${clampedX}, ${clampedY})`);
    }

    createKnockbackEffect(player) {
        // ノックバック時の視覚効果
        console.log('BossOni2: Creating knockback effect');

        // ノックバック方向を示すパーティクル
        const knockbackDirection = {
            x: player.centerX - this.centerX,
            y: player.centerY - this.centerY
        };
        const distance = Math.sqrt(knockbackDirection.x * knockbackDirection.x + knockbackDirection.y * knockbackDirection.y);

        if (distance > 0) {
            const normalizedDx = knockbackDirection.x / distance;
            const normalizedDy = knockbackDirection.y / distance;

            // ノックバック方向に沿ったパーティクルを生成
            for (let i = 0; i < 12; i++) {
                const offset = i * 8; // パーティクルを線状に配置
                const particleX = player.centerX + normalizedDx * offset;
                const particleY = player.centerY + normalizedDy * offset;

                this.dashParticles.push({
                    x: particleX,
                    y: particleY,
                    vx: normalizedDx * 3 + (Math.random() - 0.5) * 2,
                    vy: normalizedDy * 3 + (Math.random() - 0.5) * 2,
                    life: 40,
                    maxLife: 40,
                    size: Math.random() * 6 + 3,
                    alpha: 1.0,
                    color: '#ff6b6b' // ノックバック専用の色
                });
            }
        }

        // 画面シェイク効果を強化
        this.screenShake = Math.max(this.screenShake, 15);
    }

    createHitEffect() {
        // ヒット時のエフェクト
        this.screenShake = 10;

        // ヒットパーティクル
        for (let i = 0; i < 8; i++) {
            this.dashParticles.push({
                x: this.centerX + (Math.random() - 0.5) * 50,
                y: this.centerY + (Math.random() - 0.5) * 50,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 30,
                maxLife: 30,
                size: Math.random() * 6 + 3,
                alpha: 1.0,
                color: '#f39c12'
            });
        }
    }

    createDashParticles() {
        // 突進中にパーティクルを生成
        this.particleTimer++;
        if (this.particleTimer >= 2) { // 2フレームごとにパーティクル生成
            this.particleTimer = 0;

            // バイクの後ろにパーティクルを生成
            const particleX = this.x + (this.spriteDirection === 'left' ? this.width : 0);
            const particleY = this.y + this.height * 0.7; // バイクの後輪付近

            this.dashParticles.push({
                x: particleX,
                y: particleY,
                vx: (this.spriteDirection === 'left' ? 1 : -1) * (Math.random() * 3 + 2),
                vy: (Math.random() - 0.5) * 3,
                life: 25,
                maxLife: 25,
                size: Math.random() * 10 + 6,
                alpha: 0.9,
                color: this.isRageMode ? '#e74c3c' : '#95a5a6'
            });
        }

        // デバッグ用: 常にパーティクルを生成（テスト用）
        if (this.dashParticles.length === 0) {
            this.dashParticles.push({
                x: this.centerX + (Math.random() - 0.5) * 50,
                y: this.centerY + (Math.random() - 0.5) * 50,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                life: 60,
                maxLife: 60,
                size: Math.random() * 8 + 4,
                alpha: 1.0,
                color: '#ff0000'
            });
        }
    }

    createTrailEffect() {
        // 軌跡エフェクト
        if (this.state === 'dashing') {
            this.trailEffect.push({
                x: this.centerX,
                y: this.centerY,
                life: 20,
                maxLife: 20,
                alpha: 0.6
            });
        }
    }

    updateTrailEffect() {
        // 軌跡エフェクトを更新
        for (let i = this.trailEffect.length - 1; i >= 0; i--) {
            const trail = this.trailEffect[i];
            trail.life--;
            trail.alpha = (trail.life / trail.maxLife) * 0.6;

            if (trail.life <= 0) {
                this.trailEffect.splice(i, 1);
            }
        }
    }

    updateScreenShake() {
        if (this.screenShake > 0) {
            this.screenShake--;
        }
    }

    updateParticles() {
        // パーティクルを更新
        for (let i = this.dashParticles.length - 1; i >= 0; i--) {
            const particle = this.dashParticles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            particle.alpha = particle.life / particle.maxLife;

            if (particle.life <= 0) {
                this.dashParticles.splice(i, 1);
            }
        }
    }

    // サイズ変更メソッド（将来的な拡張用）
    changeSize(newWidth, newHeight) {
        this.setSize(newWidth, newHeight);
        console.log(`BossOni2: Size changed to ${newWidth}x${newHeight}`);
    }

    drawParticles(ctx, scrollX, scrollY) {
        // パーティクルを描画
        ctx.save();

        // デバッグ用: パーティクル数を表示
        if (this.dashParticles.length > 0) {
            console.log(`BossOni2: Drawing ${this.dashParticles.length} particles`);
        }

        for (const particle of this.dashParticles) {
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = particle.color || `rgba(100, 100, 100, ${particle.alpha})`;
            ctx.beginPath();
            ctx.arc(
                particle.x - scrollX,
                particle.y - scrollY,
                particle.size,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
        ctx.restore();
    }


    drawTrailEffect(ctx, scrollX, scrollY) {
        // 軌跡エフェクトを描画
        ctx.save();
        for (const trail of this.trailEffect) {
            ctx.globalAlpha = trail.alpha;
            ctx.fillStyle = `rgba(52, 152, 219, ${trail.alpha})`;
            ctx.beginPath();
            ctx.arc(
                trail.x - scrollX,
                trail.y - scrollY,
                15,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
        ctx.restore();
    }

    // 新機能: 難易度動的調整
    adjustDifficultyDynamically() {
        const player = this.game.player;
        if (player && typeof player.getScore === 'function') {
            const score = player.getScore();
            if (score > 10000 && this.difficulty === 'normal') {
                this.difficulty = 'hard';
                this.adjustDifficulty();
            } else if (score > 20000 && this.difficulty === 'hard') {
                this.difficulty = 'extreme';
                this.adjustDifficulty();
            }
        }
    }

    // 新機能: パフォーマンス統計
    getPerformanceStats() {
        return {
            difficulty: this.difficulty,
            isRageMode: this.isRageMode,
            comboCount: this.comboCount,
            specialAttackCooldown: this.specialAttackCooldown,
            predictionLevel: this.predictionLevel,
            noteAttackCooldown: this.noteAttackCooldown,
            noteAttackPattern: this.noteAttackPattern,
            consecutiveDashCount: this.consecutiveDashCount,
            maxConsecutiveDashes: this.maxConsecutiveDashes,
            isConsecutiveDashing: this.isConsecutiveDashing
        };
    }
}
