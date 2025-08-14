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
        this.attackCooldownFrames = 210; // 攻撃クールダウン（約3.5秒）
        this.attackDurationFrames = 75;  // 落雷連打の稼働時間（約1.25秒）
        this.strikeEveryFrames = 40;     // 何フレームごとに次の落雷を予約するか
        this.strikesPerWave = 6;         // 1回の攻撃での落雷回数の上限
        this.strikeRadius = 90;          // 落雷の有効半径
        this.damagePerStrike = 18;       // 1発のダメージ
        this.strikeOffsetMin = 40;       // プレイヤー周囲に生成する最小距離
        this.strikeOffsetMax = 320;      // プレイヤー周囲に生成する最大距離
        this.telegraphLeadFrames = 36;   // 予兆から着弾までのフレーム数

        this._isAttacking = false;
        this._attackTimer = 0;
        this._attackCooldown = 90;       // 初回は少し待つ
        this._lastStrikeSchedule = 0;
        this._pendingStrikes = [];       // {x,y, triggerFrame, radius}
        
        // 風神・雷神ペア識別
        this.bossPairId = 'fuzin_raizin';
        this.isPartnerAlive = true; // パートナー（風神）が生存しているか
        this.rageMode = false; // 怒りモード（パートナー死亡時）
        
        // 怒りモード時の強化パラメータ（大幅強化）
        this.rageAttackCooldownFrames = 90;  // 攻撃クールダウン大幅短縮（210 → 90、57%短縮）
        this.rageAttackDurationFrames = 120; // 落雷連打時間大幅延長（75 → 120、60%延長）
        this.rageStrikeEveryFrames = 15;     // 落雷間隔大幅短縮（40 → 15、63%短縮）
        this.rageStrikesPerWave = 12;        // 落雷回数大幅増加（6 → 12、100%増加）
        this.rageStrikeRadius = 140;         // 落雷半径大幅拡大（90 → 140、56%拡大）
        this.rageDamagePerStrike = 35;       // ダメージ大幅増加（18 → 35、94%増加）
        this.rageTelegraphLeadFrames = 18;   // 予兆時間大幅短縮（36 → 18、50%短縮）
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
                // 攻撃開始
                this._isAttacking = true;
                this._attackTimer = this.attackDurationFrames;
                this._lastStrikeSchedule = nowFrame - this.strikeEveryFrames; // すぐ最初を打てるように
                this._pendingStrikes = [];
                this._attackCooldown = this.attackCooldownFrames; // 次回用
                playSE("Thunder"); // ← 攻撃開始時にThunder効果音を鳴らす
            }
        } else {
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

            this._attackTimer--;
            if (this._attackTimer <= 0 && this._pendingStrikes.length === 0) {
                this._isAttacking = false;
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
