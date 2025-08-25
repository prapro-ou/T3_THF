import { BossOni } from './BossOni.js';
import { RedOni } from './RedOni.js'; // 例: 雑魚鬼
import { playSE } from '../../managers/KoukaonManager.js'; // 効果音をインポート
import { SpriteSheet } from '../../utils/SpriteSheet.js';
import { OfudaProjectile } from '../OfudaProjectile.js';

export class BossOni3 extends BossOni {

    constructor(game, x = null, y = null) {
        try {
            console.log('BossOni3: Constructor called');
            super(game, x, y);
            console.log('BossOni3: Super constructor completed');

            this.color = '#9b59b6'; // 紫系（ワープのイメージ）
            this._baseMaxHP = 2500; // 基本最大HP
            this._maxHP = this._baseMaxHP * (game.oniHpMultiplier || 1);
            this._hp = this._maxHP;
            this.name = 'BossOni3';

            // warp_oni画像のサイズに合わせて調整
            this.setSize(150, 150); // 視覚的サイズ
            this.setCircularCollision(75); // 当たり判定半径

            // スプライト画像の設定
            this.spriteSheet = null;
            this.animationInitialized = false;
            this.initializeAnimation();

            // 雑魚召喚の管理
            this.summonTimer = 0;
            this.summonInterval = 300; // 5秒ごとに召喚（60fps想定）
            this.summonPatterns = ['single', 'double', 'triangle', 'circle', 'cross', 'spiral', 'wall', 'bomb'];
            this.currentSummonPattern = 'single';
            this.summonCooldown = 0;
            this.summonCooldownMax = 90; // 1.5秒間のクールダウン（短縮）
            this.summonWarningTimer = 0;
            this.summonWarningDuration = 45; // 0.75秒間の予告（短縮）

            // お札攻撃の管理
            this.ofudaAttackCooldown = 0;
            this.ofudaAttackMaxCooldown = 180; // 3秒ごと（60fps想定）
            this.ofudaAttackActive = false;
            this.ofudaAttackCount = 0;
            this.ofudaAttackMaxCount = 3; // 1回の攻撃で3枚のお札
            this.ofudaAttackPattern = 'spread'; // 'spread', 'circle', 'target', 'spiral'
            this.ofudaEffects = ['slow', 'poison'];

            // 体力段階による行動変化の管理
            this.rageMode = false; // 激怒モード
            this.berserkMode = false; // 狂戦士モード
            this.healthThresholds = {
                rage: 0.5, // 体力50%以下で激怒モード
                berserk: 0.2  // 体力20%以下で狂戦士モード
            };
            this.baseSpeed = this.speed; // 基本速度を保存

            // ワープ状態の管理
            this.isWarping = false; // ワープ中フラグ
            this.warpCooldown = 0; // ワープ後のクールダウン
            this.warpCooldownMax = 60; // 1秒間（60fps想定）
            this.preWarpDelay = 0; // ワープ前の遅延
            this.preWarpDelayMax = 180; // 3秒間（60fps想定）

            // アニメーション方向管理
            this.currentDirection = 'front'; // 'front', 'back', 'left', 'right'
            this.lastDirection = 'front';
            this.directionChangeThreshold = 0.1; // 方向変更の閾値

            console.log('BossOni3: Constructor completed successfully');
        } catch (error) {
            console.error('BossOni3 constructor error:', error);
        }
    }

    initializeAnimation() {
        // warp_oni_v2のスプライトシートを読み込み
        console.log('BossOni3: Loading warp_oni_v2 sprite sheet...');

        fetch('assets/characters/oni/warp_oni/warp_oni_v2.json')
            .then(res => {
                if (!res.ok) throw new Error('JSON not found');
                console.log('BossOni3: JSON loaded successfully');
                return res.json();
            })
            .then(data => {
                console.log('BossOni3: JSON data:', data);
                console.log('BossOni3: Frames array length:', data.frames.length);

                let retryCount = 0;
                const maxRetries = 10;

                function tryLoadImage() {
                    const img = new Image();
                    img.src = 'assets/characters/oni/warp_oni/warp_oni_v2.png?' + new Date().getTime();
                    console.log('BossOni3: Trying to load image, attempt', retryCount + 1, 'src:', img.src);

                    img.onload = () => {
                        console.log('BossOni3: Image loaded successfully');
                        console.log('BossOni3: Image dimensions:', img.width, 'x', img.height);
                        this.spriteSheet = new SpriteSheet(img, data);
                        console.log('BossOni3: SpriteSheet created, frameNames:', this.spriteSheet.frameNames);
                        console.log('BossOni3: Available frames:', this.spriteSheet.frameNames);
                        console.log('BossOni3: Frames data:', this.spriteSheet.frames);
                        this.spriteSheet.setFrameDelay(12); // アニメーション速度
                        this.spriteSheet.startAnimation();
                        this.animationInitialized = true;
                        console.log('BossOni3: SpriteSheet initialized successfully');
                    };

                    img.onerror = () => {
                        console.log('BossOni3: Image load failed, attempt', retryCount + 1, 'src:', img.src);
                        retryCount++;
                        if (retryCount < maxRetries) {
                            setTimeout(() => tryLoadImage.call(this), 500);
                        } else {
                            console.log('BossOni3: Image load failed after', maxRetries, 'attempts');
                            this.spriteSheet = null;
                        }
                    };
                }

                tryLoadImage.call(this);
            })
            .catch(err => {
                console.log('BossOni3: JSON fetch failed:', err);
                this.spriteSheet = null;
            });
    }

    update() {
        super.update();

        // 体力段階に応じた行動変化のチェック
        this.checkHealthPhase();

        // ワープ状態の更新
        this.updateWarpState();

        // アニメーション更新
        if (this.spriteSheet) {
            this.spriteSheet.updateAnimation();
        }

        // ワープ中でない場合のみ通常の行動を実行
        if (!this.isWarping && this.warpCooldown <= 0 && this.preWarpDelay <= 0) {
            // 召喚システムの更新
            this.updateSummonSystem();
            
            // お札攻撃タイマー更新
            this.ofudaAttackCooldown++;
            if (this.ofudaAttackCooldown >= this.ofudaAttackMaxCooldown) {
                this.executeOfudaAttack();
                this.ofudaAttackCooldown = 0;
            }
        }
    }

