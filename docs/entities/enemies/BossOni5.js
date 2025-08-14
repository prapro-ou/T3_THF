import { BossOni } from './BossOni.js';
import { playSE } from '../../managers/KoukaonManager.js'; // 効果音をインポート

export class BossOni5 extends BossOni {
    constructor(game, x = null, y = null) {
        super(game, x, y);
        this.color = '#e67e22'; // オレンジ系（雷）
        this._maxHP = 500;
        this._hp = 500;
        this.name = 'BossOni5';
        // 視覚的サイズを設定
        this.setSize(250, 250);
        // 円形当たり判定の半径を設定
        this.setCircularCollision(80);

        // 雷範囲攻撃（周辺ランダム落雷）パラメータ
        this.attackCooldownFrames = 150; // 攻撃クールダウン（210 → 150、29%短縮）
        this.attackDurationFrames = 90;  // 落雷連打の稼働時間（75 → 90、20%延長）
        this.strikeEveryFrames = 25;     // 何フレームごとに次の落雷を予約するか（40 → 25、38%短縮）
        this.strikesPerWave = 10;        // 1回の攻撃での落雷回数の上限（6 → 10、67%増加）
        this.strikeRadius = 90;          // 落雷の有効半径
        this.damagePerStrike = 18;       // 1発のダメージ
        this.strikeOffsetMin = 40;       // プレイヤー周囲に生成する最小距離
        this.strikeOffsetMax = 320;      // プレイヤー周囲に生成する最大距離
        this.telegraphLeadFrames = 30;   // 予兆から着弾までのフレーム数（36 → 30、17%短縮）

        this._isAttacking = false;
        this._attackTimer = 0;
        this._attackCooldown = 60;       // 初回は少し待つ（90 → 60、33%短縮）
        this._lastStrikeSchedule = 0;
        this._pendingStrikes = [];       // {x,y, triggerFrame, radius}
        this._attackType = null;         // 'randomStrike' | 'lightningBeam' | 'lightningSword'
        this._attackPhase = 'idle';      // 'telegraph' | 'active'
        this._phaseTimer = 0;            // 現フェーズ残フレーム
        
        // 風神・雷神ペア識別
        this.bossPairId = 'fuzin_raizin';
        this.isPartnerAlive = true; // パートナー（風神）が生存しているか
        this.rageMode = false; // 怒りモード（パートナー死亡時）
        
        // 怒りモード時の強化パラメータ（大幅強化）
        this.rageAttackCooldownFrames = 70;  // 攻撃クールダウン大幅短縮（150 → 70、53%短縮）
        this.rageAttackDurationFrames = 150; // 落雷連打時間大幅延長（90 → 150、67%延長）
        this.rageStrikeEveryFrames = 12;     // 落雷間隔大幅短縮（25 → 12、52%短縮）
        this.rageStrikesPerWave = 18;        // 落雷回数大幅増加（10 → 18、80%増加）
        this.rageStrikeRadius = 140;         // 落雷半径大幅拡大（90 → 140、56%拡大）
        this.rageDamagePerStrike = 35;       // ダメージ大幅増加（18 → 35、94%増加）
        this.rageTelegraphLeadFrames = 15;   // 予兆時間大幅短縮（30 → 15、50%短縮）
        
        // 新攻撃パターン: 直線稲妻ビーム攻撃
        this.lightningBeamTelegraphFrames = 25;
        this.lightningBeamActiveFrames = 60;
        this.lightningBeamDamage = 25;
        this.lightningBeamWidth = 40; // ビームの幅
        this.lightningBeamRange = 600; // ビームの射程
        
        // 怒りモード時のビーム強化
        this.rageLightningBeamDamage = 40;      // ビームダメージ増加（25 → 40、60%増加）
        this.rageLightningBeamWidth = 60;       // ビーム幅拡大（40 → 60、50%増加）
        this.rageLightningBeamRange = 750;      // ビーム射程拡大（600 → 750、25%増加）
    }

