export class Projectile {
    constructor(game, x, y, target, speed = 5, damage = 10, type = 'normal') {
        this.game = game;
        this.x = x;
        this.y = y;
        this.target = target;
        this.speed = speed;
        this.damage = damage;
        this.markedForDeletion = false;
        this.width = 200; // cannon_ballのサイズ
        this.height = 200;
        this.type = type; // 弾の種類（'normal' または 'cannon_ball'）
        
        // 弾の種類に応じて当たり判定サイズを設定
        if (type === 'cannon_ball') {
            this.radius = 100; // cannon_ballの半径（直径200に合わせる）
        } else {
            this.radius = 5; // 通常の弾の半径
        }

        // ターゲットが無効な場合は即削除
        if (!target || typeof target.x !== 'number' || typeof target.y !== 'number') {
            this.markedForDeletion = true;
            return;
        }

        const dx = target.x + (target.width || 0) / 2 - x;
        const dy = target.y + (target.height || 0) / 2 - y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1; // 0除算防止
        this.vx = (dx / dist) * speed;
        this.vy = (dy / dist) * speed;
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
        const maxStepSize = this.game.maxSubframeSteps || 10; // ゲーム設定から取得
        const highSpeedThreshold = this.game.highSpeedThreshold || 10; // ゲーム設定から取得
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
        this.x += this.vx;
        this.y += this.vy;
    }

    // 通常の当たり判定
    checkCollision() {
        if (!this.target || this.target.markedForDeletion) {
            console.log("Projectile deleted: invalid target");
            this.markedForDeletion = true;
            return;
        }

        const ex = this.target.x + (this.target.width || 0) / 2;
        const ey = this.target.y + (this.target.height || 0) / 2;
        const dist = Math.hypot(this.x - ex, this.y - ey);

        // プレイヤーの場合、実際の円形当たり判定サイズを使用
        let targetRadius;
        if (this.target.constructor.name === 'Player') {
            targetRadius = Math.min(this.target.width, this.target.height) / 2 * 0.8;
        } else {
            targetRadius = Math.max(this.target.width || 0, this.target.height || 0) / 2;
        }

        if (dist < this.radius + targetRadius) {
            // デバッグ情報を出力（cannon_ballの場合のみ）
            if (this.type === 'cannon_ball') {
                console.log('Cannon ball collision detected:', {
                    projectileX: this.x,
                    projectileY: this.y,
                    projectileRadius: this.radius,
                    targetX: this.target.x,
                    targetY: this.target.y,
                    targetCenterX: ex,
                    targetCenterY: ey,
                    targetRadius: targetRadius,
                    distance: dist,
                    collisionDistance: this.radius + targetRadius,
                    targetType: this.target.constructor.name,
                    frame: this.game.gameState.frame || 0,
                    timestamp: Date.now()
                });
            }
            
            if (typeof this.target.takeDamage === 'function') {
                this.target.takeDamage(this.damage);
            }
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
        
        // cannon_ballタイプの弾の場合
        if (this.type === 'cannon_ball') {
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
                    // フォールバック: 円形描画
                    ctx.beginPath();
                    ctx.arc(this.x - scrollX, this.y - scrollY, this.radius, 0, Math.PI * 2);
                    ctx.fillStyle = '#ff0';
                    ctx.fill();
                    ctx.strokeStyle = '#000';
                    ctx.stroke();
                }
            } else {
                console.log("Cannon ball sprite sheet not loaded, using fallback");
                // フォールバック: 円形描画
                ctx.beginPath();
                ctx.arc(this.x - scrollX, this.y - scrollY, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = '#ff0';
                ctx.fill();
                ctx.strokeStyle = '#000';
                ctx.stroke();
            }
        } else {
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
} 