    updateMovement() {
        // ワープ中、ワープ前の遅延中、ワープ後のクールダウン中は移動しない
        if (this.isWarping || this.preWarpDelay > 0 || this.warpCooldown > 0) {
            this._dx = 0;
            this._dy = 0;
            return;
        }

        if (this.isEdgeWarping) {
            this._dx = 0;
            this._dy = 0;
            return;
        }

        // 移動前に他の敵との衝突をチェック
        this.avoidCollisionWithOtherEnemies();

        const player = this.game.player;
        if (!player) return;

        // プレイヤーから逃げる方向を計算
        const dx = (this.x + this.width / 2) - (player.x + player.width / 2);
        const dy = (this.y + this.height / 2) - (player.y + player.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            const speed = 2; // 逃げる速度
            this._dx = (dx / dist) * speed;
            this._dy = (dy / dist) * speed;
        } else {
            this._dx = 0;
            this._dy = 0;
        }

        // 方向に応じたアニメーション制御
        this.updateDirectionAnimation();

        // 移動実行
        this.x += this._dx;
        this.y += this._dy;

        // マップ端の判定
        const { width: mapWidth, height: mapHeight } = this.game.cameraManager.getMapDimensions();
        const atEdge =
            this.x <= 0 || this.x >= mapWidth - this.width ||
            this.y <= 0 || this.y >= mapHeight - this.height;

        // 端に到達したらワープ開始（遅延付き）
        if (atEdge) {
            this.warpToRandomPosition();
            console.log("BossOni3 reached edge and starting warp delay!");
            return;
        }
    }
    