    update() {
        // 親クラスの更新処理を呼び出し
        super.update();
        
        // パートナーの生存状態をチェック
        this.checkPartnerStatus();
        
        const nowFrame = this.game.enemyManager.frame || 0;

        if (!this._isAttacking) {
            if (this._attackCooldown > 0) this._attackCooldown--;
            if (this._attackCooldown <= 0) {
                // 攻撃パターン選択
                const rand = Math.random();
                if (rand < 0.6) {
                    this._attackType = 'randomStrike'; // 従来のランダム落雷
                } else {
                    this._attackType = 'lightningBeam'; // 直線稲妻ビーム
                }
                
                // 攻撃開始
                this._isAttacking = true;
                this._attackPhase = 'telegraph';
                this._phaseTimer = this.getTelegraphFrames();
                this._attackCooldown = this.attackCooldownFrames; // 次回用
                playSE("Thunder"); // ← 攻撃開始時にThunder効果音を鳴らす
            }
        } else {
            if (this._attackPhase === 'telegraph') {
                this.drawTelegraph();
                this._phaseTimer--;
                if (this._phaseTimer <= 0) {
                    this._attackPhase = 'active';
                    this._phaseTimer = this.getActiveFrames();
                }
            } else if (this._attackPhase === 'active') {
                this.applyAttackEffect();
                this._phaseTimer--;
                if (this._phaseTimer <= 0) {
                    // 攻撃終了
                    this._isAttacking = false;
                    this._attackPhase = 'idle';
                    this._attackType = null;
                    this._phaseTimer = 0;
                    // ビーム攻撃のターゲット角度もリセット
                    this._beamTargetAngle = null;
                }
            }
        }
    }
    
    // パートナーの生存状態をチェック
    checkPartnerStatus() {
        const enemies = this.game.enemyManager.getEnemies();
        const partner = enemies.find(enemy => 
            enemy !== this && 
            enemy.bossPairId === this.bossPairId && 
            enemy.name === 'BossOni4'
        );
        
        const wasPartnerAlive = this.isPartnerAlive;
        this.isPartnerAlive = !!partner;
        
        // パートナーが死亡した瞬間に怒りモードに移行
        if (wasPartnerAlive && !this.isPartnerAlive && !this.rageMode) {
            this.activateRageMode();
        }
    }
    
    // 怒りモードを有効化
    activateRageMode() {
        this.rageMode = true;
        console.log('雷神: 風神が倒された！怒りモード発動！');
        
        // 怒りモード時のパラメータを適用
        this.attackCooldownFrames = this.rageAttackCooldownFrames;
        this.attackDurationFrames = this.rageAttackDurationFrames;
        this.strikeEveryFrames = this.rageStrikeEveryFrames;
        this.strikesPerWave = this.rageStrikesPerWave;
        this.strikeRadius = this.rageStrikeRadius;
        this.damagePerStrike = this.rageDamagePerStrike;
        this.telegraphLeadFrames = this.rageTelegraphLeadFrames;
        
        // 怒りモードの視覚効果
        this.color = '#d35400'; // より濃いオレンジに変化
        this.game.particleManager.createExplosion(this.x + this.width/2, this.y + this.height/2, '#d35400', 30);
        
        // 怒りモード発動時の追加エフェクト
        this.createRageModeEffect();
        
        // 怒りモードの効果音
        playSE("Thunder"); // 雷の効果音で怒りモード開始を表現
    }
    
    // 攻撃タイプに応じたフレーム数を取得
    getTelegraphFrames() {
        switch (this._attackType) {
            case 'randomStrike': return this.telegraphLeadFrames;
            case 'lightningBeam': return this.lightningBeamTelegraphFrames;
            default: return this.telegraphLeadFrames;
        }
    }
    
    getActiveFrames() {
        switch (this._attackType) {
            case 'randomStrike': return this.attackDurationFrames;
            case 'lightningBeam': return this.lightningBeamActiveFrames;
            default: return this.attackDurationFrames;
        }
    }
    
    // 予兆描画
    drawTelegraph() {
        switch (this._attackType) {
            case 'randomStrike': this.telegraphRandomStrike(); break;
            case 'lightningBeam': this.telegraphLightningBeam(); break;
        }
    }
    
    // 攻撃効果適用
    applyAttackEffect() {
        switch (this._attackType) {
            case 'randomStrike': this.applyRandomStrikeEffect(); break;
            case 'lightningBeam': this.applyLightningBeamEffect(); break;
        }
    }
    
