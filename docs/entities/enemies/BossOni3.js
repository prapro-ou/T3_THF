import { BossOni } from './BossOni.js';
import { RedOni } from './RedOni.js'; // 例: 雑魚鬼
import { playSE } from '../../managers/KoukaonManager.js'; // 効果音をインポート
import { SpriteSheet } from '../../utils/SpriteSheet.js';

export class BossOni3 extends BossOni {
    constructor(game, x = null, y = null) {
        try {
            console.log('BossOni3: Constructor called');
            super(game, x, y);
            console.log('BossOni3: Super constructor completed');

            this.color = '#9b59b6'; // 紫系（ワープのイメージ）
            this._maxHP = 400;
            this._hp = 400;
            this.name = 'BossOni3';

            // warp_oni画像のサイズに合わせて調整
            this.setSize(100, 100); // 視覚的サイズ
            this.setCircularCollision(20); // 当たり判定半径

            // スプライト画像の設定
            this.spriteSheet = null;
            this.animationInitialized = false;
            this.initializeAnimation();

            // 雑魚召喚の管理
            this.summonTimer = 0;
            this.summonInterval = 300; // 5秒ごとに召喚（60fps想定）

            // アニメーション方向管理
            this.currentDirection = 'front'; // 'front', 'back', 'left', 'right'
            this.lastDirection = 'front';
            this.directionChangeThreshold = 0.1; // 方向変更の閾値

            console.log('BossOni3: Constructor completed successfully');
        } catch (error) {
            console.error('BossOni3 constructor error:', error);
            throw error;
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

        // アニメーション更新
        if (this.spriteSheet) {
            this.spriteSheet.updateAnimation();
        }

        // 雑魚召喚処理
        this.summonTimer++;
        if (this.summonTimer >= this.summonInterval) {
            this.summonTimer = 0;
            this.summonMinion();
        }
    }

    updateMovement() {
        if (this.isEdgeWarping) {
            this._dx = 0;
            this._dy = 0;
            return;
        }

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

        // 端に到達したら即座にワープ
        if (atEdge) {
            this.warpToRandomPosition();
            console.log("BossOni3 reached edge and warped!");
            return;
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
        if (this.spriteSheet.frames[frameName]) {
            this.spriteSheet.setCurrentFrame(frameName);
            console.log(`BossOni3: Animation direction changed to ${this.currentDirection}`);
        }
    }

    summonMinion() {
        // 雑魚鬼を自分の近くに召喚（HPを明示的に設定）
        const minion = new RedOni(this.game, 'red', 15); // HP15の弱い雑魚鬼
        // 召喚位置を設定
        minion.x = this.x + this.width / 2 - minion.width / 2;
        minion.y = this.y + this.height / 2 - minion.height / 2;

        this.game.enemyManager.enemies.push(minion);
        playSE("syoukan-syutugen"); // ← 雑魚鬼召喚時に効果音
        console.log("BossOni3 summoned a weak minion with HP:", minion._hp);
    }

    warpToRandomPosition() {
        const { width: mapWidth, height: mapHeight } = this.game.cameraManager.getMapDimensions();
        let newX, newY;
        do {
            newX = Math.random() * (mapWidth - this.width);
            newY = Math.random() * (mapHeight - this.height);
        } while (
            Math.abs(newX - this.x) < 100 && Math.abs(newY - this.y) < 100
        ); // 近すぎる場合は再抽選
        
        // ワープ前の位置を保存
        const oldX = this.x;
        const oldY = this.y;
        
        // 新しい位置に移動
        this.x = newX;
        this.y = newY;
        
        // ワープ方向を計算してアニメーションを更新
        this.updateWarpDirection(oldX, oldY, newX, newY);
        
        playSE("warp"); // ← ワープ時に効果音
        console.log('BossOni3 warped to:', newX, newY);
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
                `Available Frames: ${this.spriteSheet ? this.spriteSheet.frameNames.join(', ') : 'None'}`
            ];

            debugText.forEach((text, index) => {
                ctx.fillText(text, debugX, debugY + index * 15);
            });
        }
    }
}
