import { BossOni } from './BossOni.js';
import { playSE } from '../../managers/KoukaonManager.js'; // 効果音をインポート

export class BossOni4 extends BossOni {

    constructor(game, x = null, y = null) {
        super(game, x, y);
        this.color = '#9b59b6'; // 紫系
    this._maxHP = 4000; // 風神・雷神ペアボスとして適切なHPに調整（単体ボスより高め）
    this._hp = 4000;
        this.name = 'BossOni4';
        // 視覚的サイズを設定
        this.setSize(250, 250);
        // 円形当たり判定の半径を設定
        this.setCircularCollision(80);

        // 風範囲攻撃パラメータ
        this.windRange = 520;           // 風の到達距離
        this.windPushStrength = 8.0;    // 押し出し量（6.0 → 8.0、33%増加）
        this.windDamage = 10;           // ダメージ（8 → 10、25%増加）
        this.windDamageTickFrames = 25; // ダメージ間隔（30 → 25、17%短縮）

        // 攻撃サイクル・パターン
        this.attackCooldownFrames = 120; // 攻撃クールダウン（180 → 120、33%短縮）
        this._attackCooldown = 40;       // 初回待機（60 → 40、33%短縮）
        this._isAttacking = false;
        this._attackPhase = 'idle';      // 'telegraph' | 'active'
        this._attackType = null;         // 'cone' | 'ring'
        this._phaseTimer = 0;            // 現フェーズ残フレーム
        this._startedAtFrame = 0;        // active開始フレーム

        // コーン（扇）攻撃
        this.coneTelegraphFrames = 25;  // 予兆時間短縮（30 → 25、17%短縮）
        this.coneActiveFrames = 50;     // 攻撃時間短縮（60 → 50、17%短縮）
        this.coneHalfAngleRad = this.degToRad(35);

        // リング（環状）攻撃
        this.ringTelegraphFrames = 22;  // 予兆時間短縮（28 → 22、21%短縮）
        this.ringActiveFrames = 30;     // 攻撃時間短縮（36 → 30、17%短縮）
        this.ringRadius = 220;
        this.ringThickness = 80; // 当たり幅
        
        // 引き寄せ攻撃パラメータ
        this.pullTelegraphFrames = 28;  // 予兆時間短縮（35 → 28、20%短縮）
        this.pullActiveFrames = 75;     // 攻撃時間短縮（90 → 75、17%短縮）
        this.pullRange = 450;           // 引き寄せの有効範囲
        this.pullStrength = 3.0;        // 引き寄せの強さ（8.0 → 3.0、大幅弱化）
        this.pullDamage = 12;           // 引き寄せ中のダメージ
        this.pullDamageTickFrames = 20; // ダメージ間隔
        this.pullDurationFrames = 60;   // 引き寄せの持続時間
        
        // 風神・雷神ペア識別
        this.bossPairId = 'fuzin_raizin';
        this.isPartnerAlive = true; // パートナー（雷神）が生存しているか
        this.rageMode = false; // 怒りモード（パートナー死亡時）
        
        // 怒りモード時の強化パラメータ（大幅強化）
        this.rageAttackCooldownFrames = 60;  // 攻撃クールダウン大幅短縮（120 → 60、50%短縮）
        this.rageWindRange = 700;            // 風の到達距離大幅増加（520 → 700、35%増加）
        this.rageWindPushStrength = 15.0;    // 押し出し量大幅増加（8.0 → 15.0、87%増加）
        this.rageWindDamage = 22;            // ダメージ大幅増加（10 → 22、120%増加）
        this.rageConeHalfAngleRad = this.degToRad(60); // 扇の角度大幅拡大（35° → 60°、71%拡大）
        this.rageRingRadius = 350;           // リング半径大幅拡大（220 → 350、59%拡大）
        this.rageRingThickness = 120;        // リング幅大幅拡大（80 → 120、50%増加）
        // 怒りモード時の引き寄せ攻撃強化
        this.ragePullRange = 600;            // 引き寄せ範囲大幅拡大（450 → 600、33%増加）
        this.ragePullStrength = 6.0;        // 引き寄せ強度増加（3.0 → 6.0、100%増加）
        this.ragePullDamage = 20;            // 引き寄せダメージ大幅増加（12 → 20、67%増加）
        this.ragePullDurationFrames = 65;    // 引き寄せ持続時間短縮（80 → 65、19%短縮）
    }