    // 従来のランダム落雷攻撃
    telegraphRandomStrike() {
        // 従来の予兆表示
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const count = 8;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.2;
            const x = centerX + Math.cos(angle) * (this.strikeRadius + (Math.random() - 0.5) * 6);
            const y = centerY + Math.sin(angle) * (this.strikeRadius + (Math.random() - 0.5) * 6);
            this.game.particleManager.createParticle(x, y, 0, 0, '#f1c40f', 60, 1.0);
        }
    }
    
    applyRandomStrikeEffect() {
        // 従来のランダム落雷処理
        const nowFrame = this.game.enemyManager.frame || 0;
        if (!this._pendingStrikes) this._pendingStrikes = [];
        if (!this._lastStrikeSchedule) this._lastStrikeSchedule = nowFrame - this.strikeEveryFrames;
        
        // 一定間隔で新規落雷を予約
        if (
            nowFrame - this._lastStrikeSchedule >= this.strikeEveryFrames &&
            this._pendingStrikes.length < this.strikesPerWave
        ) {
            this._lastStrikeSchedule = nowFrame;
            this.scheduleRandomStrikeNearPlayer(nowFrame);
        }
        
        // 予兆描画と着弾処理
        this.updateStrikes(nowFrame);
    }
    
    // 新攻撃パターン: 直線稲妻ビーム攻撃
    telegraphLightningBeam() {
        const player = this.game.player;
        if (!player) return;
        
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const playerX = player.x + player.width / 2;
        const playerY = player.y + player.height / 2;
        
        // プレイヤーへの方向を計算（攻撃開始時の位置を固定）
        if (!this._beamTargetAngle) {
            this._beamTargetAngle = Math.atan2(playerY - centerY, playerX - centerX);
        }
        
        const angle = this._beamTargetAngle;
        const beamWidth = this.rageMode ? this.rageLightningBeamWidth : this.lightningBeamWidth;
        const beamRange = this.rageMode ? this.rageLightningBeamRange : this.lightningBeamRange;
        
        // ビームの軌道を予兆表示（より目立つ予兆）
        // メインの軌道ライン
        for (let i = 0; i < 40; i++) {
            const t = (i / 40) * beamRange;
            const x = centerX + Math.cos(angle) * t;
            const y = centerY + Math.sin(angle) * t;
            this.game.particleManager.createParticle(x, y, 0, 0, '#e67e22', 80, 0.9);
        }
        
        // ビームの幅を表現する予兆（より目立つ）
        const widthSteps = 10;
        for (let w = -widthSteps/2; w <= widthSteps/2; w++) {
            const widthOffset = (w / widthSteps) * beamWidth;
            const perpAngle = angle + Math.PI / 2;
            
            for (let i = 0; i < 25; i++) {
                const t = (i / 25) * beamRange;
                const x = centerX + Math.cos(angle) * t + Math.cos(perpAngle) * widthOffset;
                const y = centerY + Math.sin(angle) * t + Math.sin(perpAngle) * widthOffset;
                this.game.particleManager.createParticle(x, y, 0, 0, '#f39c12', 60, 0.7);
            }
        }
        
        // 発射点の強調表示
        for (let i = 0; i < 12; i++) {
            const angleOffset = (i / 12) * Math.PI * 2;
            const radius = 30;
            const x = centerX + Math.cos(angleOffset) * radius;
            const y = centerY + Math.sin(angleOffset) * radius;
            this.game.particleManager.createParticle(x, y, 0, 0, '#e67e22', 100, 1.0);
        }
        
        // 追加予兆: 危険エリアの境界線表示
        this.drawBeamDangerZone(centerX, centerY, angle, beamWidth, beamRange);
        
        // 追加予兆: カウントダウン表示
        this.drawBeamCountdown(centerX, centerY, angle, beamRange);
    }
    
    applyLightningBeamEffect() {
        const player = this.game.player;
        if (!player) return;
        
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        // 攻撃開始時に固定された角度を使用（追尾しない）
        const angle = this._beamTargetAngle;
        const beamWidth = this.rageMode ? this.rageLightningBeamWidth : this.lightningBeamWidth;
        const beamRange = this.rageMode ? this.rageLightningBeamRange : this.lightningBeamRange;
        const beamDamage = this.rageMode ? this.rageLightningBeamDamage : this.lightningBeamDamage;
        
        // ビームの衝突判定とダメージ処理
        this.checkLightningBeamCollision(centerX, centerY, angle, beamWidth, beamRange, beamDamage);
        
        // ビームの視覚効果
        this.createLightningBeamVisualEffect(centerX, centerY, angle, beamWidth, beamRange);
        
        // 攻撃終了時にターゲット角度をリセット
        this._beamTargetAngle = null;
    }
    
    // ビーム攻撃の追加予兆: 危険エリアの境界線表示
    drawBeamDangerZone(centerX, centerY, angle, beamWidth, beamRange) {
        // 危険エリアの境界線を赤色で表示
        const perpAngle = angle + Math.PI / 2;
        const halfWidth = beamWidth / 2;
        
        // 左境界線
        for (let i = 0; i < 30; i++) {
            const t = (i / 30) * beamRange;
            const x = centerX + Math.cos(angle) * t - Math.cos(perpAngle) * halfWidth;
            const y = centerY + Math.sin(angle) * t - Math.sin(perpAngle) * halfWidth;
            this.game.particleManager.createParticle(x, y, 0, 0, '#e74c3c', 90, 0.8);
        }
        
        // 右境界線
        for (let i = 0; i < 30; i++) {
            const t = (i / 30) * beamRange;
            const x = centerX + Math.cos(angle) * t + Math.cos(perpAngle) * halfWidth;
            const y = centerY + Math.sin(angle) * t + Math.sin(perpAngle) * halfWidth;
            this.game.particleManager.createParticle(x, y, 0, 0, '#e74c3c', 90, 0.8);
        }
        

    }
    
    // ビーム攻撃の追加予兆: カウントダウン表示
    drawBeamCountdown(centerX, centerY, angle, beamRange) {
        // 攻撃までの残り時間を視覚的に表示
        const remainingFrames = this._phaseTimer;
        const totalFrames = this.lightningBeamTelegraphFrames;
        const progress = 1 - (remainingFrames / totalFrames);
        
        // カウントダウンバーをビーム軌道上に表示
        const barLength = beamRange * 0.8; // 軌道の80%の長さ
        const barStart = beamRange * 0.1;  // 軌道の10%の位置から開始
        
        for (let i = 0; i < 20; i++) {
            const t = barStart + (i / 20) * barLength;
            const x = centerX + Math.cos(angle) * t;
            const y = centerY + Math.sin(angle) * t;
            
            // 進捗に応じて色を変化（緑→黄→赤）
            let color;
            if (progress < 0.5) {
                color = '#27ae60'; // 緑
            } else if (progress < 0.8) {
                color = '#f39c12'; // 黄
            } else {
                color = '#e74c3c'; // 赤
            }
            
            this.game.particleManager.createParticle(x, y, 0, 0, color, 70, 0.9);
        }
        
        // 発射点のパルスエフェクト（攻撃が近いほど激しく）
        const pulseIntensity = Math.floor(progress * 5) + 1;
        for (let i = 0; i < pulseIntensity; i++) {
            const angleOffset = (i / pulseIntensity) * Math.PI * 2;
            const radius = 25 + Math.sin(Date.now() * 0.01) * 5;
            const x = centerX + Math.cos(angleOffset) * radius;
            const y = centerY + Math.sin(angleOffset) * radius;
            this.game.particleManager.createParticle(x, y, 0, 0, '#e74c3c', 80, 0.8);
        }
    }
    
    // 稲妻ビームの衝突判定とダメージ処理
    checkLightningBeamCollision(startX, startY, angle, beamWidth, beamRange, damage) {
        const player = this.game.player;
        if (!player) return;
        
        // ビームの軌道をチェック
        const checkSteps = 30;
        
        for (let step = 1; step <= checkSteps; step++) {
            const distance = (step / checkSteps) * beamRange;
            const checkX = startX + Math.cos(angle) * distance;
            const checkY = startY + Math.sin(angle) * distance;
            
            // プレイヤーとの距離をチェック
            const playerX = player.x + player.width / 2;
            const playerY = player.y + player.height / 2;
            const dx = checkX - playerX;
            const dy = checkY - playerY;
            const hitDistance = Math.sqrt(dx * dx + dy * dy);
            
            // ビームの幅内ならダメージ
            if (hitDistance <= player.width / 2 + beamWidth / 2) {
                player.takeDamage(damage);
                
                // ヒットエフェクト
                this.game.particleManager.createParticle(checkX, checkY, 0, 0, '#ffffff', 40, 1.0);
                this.game.particleManager.createParticle(checkX, checkY, 0, 0, '#e67e22', 60, 0.9);
                
                // 一度ヒットしたら終了
                break;
            }
        }
    }
    
    // 稲妻ビームの視覚効果
    createLightningBeamVisualEffect(startX, startY, angle, beamWidth, beamRange) {
        // ビームの中心線
        for (let i = 0; i < 50; i++) {
            const t = (i / 50) * beamRange;
            const x = startX + Math.cos(angle) * t;
            const y = startY + Math.sin(angle) * t;
            this.game.particleManager.createParticle(x, y, 0, 0, '#f1c40f', 30, 1.0);
        }
        
        // ビームの幅を表現
        const widthSteps = 6;
        for (let w = -widthSteps/2; w <= widthSteps/2; w++) {
            const widthOffset = (w / widthSteps) * beamWidth;
            const perpAngle = angle + Math.PI / 2;
            
            for (let i = 0; i < 25; i++) {
                const t = (i / 25) * beamRange;
                const x = startX + Math.cos(angle) * t + Math.cos(perpAngle) * widthOffset;
                const y = startY + Math.sin(angle) * t + Math.sin(perpAngle) * widthOffset;
                this.game.particleManager.createParticle(x, y, 0, 0, '#f39c12', 25, 0.8);
            }
        }
    }
    
    // 怒りモード発動時の追加エフェクト
    createRageModeEffect() {
        // 雷神の周りに稲妻エフェクトを作成
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        // 稲妻状のパーティクル
        for (let i = 0; i < 24; i++) {
            const angle = (i / 24) * Math.PI * 2;
            const radius = 80 + Math.random() * 40;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            this.game.particleManager.createParticle(x, y, 0, 0, '#f39c12', 100, 0.9);
        }
        
        // 中央からの稲妻放射エフェクト
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * 250;
            const y = centerY + Math.sin(angle) * 250;
            this.game.particleManager.createParticle(x, y, 0, 0, '#f1c40f', 80, 0.7);
        }
    }

    // サイズ変更メソッド（将来的な拡張用）
    changeSize(newWidth, newHeight) {
        this.setSize(newWidth, newHeight);
        console.log(`BossOni5: Size changed to ${newWidth}x${newHeight}`);
    }

    updateMovement() {
        // 攻撃中は移動を抑制（演出重視）
        if (this._isAttacking) {
            this._dx = 0;
            this._dy = 0;
            return;
        }
        
        // 移動前に他の敵との衝突をチェック
        this.avoidCollisionWithOtherEnemies();
        
        super.updateMovement();
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

    scheduleRandomStrikeNearPlayer(nowFrame) {
        const player = this.game.player;
        if (!player) return;
        const px = player.x + player.width / 2;
        const py = player.y + player.height / 2;

        // ランダムな極座標オフセット
        const r = this.strikeOffsetMin + Math.random() * (this.strikeOffsetMax - this.strikeOffsetMin);
        const theta = Math.random() * Math.PI * 2;
        let sx = px + r * Math.cos(theta);
        let sy = py + r * Math.sin(theta);

        // マップ内にクランプ
        const { width: mapW, height: mapH } = this.game.cameraManager.getMapDimensions();
        sx = Math.max(0, Math.min(sx, mapW));
        sy = Math.max(0, Math.min(sy, mapH));

        this._pendingStrikes.push({
            x: sx,
            y: sy,
            triggerFrame: nowFrame + this.telegraphLeadFrames,
            radius: this.strikeRadius
        });
    }

    updateStrikes(nowFrame) {
        if (this._pendingStrikes.length === 0) return;

        const remaining = [];
        for (const s of this._pendingStrikes) {
            // 予兆: 円形粒子
            this.spawnTelegraphParticles(s.x, s.y, s.radius);

            if (nowFrame >= s.triggerFrame) {
                // 着弾: 雷エフェクト + ダメージ
                this.spawnLightningParticles(s.x, s.y);
                this.tryDamagePlayerAt(s.x, s.y, s.radius, this.damagePerStrike);
            } else {
                remaining.push(s);
            }
        }
        this._pendingStrikes = remaining;
    }

    tryDamagePlayerAt(x, y, radius, damage) {
        const player = this.game.player;
        if (!player) return;
        const pcx = player.x + player.width / 2;
        const pcy = player.y + player.height / 2;
        const dist = Math.hypot(pcx - x, pcy - y);
        if (dist <= radius) {
            player.takeDamage(damage);
        }
    }

    spawnTelegraphParticles(cx, cy, radius) {
        // 円周に点在する粒子で予兆を表現（黄色）
        const count = 8;
        for (let i = 0; i < count; i++) {
            const ang = (i / count) * Math.PI * 2 + Math.random() * 0.2;
            const x = cx + Math.cos(ang) * (radius + (Math.random() - 0.5) * 6);
            const y = cy + Math.sin(ang) * (radius + (Math.random() - 0.5) * 6);
            this.game.particleManager.createParticle(x, y, 0, 0, '#f1c40f', 60, 1.0);
        }
    }

    spawnLightningParticles(cx, cy) {
        // 落雷表現: 上空から地面への黄白色の粒子列
        const bolts = 3;
        for (let b = 0; b < bolts; b++) {
            const jitterX = (Math.random() - 0.5) * 30;
            const segments = 12;
            for (let i = 0; i < segments; i++) {
                const t = i / (segments - 1);
                const x = cx + jitterX + (Math.random() - 0.5) * 10;
                const y = cy - 280 + t * 300 + (Math.random() - 0.5) * 10;
                this.game.particleManager.createParticle(x, y, 0, 0, i % 2 === 0 ? '#fff59d' : '#fd9f14', 60, 1.0);
            }
        }
        // 着弾点にも強いフラッシュ
        this.game.particleManager.createExplosion(cx, cy, '#ffeaa7', 18);
    }
}
