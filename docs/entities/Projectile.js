export class Projectile {
    constructor(game, x, y, target, speed = 5, damage = 10, type = 'normal') {
        this.game = game;
        this.x = x;
        this.y = y;
        this.target = target;
        this.speed = speed;
        this.damage = damage;
        this.markedForDeletion = false;
        this.type = type; // 弾の種類
        // すでに当たった敵リスト
        this.hitEnemies = new Set();
        
        // 弾の種類に応じてサイズと当たり判定を設定
        if (type === 'cannon_ball') {
            this.width = 200;
            this.height = 200;
            this.radius = 100;
        } else if (type === 'black_ball') {
            this.width = 40;
            this.height = 40;
            this.radius = 20;
        } else if (type === 'red_ball') {
            this.width = 60;
            this.height = 60;
            this.radius = 30;
        } else if (type === 'yellow_ball') {
            this.width = 60;
            this.height = 60;
            this.radius = 30;
        } else {
            this.width = 10;
            this.height = 10;
            this.radius = 5;
        }

        // ターゲットが無効な場合は即削除
        if (!target || typeof target.x !== 'number' || typeof target.y !== 'number') {
            this.markedForDeletion = true;
            return;
        }

        // 弾の種類に応じて初期速度と方向を設定
        if (type === 'red_ball') {
            // 赤い玉は曲がる弾として実装
            this.setupCurvingProjectile();
        } else if (type === 'yellow_ball') {
            // 黄色い玉も曲がる弾として実装（赤い玉と反対方向）
            this.setupCurvingProjectile();
        } else {
            // その他の弾は直線的に移動
            this.setupLinearProjectile();
        }

        // 曲がる弾用の追加プロパティ
        if (type === 'red_ball') {
            this.curveAngle = 0;
            this.curveSpeed = 0.05; // 0.1 → 0.15 に増加（曲がりが速くなる）
            this.initialDirection = Math.atan2(this.vy, this.vx);
        } else if (type === 'yellow_ball') {
            this.curveAngle = 0;
            this.curveSpeed = 0.05; // 赤い玉と同じ速度
            this.initialDirection = Math.atan2(this.vy, this.vx);
        } else if (type === 'black_ball') {
            // 黒い球用の追尾とライフタイム設定
            this.lifeTime = 180; // 3秒間生存（60FPS想定）
            this.currentLife = 0;
            this.trackingSpeed = 0.1; // 追尾の強さ（0.1 = 10%ずつ方向を調整）
        }
    }

    setupLinearProjectile() {
        const dx = this.target.x + (this.target.width || 0) / 2 - this.x;
        const dy = this.target.y + (this.target.height || 0) / 2 - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        this.vx = (dx / dist) * this.speed;
        this.vy = (dy / dist) * this.speed;
    }

    setupCurvingProjectile() {
        const dx = this.target.x + (this.target.width || 0) / 2 - this.x;
        const dy = this.target.y + (this.target.height || 0) / 2 - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        
        // 基本方向を設定
        this.vx = (dx / dist) * this.speed;
        this.vy = (dy / dist) * this.speed;
    }

    // 線分と円の交差判定
    checkLineCircleIntersection(x1, y1, x2, y2, cx, cy, radius) {
        // 線分の方向ベクトル
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        
        if (len === 0) return false;
        
        // 正規化された方向ベクトル
        const ux = dx / len;
        const uy = dy / len;
        
        // 線分の始点から円の中心へのベクトル
        const px = cx - x1;
        const py = cy - y1;
        
        // 線分上の最近接点までの距離
        const t = Math.max(0, Math.min(len, px * ux + py * uy));
        
        // 最近接点の座標
        const closestX = x1 + ux * t;
        const closestY = y1 + uy * t;
        
        // 最近接点から円の中心までの距離
        const distToCenter = Math.sqrt(
            (closestX - cx) * (closestX - cx) + 
            (closestY - cy) * (closestY - cy)
        );
        
        return distToCenter <= radius;
    }

    // サブフレーム更新（高速移動時の精度向上）
    updateWithSubframes() {
        const maxStepSize = this.game.maxSubframeSteps || 10;
        const highSpeedThreshold = this.game.highSpeedThreshold || 10;
        const moveDistance = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        
        if (moveDistance <= highSpeedThreshold) {
            // 通常の更新
            this.updatePosition();
            this.checkCollision();
        } else {
            // サブフレーム更新
            const steps = Math.ceil(moveDistance / maxStepSize);
            const stepVx = this.vx / steps;
            const stepVy = this.vy / steps;
            
            for (let i = 0; i < steps; i++) {
                const prevX = this.x;
                const prevY = this.y;
                
                this.x += stepVx;
                this.y += stepVy;
                
                // 各ステップで当たり判定をチェック
                if (this.checkCollisionWithLine(prevX, prevY, this.x, this.y)) {
                    return; // 衝突したら終了
                }
            }
        }
    }

    // 線分交差による当たり判定
    checkCollisionWithLine(x1, y1, x2, y2) {
        if (!this.target || this.target.markedForDeletion) {
            console.log("Projectile deleted: invalid target");
            this.markedForDeletion = true;
            return true;
        }

        const ex = this.target.x + (this.target.width || 0) / 2;
        const ey = this.target.y + (this.target.height || 0) / 2;

        // プレイヤーの場合、設定可能な円形当たり判定サイズを使用
        let targetRadius;
        if (this.target.constructor.name === 'Player') {
            const playerHitboxSize = this.game.playerHitboxSize || 0.8;
            targetRadius = Math.min(this.target.width, this.target.height) / 2 * playerHitboxSize;
        } else {
            targetRadius = Math.max(this.target.width || 0, this.target.height || 0) / 2;
        }

        // 線分交差判定
        if (this.checkLineCircleIntersection(x1, y1, x2, y2, ex, ey, targetRadius + this.radius)) {
            // デバッグ情報を出力（cannon_ballの場合のみ）
            if (this.type === 'cannon_ball') {
                console.log('Cannon ball collision detected (line intersection):', {
                    projectileStartX: x1,
                    projectileStartY: y1,
                    projectileEndX: x2,
                    projectileEndY: y2,
                    projectileRadius: this.radius,
                    targetX: this.target.x,
                    targetY: this.target.y,
                    targetCenterX: ex,
                    targetCenterY: ey,
                    targetRadius: targetRadius,
                    targetType: this.target.constructor.name,
                    frame: this.game.gameState.frame || 0,
                    timestamp: Date.now()
                });
            }
            
            if (typeof this.target.takeDamage === 'function') {
                this.target.takeDamage(this.damage);
            }
            this.markedForDeletion = true;
            return true;
        }

        return false;
    }

    // 通常の位置更新
    updatePosition() {
        if (this.type === 'red_ball') {
            // 赤い玉は曲がる動き
            this.updateCurvingMovement();
        } else if (this.type === 'yellow_ball') {
            // 黄色い玉も曲がる動き
            this.updateCurvingMovement();
        } else if (this.type === 'black_ball') {
            // 黒い球は追尾移動
            this.updateTrackingMovement();
        } else {
            // その他の弾は直線移動
            this.x += this.vx;
            this.y += this.vy;
        }
    }

    // 追尾弾の移動更新
    updateTrackingMovement() {
        // ライフタイムを更新
        this.currentLife++;
        
        // ライフタイムが尽きたら削除
        if (this.currentLife >= this.lifeTime) {
            this.markedForDeletion = true;
            return;
        }
        
        // プレイヤー方向を計算
        if (this.target && !this.target.markedForDeletion) {
            const dx = this.target.x + (this.target.width || 0) / 2 - this.x;
            const dy = this.target.y + (this.target.height || 0) / 2 - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            
            // 目標方向の単位ベクトル
            const targetVx = (dx / dist) * this.speed;
            const targetVy = (dy / dist) * this.speed;
            
            // 現在の速度ベクトルを目標方向に徐々に調整（追尾）
            this.vx += (targetVx - this.vx) * this.trackingSpeed;
            this.vy += (targetVy - this.vy) * this.trackingSpeed;
            
            // 速度を正規化して一定の速度を保つ
            const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (currentSpeed > 0) {
                this.vx = (this.vx / currentSpeed) * this.speed;
                this.vy = (this.vy / currentSpeed) * this.speed;
            }
        }
        
        // 位置を更新
        this.x += this.vx;
        this.y += this.vy;
    }

    // 曲がる弾の移動更新
    updateCurvingMovement() {
        // 曲がり角度を更新
        this.curveAngle += this.curveSpeed;
        
        // 基本速度ベクトルを取得
        const baseSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        
        let totalCurve;
        
        if (this.type === 'yellow_ball') {
            // 黄色い玉: 赤い玉と反対方向に曲がる
            const curve1 = Math.sin(this.curveAngle) * -1.5; // メインの曲がり（負の値で反対方向）
            const curve2 = Math.sin(this.curveAngle * 2) * -0.8; // 2倍の周波数で小さな曲がり（負の値）
            const curve3 = Math.sin(this.curveAngle * 0.5) * -0.8; // 0.5倍の周波数でゆっくりした曲がり（負の値）
            
            totalCurve = curve1 + curve2 + curve3;
        } else {
            // 赤い玉: 通常の曲がり
            const curve1 = Math.sin(this.curveAngle) * 1.5; // メインの曲がり
            const curve2 = Math.sin(this.curveAngle * 2) * 0.8; // 2倍の周波数で小さな曲がり
            const curve3 = Math.sin(this.curveAngle * 0.5) * 0.8; // 0.5倍の周波数でゆっくりした曲がり
            
            totalCurve = curve1 + curve2 + curve3;
        }
        
        const newAngle = this.initialDirection + totalCurve;
        
        // 新しい速度ベクトルを設定
        this.vx = Math.cos(newAngle) * baseSpeed;
        this.vy = Math.sin(newAngle) * baseSpeed;
        
        // 位置を更新
        this.x += this.vx;
        this.y += this.vy;
    }

    // 通常の当たり判定
    checkCollision() {
        // 標的が無効なら削除
        if (!this.target || this.target.markedForDeletion) {
            this.markedForDeletion = true;
            return;
        }

        // ゲーム内の全敵を取得
        const enemies = (this.game.enemyManager && typeof this.game.enemyManager.getEnemies === 'function')
            ? this.game.enemyManager.getEnemies()
            : [];

        let hitAny = false;
        for (const enemy of enemies) {
            if (!enemy || enemy.markedForDeletion) continue;
            if (this.hitEnemies.has(enemy)) continue;
            // プレイヤーは除外
            if (enemy.constructor && enemy.constructor.name === 'Player') continue;

            // 当たり判定
            const ex = enemy.x + (enemy.width || 0) / 2;
            const ey = enemy.y + (enemy.height || 0) / 2;
            const targetRadius = Math.max(enemy.width || 0, enemy.height || 0) / 2;
            const dist = Math.hypot(this.x - ex, this.y - ey);
            if (dist < this.radius + targetRadius) {
                if (typeof enemy.takeDamage === 'function') {
                    enemy.takeDamage(this.damage);
                }
                this.hitEnemies.add(enemy);
                hitAny = true;
                // 弾を1体ヒットで消す場合はここでbreak; 複数ヒット可ならbreakしない
            }
        }

        // 標的が敵リストにいない場合も考慮し、標的にも個別判定
        if (this.target && !this.hitEnemies.has(this.target) && !this.target.markedForDeletion) {
            const ex = this.target.x + (this.target.width || 0) / 2;
            const ey = this.target.y + (this.target.height || 0) / 2;
            let targetRadius;
            if (this.target.constructor.name === 'Player') {
                targetRadius = Math.min(this.target.width, this.target.height) / 2 * 0.8;
            } else {
                targetRadius = Math.max(this.target.width || 0, this.target.height || 0) / 2;
            }
            const dist = Math.hypot(this.x - ex, this.y - ey);
            if (dist < this.radius + targetRadius) {
                if (typeof this.target.takeDamage === 'function') {
                    this.target.takeDamage(this.damage);
                }
                this.hitEnemies.add(this.target);
                hitAny = true;
            }
        }

        // 何かに当たったら弾を消す（複数ヒット可ならhitAnyで消さない）
        if (hitAny) {
            this.markedForDeletion = true;
        }
    }

    update() {
        // 高速移動時の精度向上のため、サブフレーム更新を使用
        this.updateWithSubframes();

        // 画面外に出たら削除
        if (
            this.x < 0 || this.x > this.game.MAP_W ||
            this.y < 0 || this.y > this.game.MAP_H
        ) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx, scrollX, scrollY) {
        console.log("Projectile draw at:", this.x - scrollX, this.y - scrollY, "type:", this.type);
        
        // 弾の種類に応じて描画
        if (this.type === 'cannon_ball') {
            this.drawCannonBall(ctx, scrollX, scrollY);
        } else if (this.type === 'black_ball') {
            this.drawBlackBall(ctx, scrollX, scrollY);
        } else if (this.type === 'red_ball') {
            this.drawRedBall(ctx, scrollX, scrollY);
        } else if (this.type === 'yellow_ball') {
            this.drawYellowBall(ctx, scrollX, scrollY);
        } else {
            this.drawNormalProjectile(ctx, scrollX, scrollY);
        }
    }

    drawCannonBall(ctx, scrollX, scrollY) {
        console.log("Drawing cannon_ball projectile");
        if (this.game.projectileManager.cannonBallLoaded && this.game.projectileManager.cannonBallSpriteSheet) {
            console.log("Cannon ball sprite sheet loaded, drawing sprite");
            const spriteSheet = this.game.projectileManager.cannonBallSpriteSheet;
            const frameName = 'cannon_ball';
            
            if (spriteSheet.frames[frameName]) {
                console.log("Drawing cannon_ball frame");
                spriteSheet.drawFrame(ctx, frameName, this.x - scrollX - this.width/2, this.y - scrollY - this.height/2, this.width, this.height);
            } else {
                console.log("Cannon_ball frame not found, using fallback");
                this.drawCannonBallFallback(ctx, scrollX, scrollY);
            }
        } else {
            console.log("Cannon ball sprite sheet not loaded, using fallback");
            this.drawCannonBallFallback(ctx, scrollX, scrollY);
        }
    }

    drawCannonBallFallback(ctx, scrollX, scrollY) {
        // フォールバック: 円形描画
        ctx.beginPath();
        ctx.arc(this.x - scrollX, this.y - scrollY, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ff0';
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.stroke();
    }

    drawBlackBall(ctx, scrollX, scrollY) {
        // ライフタイムに応じた透明度を計算
        const lifeRatio = this.currentLife / this.lifeTime;
        const alpha = Math.max(0.3, 1.0 - lifeRatio * 0.7); // 30%までフェードアウト
        
        // 黒い玉: 小さめで黒い円
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(this.x - scrollX, this.y - scrollY, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 光沢効果
        ctx.beginPath();
        ctx.arc(this.x - scrollX - this.radius/3, this.y - scrollY - this.radius/3, this.radius/4, 0, Math.PI * 2);
        ctx.fillStyle = '#666';
        ctx.fill();
        
        // ライフタイムが少なくなった時の警告効果
        if (lifeRatio > 0.7) {
            ctx.beginPath();
            ctx.arc(this.x - scrollX, this.y - scrollY, this.radius + 3, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 0, 0, ${(lifeRatio - 0.7) * 3.33})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        // 透明度をリセット
        ctx.globalAlpha = 1.0;
    }

    drawRedBall(ctx, scrollX, scrollY) {
        // 赤い玉: 曲がる弾
        ctx.beginPath();
        ctx.arc(this.x - scrollX, this.y - scrollY, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#e74c3c';
        ctx.fill();
        ctx.strokeStyle = '#c0392b';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // 光沢効果
        ctx.beginPath();
        ctx.arc(this.x - scrollX - this.radius/3, this.y - scrollY - this.radius/3, this.radius/4, 0, Math.PI * 2);
        ctx.fillStyle = '#ff6b6b';
        ctx.fill();
        
        // 軌跡効果（曲がる弾らしさを演出）
        ctx.beginPath();
        ctx.arc(this.x - scrollX, this.y - scrollY, this.radius + 5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(231, 76, 60, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    drawYellowBall(ctx, scrollX, scrollY) {
        // 黄色い玉: 曲がる弾（赤い玉と反対方向）
        ctx.beginPath();
        ctx.arc(this.x - scrollX, this.y - scrollY, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#f1c40f';
        ctx.fill();
        ctx.strokeStyle = '#f39c12';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // 光沢効果
        ctx.beginPath();
        ctx.arc(this.x - scrollX - this.radius/3, this.y - scrollY - this.radius/3, this.radius/4, 0, Math.PI * 2);
        ctx.fillStyle = '#f9e79f';
        ctx.fill();
        
        // 軌跡効果（曲がる弾らしさを演出）
        ctx.beginPath();
        ctx.arc(this.x - scrollX, this.y - scrollY, this.radius + 5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(241, 196, 15, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    drawNormalProjectile(ctx, scrollX, scrollY) {
        console.log("Drawing normal projectile");
        // 通常の弾: 円形描画
        ctx.beginPath();
        ctx.arc(this.x - scrollX, this.y - scrollY, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ff0';
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.stroke();
    }
} 