    update() {
        // 親クラスの更新処理を呼び出し
        super.update();
        
        // パートナーの生存状態をチェック
        this.checkPartnerStatus();
        
        // 攻撃状態の更新
        if (!this._isAttacking) {
            if (this._attackCooldown > 0) this._attackCooldown--;
            if (this._attackCooldown <= 0) {
                // パターン選択
                const rand = Math.random();
                if (rand < 0.4) {
                    this._attackType = 'cone'; // 扇攻撃
                } else if (rand < 0.7) {
                    this._attackType = 'ring'; // リング攻撃
                } else {
                    this._attackType = 'pull'; // 引き寄せ攻撃
                }
                this._isAttacking = true;
                this._attackPhase = 'telegraph';
                this._phaseTimer = this.getTelegraphFrames();
            }
        } else {
            if (this._attackPhase === 'telegraph') {
                this.drawTelegraph();
                this._phaseTimer--;
                if (this._phaseTimer <= 0) {
                    this._attackPhase = 'active';
                    this._phaseTimer = this.getActiveFrames();
                    this._startedAtFrame = this.game.enemyManager.frame || 0;
                    // 攻撃開始時
                    const windSE = playSE("Wind");
                    if (windSE) windSE.volume = 0.9; // 例: 音量を90%に
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
                    this._attackCooldown = this.attackCooldownFrames;
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
            enemy.name === 'BossOni5'
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
        console.log('風神: 雷神が倒された！怒りモード発動！');
        
        // 怒りモード時のHP回復・強化
        const currentHPRatio = this._hp / this._maxHP;
        this._maxHP = 2000; // 怒りモード時は最大HPを2000に増加
        this._hp = Math.ceil(this._maxHP * currentHPRatio); // 現在HPの割合を維持
        
        // 怒りモード時のパラメータを適用
        this.attackCooldownFrames = this.rageAttackCooldownFrames;
        this.windRange = this.rageWindRange;
        this.windPushStrength = this.rageWindPushStrength;
        this.windDamage = this.rageWindDamage;
        this.coneHalfAngleRad = this.rageConeHalfAngleRad;
        this.ringRadius = this.rageRingRadius;
        this.ringThickness = this.rageRingThickness;
        this.pullRange = this.ragePullRange;
        this.pullStrength = this.ragePullStrength;
        this.pullDamage = this.ragePullDamage;
        this.pullDurationFrames = this.ragePullDurationFrames;
        
        // 怒りモードの視覚効果
        this.color = '#8e44ad'; // より濃い紫に変化
        this.game.particleManager.createExplosion(this.x + this.width/2, this.y + this.height/2, '#8e44ad', 30);
        
        // 怒りモード発動時の追加エフェクト
        this.createRageModeEffect();
        
        // 怒りモードの効果音
        playSE("Wind"); // 風の効果音で怒りモード開始を表現
    }
    
    // 攻撃タイプに応じたフレーム数を取得
    getTelegraphFrames() {
        switch (this._attackType) {
            case 'cone': return this.coneTelegraphFrames;
            case 'ring': return this.ringTelegraphFrames;
            case 'pull': return this.pullTelegraphFrames;
            default: return this.coneTelegraphFrames;
        }
    }
    
    getActiveFrames() {
        switch (this._attackType) {
            case 'cone': return this.coneActiveFrames;
            case 'ring': return this.ringActiveFrames;
            case 'pull': return this.pullActiveFrames;
            default: return this.coneActiveFrames;
        }
    }
    
    // 怒りモード発動時の追加エフェクト
    createRageModeEffect() {
        // 風神の周りに渦巻きエフェクトを作成
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        // 渦巻き状のパーティクル
        for (let i = 0; i < 36; i++) {
            const angle = (i / 36) * Math.PI * 2;
            const radius = 100 + Math.random() * 50;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            this.game.particleManager.createParticle(x, y, 0, 0, '#9b59b6', 120, 0.8);
        }
        
        // 中央からの放射状エフェクト
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * 200;
            const y = centerY + Math.sin(angle) * 200;
            this.game.particleManager.createParticle(x, y, 0, 0, '#e8d5ff', 90, 0.6);
        }
    }

    // サイズ変更メソッド（将来的な拡張用）
    changeSize(newWidth, newHeight) {
        this.setSize(newWidth, newHeight);
        console.log(`BossOni4: Size changed to ${newWidth}x${newHeight}`);
    }

    updateMovement() {
        // 風攻撃中は移動を抑制
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

    // Telegraph and effect helpers
    drawTelegraph() {
        switch (this._attackType) {
            case 'cone': this.telegraphCone(); break;
            case 'ring': this.telegraphRing(); break;
            case 'pull': this.telegraphPull(); break;
        }
    }

    applyAttackEffect() {
        switch (this._attackType) {
            case 'cone': this.applyConeEffect(); break;
            case 'ring': this.applyRingEffect(); break;
            case 'pull': this.applyPullEffect(); break;
        }
    }

    telegraphCone() {
        const player = this.game.player; if (!player) return;
        const bx = this.x + this.width / 2;
        const by = this.y + this.height / 2;
        const dir = Math.atan2((player.y + player.height / 2) - by, (player.x + player.width / 2) - bx);
        // 扇形内に粒子を密にばら撒いて予兆
        const rays = 12; const steps = 12;
        for (let i = 0; i < rays; i++) {
            const r = -this.coneHalfAngleRad + (2 * this.coneHalfAngleRad) * (i / (rays - 1));
            for (let s = 1; s <= steps; s++) {
                const t = (s / steps) * this.windRange;
                const ang = dir + r + (Math.random() - 0.5) * 0.03;
                const px = bx + Math.cos(ang) * t + (Math.random() - 0.5) * 8;
                const py = by + Math.sin(ang) * t + (Math.random() - 0.5) * 8;
                this.game.particleManager.createParticle(px, py, 0, 0, '#7ed6df', 60, 1.0);
            }
        }
    }

    applyConeEffect() {
        const player = this.game.player; if (!player) return;
        const bx = this.x + this.width / 2;
        const by = this.y + this.height / 2;
        const px = player.x + player.width / 2;
        const py = player.y + player.height / 2;
        const dx = px - bx; const dy = py - by; const dist = Math.hypot(dx, dy);
        if (dist <= 0 || dist > this.windRange) return;

        const dir = Math.atan2(dy, dx);
        const toPlayerAngle = dir;
        const forwardAngle = dir; // 目標方向へ扇を向ける
        // 角度差
        let delta = Math.atan2(Math.sin(toPlayerAngle - forwardAngle), Math.cos(toPlayerAngle - forwardAngle));
        delta = Math.abs(delta);
        if (delta <= this.coneHalfAngleRad) {
            const nx = dx / dist; const ny = dy / dist;
            player.x += nx * this.windPushStrength;
            player.y += ny * this.windPushStrength;
            const { width: mapW, height: mapH } = this.game.cameraManager.getMapDimensions();
            player.x = Math.max(0, Math.min(player.x, mapW - player.width));
            player.y = Math.max(0, Math.min(player.y, mapH - player.height));
            const elapsed = (this.game.enemyManager.frame || 0) - this._startedAtFrame;
            if (elapsed % this.windDamageTickFrames === 0) player.takeDamage(this.windDamage);
            // 風の線
            for (let i = 0; i < 6; i++) {
                const t = Math.random() * this.windRange;
                const px2 = bx + (dx / dist) * t + (Math.random() - 0.5) * 20;
                const py2 = by + (dy / dist) * t + (Math.random() - 0.5) * 20;
                this.game.particleManager.createParticle(px2, py2, 0, 0, '#a7e0f5', 60, 1.0);
            }
        }
    }

    telegraphRing() {
        const bx = this.x + this.width / 2;
        const by = this.y + this.height / 2;
        const count = 36;
        for (let i = 0; i < count; i++) {
            const ang = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.05;
            const rr = this.ringRadius + (Math.random() - 0.5) * (this.ringThickness * 0.6);
            const px = bx + Math.cos(ang) * rr;
            const py = by + Math.sin(ang) * rr;
            this.game.particleManager.createParticle(px, py, 0, 0, '#7ed6df', 60, 1.0);
        }
        // うっすら内側も
        for (let j = 0; j < 24; j++) {
            const ang = Math.random() * Math.PI * 2;
            const rr = this.ringRadius + (Math.random() - 0.5) * this.ringThickness;
            const px = bx + Math.cos(ang) * rr;
            const py = by + Math.sin(ang) * rr;
            this.game.particleManager.createParticle(px, py, 0, 0, '#bdeafe', 60, 1.0);
        }
    }

    applyRingEffect() {
        const player = this.game.player; if (!player) return;
        const bx = this.x + this.width / 2;
        const by = this.y + this.height / 2;
        const px = player.x + player.width / 2;
        const py = player.y + player.height / 2;
        const dx = px - bx; const dy = py - by; const dist = Math.hypot(dx, dy);
        const inner = this.ringRadius - this.ringThickness / 2;
        const outer = this.ringRadius + this.ringThickness / 2;
        if (dist >= inner && dist <= outer) {
            const nx = dx / (dist || 1); const ny = dy / (dist || 1);
            // 外向きに強く押す
            player.x += nx * (this.windPushStrength * 1.2);
            player.y += ny * (this.windPushStrength * 1.2);
            const { width: mapW, height: mapH } = this.game.cameraManager.getMapDimensions();
            player.x = Math.max(0, Math.min(player.x, mapW - player.width));
            player.y = Math.max(0, Math.min(player.y, mapH - player.height));
            const elapsed = (this.game.enemyManager.frame || 0) - this._startedAtFrame;
            if (elapsed % this.windDamageTickFrames === 0) player.takeDamage(this.windDamage);
        }
        // 視覚効果：リング上の風
        this.telegraphRing();
    }
    
    // 引き寄せ攻撃の予兆
    telegraphPull() {
        const player = this.game.player;
        if (!player) return;
        
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const playerX = player.x + player.width / 2;
        const playerY = player.y + player.height / 2;
        
        // プレイヤーへの方向を計算
        const dx = playerX - centerX;
        const dy = playerY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const angle = Math.atan2(dy, dx);
            const pullRange = this.rageMode ? this.ragePullRange : this.pullRange;
            
            // 引き寄せ範囲を円形で表示
            const rangeSteps = 24;
            for (let i = 0; i < rangeSteps; i++) {
                const rangeAngle = (i / rangeSteps) * Math.PI * 2;
                const x = centerX + Math.cos(rangeAngle) * pullRange;
                const y = centerY + Math.sin(rangeAngle) * pullRange;
                this.game.particleManager.createParticle(x, y, 0, 0, '#e74c3c', 80, 0.7);
            }
            
            // 引き寄せ方向を矢印で表示
            const arrowLength = 120;
            const arrowSteps = 8;
            for (let i = 0; i < arrowSteps; i++) {
                const t = (i / arrowSteps) * arrowLength;
                const x = centerX + Math.cos(angle) * t;
                const y = centerY + Math.sin(angle) * t;
                this.game.particleManager.createParticle(x, y, 0, 0, '#e74c3c', 90, 0.9);
            }
            
            // 中央の渦巻きエフェクト
            for (let i = 0; i < 16; i++) {
                const spiralAngle = (i / 16) * Math.PI * 2 + Date.now() * 0.01;
                const radius = 40 + Math.sin(i * 0.5) * 10;
                const x = centerX + Math.cos(spiralAngle) * radius;
                const y = centerY + Math.sin(spiralAngle) * radius;
                this.game.particleManager.createParticle(x, y, 0, 0, '#9b59b6', 100, 0.8);
            }
        }
    }
    
    // 引き寄せ攻撃の効果
    applyPullEffect() {
        const player = this.game.player;
        if (!player) return;
        
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const playerX = player.x + player.width / 2;
        const playerY = player.y + player.height / 2;
        
        // プレイヤーとの距離を計算
        const dx = centerX - playerX;
        const dy = centerY - playerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 引き寄せ範囲内なら引き寄せる
        const pullRange = this.rageMode ? this.ragePullRange : this.pullRange;
        if (distance <= pullRange && distance > 50) { // 50px以内は引き寄せない
            const pullStrength = this.rageMode ? this.ragePullStrength : this.pullStrength;
            const pullDamage = this.rageMode ? this.ragePullDamage : this.pullDamage;
            const pullDurationFrames = this.rageMode ? this.ragePullDurationFrames : this.pullDurationFrames;
            
            // 引き寄せ方向の単位ベクトル
            const nx = dx / distance;
            const ny = dy / distance;
            
            // プレイヤーを引き寄せる
            player.x += nx * pullStrength;
            player.y += ny * pullStrength;
            
            // マップ境界内に収める
            const { width: mapW, height: mapH } = this.game.cameraManager.getMapDimensions();
            player.x = Math.max(0, Math.min(player.x, mapW - player.width));
            player.y = Math.max(0, Math.min(player.y, mapH - player.height));
            
            // 引き寄せ中のダメージは無効化（プレイヤビリティ向上のため）
            // const elapsed = (this.game.enemyManager.frame || 0) - this._startedAtFrame;
            // if (elapsed % this.pullDamageTickFrames === 0) {
            //     player.takeDamage(pullDamage);
            // }
            
            // 引き寄せの視覚効果
            this.createPullVisualEffect(centerX, centerY, playerX, playerY);
        }
    }
    
    // 引き寄せ攻撃の視覚効果
    createPullVisualEffect(centerX, centerY, playerX, playerY) {
        // 引き寄せ方向の風の線
        const dx = centerX - playerX;
        const dy = centerY - playerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const angle = Math.atan2(dy, dx);
            
            // 風の線を複数本表示
            for (let i = 0; i < 8; i++) {
                const offset = (i - 4) * 15; // 中心から少しずらす
                const perpAngle = angle + Math.PI / 2;
                
                for (let j = 0; j < 12; j++) {
                    const t = (j / 12) * distance;
                    const x = centerX + Math.cos(angle) * t + Math.cos(perpAngle) * offset;
                    const y = centerY + Math.sin(angle) * t + Math.sin(perpAngle) * offset;
                    this.game.particleManager.createParticle(x, y, 0, 0, '#7ed6df', 40, 0.8);
                }
            }
            
            // プレイヤー周辺の引き寄せエフェクト
            for (let i = 0; i < 6; i++) {
                const angleOffset = (i / 6) * Math.PI * 2;
                const radius = 30;
                const x = playerX + Math.cos(angleOffset) * radius;
                const y = playerY + Math.sin(angleOffset) * radius;
                this.game.particleManager.createParticle(x, y, 0, 0, '#e74c3c', 60, 0.7);
            }
        }
    }

    degToRad(d) { return d * Math.PI / 180; }
}