    // 他の敵との衝突を避ける
    avoidCollisionWithOtherEnemies() {
        const enemies = this.game.enemyManager.getEnemies();
        const minDistance = 160; // ボスの半径80 * 2
        
        for (const enemy of enemies) {
            if (enemy === this) continue; // 自分は除外
            
            const dx = this.x - enemy.x;
            const dy = this.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance) {
                // 衝突を避けるために少し移動
                const angle = Math.atan2(dy, dx);
                const pushDistance = minDistance - distance + 10;
                this.x += Math.cos(angle) * pushDistance;
                this.y += Math.sin(angle) * pushDistance;
                
                // マップ境界内に収める
                const { width: mapW, height: mapH } = this.game.cameraManager.getMapDimensions();
                this.x = Math.max(80, Math.min(this.x, mapW - 80));
                this.y = Math.max(80, Math.min(this.y, mapH - 80));
            }
        }
    }

    updateDirectionAnimation() {
        // 移動方向に基づいてアニメーション方向を決定
        if (Math.abs(this._dx) > this.directionChangeThreshold || Math.abs(this._dy) > this.directionChangeThreshold) {
            // 移動している場合
            if (Math.abs(this._dy) > Math.abs(this._dx)) {
                // 縦方向の移動が優勢
                if (this._dy > 0) {
                    this.currentDirection = 'front'; // 下に移動（プレイヤーから見て前）
                } else {
                    this.currentDirection = 'back'; // 上に移動（プレイヤーから見て後）
                }
            } else {
                // 横方向の移動が優勢
                if (this._dx > 0) {
                    this.currentDirection = 'right'; // 右に移動
                } else {
                    this.currentDirection = 'left'; // 左に移動
                }
            }
        }

        // 方向が変更された場合、アニメーションフレームを設定
        if (this.currentDirection !== this.lastDirection) {
            this.updateAnimationFrame();
            this.lastDirection = this.currentDirection;
        }
    }

    updateAnimationFrame() {
        if (!this.spriteSheet) return;

        // 方向に応じたフレーム名を設定
        let frameName = 'warp_oni_front';
        switch (this.currentDirection) {
            case 'front':
                frameName = 'warp_oni_front';
                break;
            case 'back':
                frameName = 'warp_oni_back';
                break;
            case 'left':
                frameName = 'warp_oni_left';
                break;
            case 'right':
                frameName = 'warp_oni_right';
                break;
        }

        // フレームが存在する場合のみ設定
        if (this.spriteSheet.frameNames.includes(frameName)) {
            console.log(`BossOni3: Animation direction changed to ${this.currentDirection}`);
        }
    }

    // 召喚システムの更新
    updateSummonSystem() {
        // 召喚クールダウンの更新
        if (this.summonCooldown > 0) {
            this.summonCooldown--;
            return;
        }
        
        // 召喚予告タイマーの更新
        if (this.summonWarningTimer > 0) {
            this.summonWarningTimer--;
            
            // 予告中は定期的にエフェクトを表示
            if (this.summonWarningTimer % 15 === 0) {
                this.createSummonWarningEffect();
            }
            
            // 予告終了時に召喚実行
            if (this.summonWarningTimer <= 0) {
                this.executeSummon();
            }
            return;
        }
        
        // 召喚タイマーの更新
        this.summonTimer++;
        if (this.summonTimer >= this.summonInterval) {
            this.summonTimer = 0;
            this.startSummonSequence();
        }
    }

    // 召喚シーケンスの開始
    startSummonSequence() {
        // 召喚パターンを選択
        this.selectSummonPattern();
        
        // 召喚予告を開始
        this.summonWarningTimer = this.summonWarningDuration;
        this.createSummonWarningEffect();
        
        console.log(`BossOni3: Starting summon sequence with pattern: ${this.currentSummonPattern}`);
    }

    // 召喚パターンの選択
    selectSummonPattern() {
        // 体力に応じてパターンを選択
        const healthRatio = this.hp / this.maxHP;
        
        if (healthRatio <= 0.2) {
            // 体力20%以下：最強パターン + 召喚頻度大幅アップ
            this.currentSummonPattern = this.getRandomPattern(['spiral', 'wall', 'bomb', 'circle']);
            this.summonInterval = Math.floor(this.summonInterval * 0.4); // 60%短縮
        } else if (healthRatio <= 0.4) {
            // 体力40%以下：強力なパターン + 召喚頻度アップ
            this.currentSummonPattern = this.getRandomPattern(['circle', 'cross', 'triangle', 'spiral']);
            this.summonInterval = Math.floor(this.summonInterval * 0.5); // 50%短縮
        } else if (healthRatio <= 0.7) {
            // 体力70%以下：中程度のパターン + 召喚頻度アップ
            this.currentSummonPattern = this.getRandomPattern(['double', 'triangle', 'single', 'cross']);
            this.summonInterval = Math.floor(this.summonInterval * 0.7); // 30%短縮
        } else {
            // 体力70%以上：基本的なパターン
            this.currentSummonPattern = this.getRandomPattern(['single', 'double', 'triangle']);
            this.summonInterval = 300; // 基本間隔
        }
    }

    // ランダムパターン選択
    getRandomPattern(patterns) {
        return patterns[Math.floor(Math.random() * patterns.length)];
    }

    // 召喚予告エフェクト
    createSummonWarningEffect() {
        // 召喚陣の予告エフェクト
        for (let i = 0; i < 20; i++) { // 16→20に増加
            const angle = (Math.PI * 2 * i) / 20;
            const distance = 40 + Math.random() * 20;
            const x = this.centerX + Math.cos(angle) * distance;
            const y = this.centerY + Math.sin(angle) * distance;
            
            this.game.particleManager.createParticle(
                x, y,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                '#FFD700', // 金色
                45,
                0.8
            );
        }
        
        // 中心の光
        this.game.particleManager.createParticle(
            this.centerX, this.centerY,
            0, 0,
            '#FFD700',
            60,
            1.0
        );
        
        // パターンに応じた追加エフェクト
        if (this.currentSummonPattern === 'spiral' || this.currentSummonPattern === 'wall' || this.currentSummonPattern === 'bomb') {
            // 最強パターン用の赤い警告エフェクト
            for (let i = 0; i < 12; i++) {
                const angle = (Math.PI * 2 * i) / 12;
                const distance = 60 + Math.random() * 30;
                const x = this.centerX + Math.cos(angle) * distance;
                const y = this.centerY + Math.sin(angle) * distance;
                
                this.game.particleManager.createParticle(
                    x, y,
                    (Math.random() - 0.5) * 3,
                    (Math.random() - 0.5) * 3,
                    '#FF4500', // オレンジレッド
                    60,
                    0.9
                );
            }
        }
    }

    // 召喚実行
    executeSummon() {
        switch (this.currentSummonPattern) {
            case 'single':
                this.summonSingleMinion();
                break;
            case 'double':
                this.summonDoubleMinions();
                break;
            case 'triangle':
                this.summonTriangleMinions();
                break;
            case 'circle':
                this.summonCircleMinions();
                break;
            case 'cross':
                this.summonCrossMinions();
                break;
            case 'spiral':
                this.summonSpiralMinions();
                break;
            case 'wall':
                this.summonWallMinions();
                break;
            case 'bomb':
                this.summonBombMinions();
                break;
        }
        
        // 召喚クールダウンを設定
        this.summonCooldown = this.summonCooldownMax;
        
        // 効果音
        playSE("syoukan-syutugen");
    }

    // 単体召喚（序盤強化）
    summonSingleMinion() {
        // 序盤は複数体召喚
        const numMinions = this.healthRatio > 0.8 ? 3 : 1;
        
        for (let i = 0; i < numMinions; i++) {
            const minion = new RedOni(this.game, 'red', 15, true); // ボスが召喚した赤鬼
            const offsetX = (Math.random() - 0.5) * 120; // 60→120に拡大
            const offsetY = (Math.random() - 0.5) * 120; // 60→120に拡大
            
            minion.x = this.x + this.width / 2 - minion.width / 2 + offsetX;
            minion.y = this.y + this.height / 2 - minion.height / 2 + offsetY;
            
            this.game.enemyManager.enemies.push(minion);
        }
        console.log(`BossOni3 summoned ${numMinions} minions (single pattern)`);
    }

    // 二体召喚（序盤強化）
    summonDoubleMinions() {
        // 序盤は4体、中盤は3体、終盤は2体
        const numMinions = this.healthRatio > 0.8 ? 4 : this.healthRatio > 0.5 ? 3 : 2;
        
        for (let i = 0; i < numMinions; i++) {
            const minion = new RedOni(this.game, 'red', 12, true); // ボスが召喚した赤鬼
            const angle = (Math.PI * 2 * i) / numMinions;
            const distance = 80; // 40→80に拡大
            
            minion.x = this.x + this.width / 2 - minion.width / 2 + Math.cos(angle) * distance;
            minion.y = this.y + this.height / 2 - minion.height / 2 + Math.sin(angle) * distance;
            
            this.game.enemyManager.enemies.push(minion);
        }
        console.log(`BossOni3 summoned ${numMinions} minions (double pattern)`);
    }

    // 三角形召喚（序盤強化）
    summonTriangleMinions() {
        // 序盤は5体、中盤は4体、終盤は3体
        const numMinions = this.healthRatio > 0.8 ? 5 : this.healthRatio > 0.5 ? 4 : 3;
        
        for (let i = 0; i < numMinions; i++) {
            const minion = new RedOni(this.game, 'red', 10, true); // ボスが召喚した赤鬼
            const angle = (Math.PI * 2 * i) / numMinions;
            const distance = 90; // 45→90に拡大
            
            minion.x = this.x + this.width / 2 - minion.width / 2 + Math.cos(angle) * distance;
            minion.y = this.y + this.height / 2 - minion.height / 2 + Math.sin(angle) * distance;
            
            this.game.enemyManager.enemies.push(minion);
        }
        console.log(`BossOni3 summoned ${numMinions} minions (triangle pattern)`);
    }

    // 円形召喚（序盤強化）
    summonCircleMinions() {
        // 序盤は10体、中盤は8体、終盤は6体
        const numMinions = this.healthRatio > 0.8 ? 10 : this.healthRatio > 0.5 ? 8 : 6;
        
        for (let i = 0; i < numMinions; i++) {
            const angle = (Math.PI * 2 * i) / numMinions;
            const baseDistance = 100; // 60→100に拡大
            const distance = baseDistance + (Math.random() - 0.5) * 40; // 20→40に拡大
            
            const minion = new RedOni(this.game, 'red', 6, true); // ボスが召喚した赤鬼、HP: 8→6に強化
            
            // プレイヤーの位置を考慮して配置
            const player = this.game.player;
            if (player) {
                const playerAngle = Math.atan2(player.centerY - this.centerY, player.centerX - this.centerX);
                const adjustedAngle = angle + playerAngle + Math.PI; // プレイヤーの反対側
                
                minion.x = this.x + this.width / 2 - minion.width / 2 + Math.cos(adjustedAngle) * distance;
                minion.y = this.y + this.height / 2 - minion.height / 2 + Math.sin(adjustedAngle) * distance;
            } else {
                minion.x = this.x + this.width / 2 - minion.width / 2 + Math.cos(angle) * distance;
                minion.y = this.y + this.height / 2 - minion.height / 2 + Math.sin(angle) * distance;
            }
            
            this.game.enemyManager.enemies.push(minion);
        }
        console.log(`BossOni3 summoned ${numMinions} minions (circle pattern)`);
    }

    // 十字形召喚
    summonCrossMinions() {
        const positions = [
            { x: 0, y: -60 },   // 上
            { x: 0, y: 60 },    // 下
            { x: -60, y: 0 },   // 左
            { x: 60, y: 0 }     // 右
        ];
        
        // プレイヤーの位置を考慮して配置
        const player = this.game.player;
        let offsetX = 0;
        let offsetY = 0;
        
        if (player) {
            const dx = player.centerX - this.centerX;
            const dy = player.centerY - this.centerY;
            
            // プレイヤーから離れた位置に配置
            if (Math.abs(dx) > Math.abs(dy)) {
                offsetY = dx > 0 ? -80 : 80;
            } else {
                offsetX = dy > 0 ? -80 : 80;
            }
        }
        
        // 序盤は6体、中盤は5体、終盤は4体
        const numMinions = this.healthRatio > 0.8 ? 6 : this.healthRatio > 0.5 ? 5 : 4;
        
        for (let i = 0; i < numMinions; i++) {
            const minion = new RedOni(this.game, 'red', 6, true); // ボスが召喚した赤鬼
            const angle = (Math.PI * 2 * i) / numMinions;
            const distance = 100 + (Math.random() - 0.5) * 40; // 60→100、20→40に拡大
            
            // プレイヤーの位置を考慮して配置
            if (player) {
                const playerAngle = Math.atan2(player.centerY - this.centerY, player.centerX - this.centerX);
                const adjustedAngle = angle + playerAngle + Math.PI; // プレイヤーの反対側
                
                minion.x = this.x + this.width / 2 - minion.width / 2 + Math.cos(adjustedAngle) * distance + offsetX;
                minion.y = this.y + this.height / 2 - minion.height / 2 + Math.sin(adjustedAngle) * distance + offsetY;
            } else {
                minion.x = this.x + this.width / 2 - minion.width / 2 + Math.cos(angle) * distance + offsetX;
                minion.y = this.y + this.height / 2 - minion.height / 2 + Math.sin(angle) * distance + offsetY;
            }
            
            this.game.enemyManager.enemies.push(minion);
        }
        console.log(`BossOni3 summoned ${numMinions} minions (cross pattern)`);
    }

    // 螺旋形召喚（最強パターン）
    summonSpiralMinions() {
        // 序盤は10体、中盤は8体、終盤は6体
        const numMinions = this.healthRatio > 0.8 ? 10 : this.healthRatio > 0.5 ? 8 : 6;
        
        for (let i = 0; i < numMinions; i++) {
            const angle = (Math.PI * 2 * i) / numMinions;
            const baseDistance = 80; // 40→80に拡大
            const distance = baseDistance + (i * 25); // 15→25に拡大
            const minion = new RedOni(this.game, 'red', 5, true); // ボスが召喚した赤鬼
            
            // プレイヤーの位置を考慮して反対側に配置
            const player = this.game.player;
            if (player) {
                const playerAngle = Math.atan2(player.centerY - this.centerY, player.centerX - this.centerX);
                const adjustedAngle = angle + playerAngle + Math.PI; // プレイヤーの反対側
                
                minion.x = this.x + this.width / 2 - minion.width / 2 + Math.cos(adjustedAngle) * distance;
                minion.y = this.y + this.height / 2 - minion.height / 2 + Math.sin(adjustedAngle) * distance;
            } else {
                minion.x = this.x + this.width / 2 - minion.width / 2 + Math.cos(angle) * distance;
                minion.y = this.y + this.height / 2 - minion.height / 2 + Math.sin(angle) * distance;
            }
            
            this.game.enemyManager.enemies.push(minion);
        }
        console.log(`BossOni3 summoned ${numMinions} minions (spiral pattern)`);
    }

    // 壁形召喚（最強パターン）
    summonWallMinions() {
        // 序盤は7体、中盤は6体、終盤は5体
        const wallLength = this.healthRatio > 0.8 ? 7 : this.healthRatio > 0.5 ? 6 : 5;
        const spacing = 60; // 35→60に拡大
        
        // プレイヤーの位置を考慮
        const player = this.game.player;
        let offsetX = 0;
        let offsetY = 0;
        
        if (player) {
            // プレイヤーから離れた位置に壁を配置
            const dx = player.centerX - this.centerX;
            const dy = player.centerY - this.centerY;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                // 横方向の移動が多い場合、縦の壁を強化
                offsetY = dx > 0 ? -100 : 100; // 60→100に拡大
            } else {
                // 縦方向の移動が多い場合、横の壁を強化
                offsetX = dy > 0 ? -100 : 100; // 60→100に拡大
            }
        }
        
        // 横の壁（より分散）
        for (let i = 0; i < wallLength; i++) {
            const minion = new RedOni(this.game, 'red', 4, true); // ボスが召喚した赤鬼
            minion.x = this.x + this.width / 2 - minion.width / 2 + (i - Math.floor(wallLength/2)) * spacing + offsetX;
            minion.y = this.y + this.height / 2 - minion.height / 2 - 80 + (Math.random() - 0.5) * 30; // 50→80、20→30に拡大
            
            this.game.enemyManager.enemies.push(minion);
        }
        
        // 縦の壁（より分散）
        for (let i = 0; i < wallLength; i++) {
            const minion = new RedOni(this.game, 'red', 4, true); // ボスが召喚した赤鬼
            minion.x = this.x + this.width / 2 - minion.width / 2 - 80 + (Math.random() - 0.5) * 30; // 50→80、20→30に拡大
            minion.y = this.y + this.height / 2 - minion.height / 2 + (i - Math.floor(wallLength/2)) * spacing + offsetY;
            
            this.game.enemyManager.enemies.push(minion);
        }
        console.log(`BossOni3 summoned ${wallLength * 2} minions (wall pattern)`);
    }

    // 爆弾形召喚（最強パターン）
    summonBombMinions() {
        // 序盤は15体、中盤は12体、終盤は9体
        const numMinions = this.healthRatio > 0.8 ? 15 : this.healthRatio > 0.5 ? 12 : 9;
        const baseDistance = 30;
        
        for (let i = 0; i < numMinions; i++) {
            const angle = (Math.PI * 2 * i) / numMinions;
            const distance = baseDistance + Math.random() * 80; // 40→80に拡大
            const minion = new RedOni(this.game, 'red', 3, true); // ボスが召喚した赤鬼
            
            // プレイヤーの位置を考慮して分散配置
            const player = this.game.player;
            if (player) {
                const playerAngle = Math.atan2(player.centerY - this.centerY, player.centerX - this.centerX);
                const adjustedAngle = angle + playerAngle + (Math.random() - 0.5) * Math.PI / 2; // ランダムな角度調整
                
                minion.x = this.x + this.width / 2 - minion.width / 2 + Math.cos(adjustedAngle) * distance;
                minion.y = this.y + this.height / 2 - minion.height / 2 + Math.sin(adjustedAngle) * distance;
            } else {
                minion.x = this.x + this.width / 2 - minion.width / 2 + Math.cos(angle) * distance;
                minion.y = this.y + this.height / 2 - minion.height / 2 + Math.sin(angle) * distance;
            }

        this.game.enemyManager.enemies.push(minion);
        }
        console.log(`BossOni3 summoned ${numMinions} minions (bomb pattern)`);
    }

    // ワープ実行（遅延後の実際のワープ処理）
    executeWarp() {
        const { width: mapWidth, height: mapHeight } = this.game.cameraManager.getMapDimensions();
        let newX, newY;
        
        // マップの中心部に近い位置を優先的に選択
        const centerX = mapWidth / 2;
        const centerY = mapHeight / 2;
        const safeMargin = 150; // 端からの安全マージン
        
        do {
            // マップの中心部を基準に、ランダムな位置を生成
            // 中心から最大でマップサイズの1/3の範囲内に制限
            const maxDistance = Math.min(mapWidth, mapHeight) / 3;
            const distance = Math.random() * maxDistance;
            const angle = Math.random() * Math.PI * 2;
            
            newX = centerX + Math.cos(angle) * distance;
            newY = centerY + Math.sin(angle) * distance;
            
            // マップの境界内に収める
            newX = Math.max(safeMargin, Math.min(mapWidth - this.width - safeMargin, newX));
            newY = Math.max(safeMargin, Math.min(mapHeight - this.height - safeMargin, newY));
            
        } while (
            Math.abs(newX - this.x) < 100 && Math.abs(newY - this.y) < 100
        ); // 近すぎる場合は再抽選
        
        // プレイヤーとの距離もチェック（近すぎる場合は再調整）
        const player = this.game.player;
        if (player) {
            const playerDistance = Math.sqrt(
                Math.pow(newX - player.centerX, 2) + Math.pow(newY - player.centerY, 2)
            );
            
            // プレイヤーから200px以上離れているかチェック
            if (playerDistance < 200) {
                // プレイヤーから離れる方向に調整
                const angleToPlayer = Math.atan2(player.centerY - newY, player.centerX - newX);
                const adjustDistance = 200 - playerDistance;
                
                newX -= Math.cos(angleToPlayer) * adjustDistance;
                newY -= Math.sin(angleToPlayer) * adjustDistance;
                
                // 再度マップ境界内に収める
                newX = Math.max(safeMargin, Math.min(mapWidth - this.width - safeMargin, newX));
                newY = Math.max(safeMargin, Math.min(mapHeight - this.height - safeMargin, newY));
            }
        }
        
        // ワープ前の位置を保存
        const oldX = this.x;
        const oldY = this.y;
        
        // ワープエフェクトを表示
        console.log('BossOni3: Creating warping effect');
        this.createWarpingEffect();
        
        // 新しい位置に移動
        this.x = newX;
        this.y = newY;
        
        // ワープ方向を計算してアニメーションを更新
        this.updateWarpDirection(oldX, oldY, newX, newY);
        
        // ワープ状態を設定
        this.isWarping = true;
        this.warpCooldown = this.warpCooldownMax;
        
        playSE("warp"); // ← ワープ時に効果音
        console.log('BossOni3 warped to:', newX, newY);
    }

    // ワープ開始（遅延付き）
    warpToRandomPosition() {
        // ワープ前の3秒間遅延を設定
        this.preWarpDelay = this.preWarpDelayMax;
        
        // 遅延開始時のエフェクトを表示
        console.log('BossOni3: Creating initial pre-warp effect');
        this.createPreWarpEffect();
        
        console.log('BossOni3: Starting warp delay (3 seconds)');
    }

    updateWarpDirection(oldX, oldY, newX, newY) {
        // ワープ方向を計算
        const dx = newX - oldX;
        const dy = newY - oldY;
        
        // 方向を決定
        if (Math.abs(dy) > Math.abs(dx)) {
            // 縦方向のワープ
            if (dy > 0) {
                this.currentDirection = 'front';
            } else {
                this.currentDirection = 'back';
            }
        } else {
            // 横方向のワープ
            if (dx > 0) {
                this.currentDirection = 'right';
            } else {
                this.currentDirection = 'left';
            }
        }
        
        // アニメーションフレームを更新
        this.updateAnimationFrame();
    }

    // drawメソッドはEnemyRendererに委譲するため、コメントアウト
    /*
    draw(ctx, scrollX, scrollY) {
        console.log('BossOni3: draw method called, spriteSheet:', this.spriteSheet, 'animationInitialized:', this.animationInitialized);
        
        const screenX = this.centerX - scrollX;
        const screenY = this.centerY - scrollY;

        // ワープ中の透明度効果
        if (this.isWarping) {
            ctx.globalAlpha = this.warpAlpha;
        }

        // SpriteSheetを使用したアニメーション描画
        if (this.spriteSheet && this.spriteSheet.image && this.animationInitialized) {
            console.log('BossOni3: Drawing with SpriteSheet, direction:', this.currentDirection);
            ctx.save();
            ctx.translate(screenX, screenY);

            // 現在の方向に応じたフレームを描画
            const frameName = this.getCurrentFrameName();
            console.log('BossOni3: Attempting to draw frame:', frameName, 'Available frames:', this.spriteSheet.frameNames);
            
            // SpriteSheetのdrawFrameメソッドを使用（配列形式に対応済み）
            this.spriteSheet.drawFrame(ctx, frameName, -this.width / 2, -this.height / 2, this.width, this.height);

            ctx.restore();
        } else {
            // フォールバック: 紫の円
            console.log('BossOni3: Drawing fallback circle, spriteSheet:', this.spriteSheet);
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // 透明度をリセット
        if (this.isWarping) {
            ctx.globalAlpha = 1.0;
        }

        // HPバーとデバッグ情報を描画（独自実装）
        this.drawHPBar(ctx, scrollX, scrollY);
        this.drawDebugInfo(ctx, scrollX, scrollY);
    }
    */

    getCurrentFrameName() {
        // 現在の方向に応じたフレーム名を返す
        switch (this.currentDirection) {
            case 'front':
                return 'warp_oni_front.png';
            case 'back':
                return 'warp_oni_back.png';
            case 'left':
                return 'warp_oni_left.png';
            case 'right':
                return 'warp_oni_right.png';
            default:
                return 'warp_oni_front.png';
        }
    }

    drawHPBar(ctx, scrollX, scrollY) {
        // HPバーの描画
        const barWidth = 80;
        const barHeight = 8;
        const barX = this.centerX - scrollX - barWidth / 2;
        const barY = this.centerY - scrollY - this.height / 2 - 20;

        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // HPバー
        const hpRatio = this._hp / this._maxHP;
        const hpWidth = barWidth * hpRatio;
        
        if (hpRatio > 0.6) {
            ctx.fillStyle = '#00ff00'; // 緑
        } else if (hpRatio > 0.3) {
            ctx.fillStyle = '#ffff00'; // 黄
        } else {
            ctx.fillStyle = '#ff0000'; // 赤
        }
        
        ctx.fillRect(barX, barY, hpWidth, barHeight);

        // 枠線
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }

    drawDebugInfo(ctx, scrollX, scrollY) {
        // デバッグ情報の描画
        if (this.game.debugMode) {
            const debugX = this.centerX - scrollX;
            const debugY = this.centerY - scrollY + this.height / 2 + 20;

            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            
            const debugText = [
                `HP: ${this._hp}/${this._maxHP}`,
                `Direction: ${this.currentDirection}`,
                `Pos: (${Math.round(this.x)}, ${Math.round(this.y)})`,
                `SpriteSheet: ${this.spriteSheet ? (this.spriteSheet.image ? 'Image Loaded' : 'No Image') : 'Not created'}`,
                `Current Frame: ${this.getCurrentFrameName()}`,
                `Available Frames: ${this.spriteSheet ? this.spriteSheet.frameNames.join(', ') : 'None'}`,
                `Ofuda Attack: ${this.ofudaAttackCooldown}/${this.ofudaAttackMaxCooldown}`,
                `Mode: ${this.berserkMode ? 'BERSERK' : this.rageMode ? 'RAGE' : 'NORMAL'}`,
                `Speed: ${this.speed.toFixed(1)} (Base: ${this.baseSpeed})`,
                `Warp: ${this.isWarping ? 'WARPING' : this.preWarpDelay > 0 ? `PRE-DELAY: ${Math.ceil(this.preWarpDelay/60)}s` : this.warpCooldown > 0 ? `COOLDOWN: ${Math.ceil(this.warpCooldown/60)}s` : 'READY'}`,
                `Summon: ${this.summonWarningTimer > 0 ? `WARNING: ${this.currentSummonPattern.toUpperCase()}` : this.summonCooldown > 0 ? `COOLDOWN: ${Math.ceil(this.summonCooldown/60)}s` : `READY: ${Math.ceil(this.summonTimer/60)}s`}`
            ];

            debugText.forEach((text, index) => {
                ctx.fillText(text, debugX, debugY + index * 15);
            });
        }
    }

    // ワープ状態の更新
    updateWarpState() {
        // ワープ前の遅延
        if (this.preWarpDelay > 0) {
            this.preWarpDelay--;
            console.log(`BossOni3: Pre-warp delay: ${this.preWarpDelay} frames remaining`);
            
            // 遅延中は定期的にエフェクトを表示（0.5秒ごと）
            if (this.preWarpDelay % 30 === 0) {
                console.log('BossOni3: Creating pre-warp effect');
                this.createPreWarpEffect();
            }
            
            if (this.preWarpDelay <= 0) {
                // 遅延終了、ワープ実行
                console.log('BossOni3: Pre-warp delay finished, executing warp');
                this.executeWarp();
            }
        }
        
        // ワープ後のクールダウン
        if (this.warpCooldown > 0) {
            this.warpCooldown--;
            console.log(`BossOni3: Warp cooldown: ${this.warpCooldown} frames remaining`);
            
            // クールダウン中は定期的にエフェクトを表示（0.5秒ごと）
            if (this.warpCooldown % 30 === 0) {
                console.log('BossOni3: Creating warp cooldown effect');
                this.createWarpCooldownEffect();
            }
            
            if (this.warpCooldown <= 0) {
                // クールダウン終了
                this.isWarping = false;
                console.log('BossOni3: Warp cooldown finished, resuming normal actions');
            }
        }
    }

    // 体力段階に応じた行動変化のチェック
    checkHealthPhase() {
        const healthRatio = this.hp / this.maxHP;
        
        // 激怒モード（体力50%以下）
        if (healthRatio <= this.healthThresholds.rage && !this.rageMode) {
            this.enterRageMode();
        }
        
        // 狂戦士モード（体力20%以下）
        if (healthRatio <= this.healthThresholds.berserk && !this.berserkMode) {
            this.enterBerserkMode();
        }
    }

    // 激怒モードに入る
    enterRageMode() {
        this.rageMode = true;
        console.log('BossOni3: Entering RAGE MODE!');
        
        // 攻撃頻度を上げる（控えめに）
        this.ofudaAttackMaxCooldown = Math.floor(this.ofudaAttackMaxCooldown * 0.85); // 15%短縮
        
        // 移動速度を上げる（控えめに）
        this.speed = this.baseSpeed * 1.15;
        
        // 激怒エフェクト
        this.createRageEffect();
        
        // 効果音
        playSE('onivoice');
    }

    // 狂戦士モードに入る
    enterBerserkMode() {
        this.berserkMode = true;
        console.log('BossOni3: Entering BERSERK MODE!');
        
        // 攻撃頻度を上げる（控えめに）
        this.ofudaAttackMaxCooldown = Math.floor(this.ofudaAttackMaxCooldown * 0.75); // 25%短縮
        
        // 移動速度を上げる（控えめに）
        this.speed = this.baseSpeed * 1.25;
        
        // 攻撃数を少し増やす
        this.ofudaAttackMaxCount = 4; // 3枚→4枚
        
        // 狂戦士エフェクト
        this.createBerserkEffect();
        
        // 効果音
        playSE('bossSE');
    }

    // 激怒エフェクト
    createRageEffect() {
        // 赤い炎のようなエフェクト
        for (let i = 0; i < 15; i++) {
            const angle = (Math.PI * 2 * i) / 15;
            const speed = 4 + Math.random() * 3;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            this.game.particleManager.createParticle(
                this.centerX,
                this.centerY,
                vx,
                vy,
                '#FF4500', // オレンジレッド
                60,
                0.8
            );
        }
    }

    // 狂戦士エフェクト
    createBerserkEffect() {
        // 紫の雷のようなエフェクト
        for (let i = 0; i < 20; i++)
        {
            const angle = (Math.PI * 2 * i) / 20;
            const speed = 5 + Math.random() * 4;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            this.game.particleManager.createParticle(
                this.centerX,
                this.centerY,
                vx,
                vy,
                '#8A2BE2', // ブルーバイオレット
                90,
                1.0
            );
        }
    }

    // ワープ前の遅延エフェクト
    createPreWarpEffect() {
        console.log('BossOni3: createPreWarpEffect called, creating purple swirl effect');
        
        // 紫の渦巻きエフェクト
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const speed = 1 + Math.random() * 2;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            this.game.particleManager.createParticle(
                this.centerX,
                this.centerY,
                vx,
                vy,
                '#9370DB', // ミディアムスレートブルー
                45,
                0.7
            );
        }
        
        // 中心の光るエフェクト
        this.game.particleManager.createParticle(
            this.centerX,
                this.centerY,
                0,
                0,
                '#8A2BE2', // ブルーバイオレット
                60,
                0.9
        );
        
        console.log('BossOni3: Pre-warp effect particles created');
    }

    // ワープ中のエフェクト
    createWarpingEffect() {
        console.log('BossOni3: createWarpingEffect called, creating purple light pillar effect');
        
        // 紫の光の柱エフェクト
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            const distance = 20 + Math.random() * 30;
            const x = this.centerX + Math.cos(angle) * distance;
            const y = this.centerY + Math.sin(angle) * distance;
            
            // 上向きの速度
            const speed = 2 + Math.random() * 3;
            const vx = (Math.random() - 0.5) * 1;
            const vy = -speed;
            
            this.game.particleManager.createParticle(
                x,
                y,
                vx,
                vy,
                '#DDA0DD', // プラム
                75,
                0.8
            );
        }
        
        // 中心の強力な光
        this.game.particleManager.createParticle(
            this.centerX,
            this.centerY,
            0,
            0,
            '#FF00FF', // マゼンタ
            90,
            1.0
        );
        
        console.log('BossOni3: Warping effect particles created');
    }

    // ワープ後のクールダウンエフェクト
    createWarpCooldownEffect() {
        console.log('BossOni3: createWarpCooldownEffect called, creating purple spark effect');
        
        // 紫の火花エフェクト
        for (let i = 0; i < 10; i++) {
            const angle = (Math.PI * 2 * i) / 10;
            const speed = 3 + Math.random() * 4;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            this.game.particleManager.createParticle(
                this.centerX,
                this.centerY,
                vx,
                vy,
                '#9932CC', // ダークオーキッド
                60,
                0.6
            );
        }
        
        // 中心の残光
        this.game.particleManager.createParticle(
            this.centerX,
            this.centerY,
            0,
            0,
            '#BA55D3', // ミディアムオーキッド
            45,
            0.5
        );
        
        console.log('BossOni3: Warp cooldown effect particles created');
    }

    executeOfudaAttack() {
        // お札攻撃パターンをランダムに選択
        this.ofudaAttackPattern = this.getRandomOfudaPattern();
        
        // 攻撃エフェクトを生成
        this.createOfudaAttackEffect();
        
        // 選択されたパターンに基づいてお札を発射
        console.log('BossOni3: Executing ofuda attack with pattern:', this.ofudaAttackPattern);
        switch (this.ofudaAttackPattern) {
            case 'spread':
                this.fireSpreadOfuda();
                break;
            case 'circle':
                this.fireCircleOfuda();
                break;
            case 'target':
                this.fireTargetOfuda();
                break;
            case 'spiral':
                this.fireSpiralOfuda();
                break;
        }
        
        // 効果音を再生
        playSE('syoukan-syutugen');
    }

    getRandomOfudaPattern() {
        let patterns = ['spread', 'circle', 'target', 'spiral'];
        
        // 体力が低い時は少し攻撃的なパターンを優先
        if (this.berserkMode) {
            // 狂戦士モード：spiralとtargetを少し優先
            patterns = ['spiral', 'target', 'spread', 'circle', 'spiral', 'target'];
        } else if (this.rageMode) {
            // 激怒モード：spreadとtargetを少し優先
            patterns = ['spread', 'target', 'circle', 'spiral', 'spread', 'target'];
        }
        
        return patterns[Math.floor(Math.random() * patterns.length)];
    }

    fireSpreadOfuda() {
        // 扇状に3枚のお札を発射
        const player = this.game.player;
        if (!player) return;
        
        console.log('BossOni3: Firing spread ofuda attack');
        
        const baseAngle = Math.atan2(player.centerY - this.centerY, player.centerX - this.centerX);
        const spreadAngle = Math.PI / 6; // 30度の広がり
        
        for (let i = 0; i < this.ofudaAttackMaxCount; i++) {
            const angle = baseAngle - spreadAngle + (spreadAngle * 2 * i) / (this.ofudaAttackMaxCount - 1);
            const effectType = this.ofudaEffects[Math.floor(Math.random() * this.ofudaEffects.length)];
            
            // プレイヤーの現在位置を直接目標にする（より確実に当たるように）
            const targetX = player.centerX;
            const targetY = player.centerY;
            
            console.log(`BossOni3: Creating ofuda ${i + 1} with effect ${effectType}, target: (${targetX}, ${targetY})`);
            const ofuda = new OfudaProjectile(this.game, this.centerX, this.centerY, targetX, targetY, effectType);
            this.game.projectileManager.addProjectile(ofuda);
            console.log('BossOni3: Ofuda added to projectile manager');
        }
    }

    fireCircleOfuda() {
        // 円形に8枚のお札を発射
        const numOfuda = 8;
        
        for (let i = 0; i < numOfuda; i++) {
            const angle = (Math.PI * 2 * i) / numOfuda;
            const effectType = this.ofudaEffects[Math.floor(Math.random() * this.ofudaEffects.length)];
            
            const targetX = this.centerX + Math.cos(angle) * 150;
            const targetY = this.centerY + Math.sin(angle) * 150;
            
            const ofuda = new OfudaProjectile(this.game, this.centerX, this.centerY, targetX, targetY, effectType);
            this.game.projectileManager.addProjectile(ofuda);
        }
    }

    fireTargetOfuda() {
        // プレイヤーを狙って3枚のお札を発射（少しずつずらして）
        const player = this.game.player;
        if (!player) return;
        
        const baseAngle = Math.atan2(player.centerY - this.centerY, player.centerX - this.centerX);
        const offsetAngle = Math.PI / 12; // 15度のずれ
        
        for (let i = 0; i < this.ofudaAttackMaxCount; i++) {
            const angle = baseAngle + (offsetAngle * (i - 1));
            const effectType = this.ofudaEffects[Math.floor(Math.random() * this.ofudaEffects.length)];
            
            const targetX = this.centerX + Math.cos(angle) * 300;
            const targetY = this.centerY + Math.sin(angle) * 300;
            
            const ofuda = new OfudaProjectile(this.game, this.centerX, this.centerY, targetX, targetY, effectType);
            this.game.projectileManager.addProjectile(ofuda);
        }
    }

    fireSpiralOfuda() {
        // 螺旋状に6枚のお札を発射
        const numOfuda = 6;
        const spiralAngle = Math.PI / 3; // 60度ずつ回転
        
        for (let i = 0; i < numOfuda; i++) {
            const angle = spiralAngle * i;
            const effectType = this.ofudaEffects[Math.floor(Math.random() * this.ofudaEffects.length)];
            
            const targetX = this.centerX + Math.cos(angle) * 180;
            const targetY = this.centerY + Math.sin(angle) * 180;
            
            const ofuda = new OfudaProjectile(this.game, this.centerX, this.centerY, targetX, targetY, effectType);
            this.game.projectileManager.addProjectile(ofuda);
        }
    }

    createOfudaAttackEffect() {
        // お札攻撃開始時のエフェクト
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            const speed = 3 + Math.random() * 2;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            this.game.particleManager.createParticle(
                this.centerX,
                this.centerY,
                vx,
                vy,
                '#FFD700', // 金色
                45,
                0.9
            );
        }
        
        // 中心の光るエフェクト
        this.game.particleManager.createParticle(
            this.centerX,
            this.centerY,
            0,
            0,
            '#FFD700',
            60,
            1.0
        );
    }
}

