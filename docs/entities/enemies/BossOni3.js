import { BossOni } from './BossOni.js';
import { RedOni } from './RedOni.js'; // 例: 雑魚鬼
import { playSE } from '../../managers/KoukaonManager.js'; // 効果音をインポート

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
            this.spriteSheet = new Image();
            this.spriteSheet.src = './assets/characters/oni/warp_oni/warp_oni.png';

            // 雑魚召喚の管理
            this.summonTimer = 0;
            this.summonInterval = 300; // 5秒ごとに召喚（60fps想定）

            console.log('BossOni3: Constructor completed successfully');
        } catch (error) {
            console.error('BossOni3 constructor error:', error);
            throw error;
        }
    }

    update() {
        super.update();

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
        this.x = newX;
        this.y = newY;
        playSE("warp"); // ← ワープ時に効果音
        // ワープ演出フック（エフェクト等）をここに追加可
        console.log('BossOni3 warped to:', newX, newY);
    }

    draw(ctx, scrollX, scrollY) {
        const screenX = this.centerX - scrollX;
        const screenY = this.centerY - scrollY;

        // ワープ中の透明度効果
        if (this.isWarping) {
            ctx.globalAlpha = this.warpAlpha;
        }

        // warp_oni画像を描画
        if (this.spriteSheet && this.spriteSheet.complete) {
            ctx.save();
            ctx.translate(screenX, screenY);

            // プレイヤーの方向を向くように画像を反転
            const player = this.game.player;
            if (player) {
                const dx = player.centerX - this.centerX;
                // プレイヤーが左にいる場合は画像を反転
                if (dx < 0) {
                    ctx.scale(-1, 1);
                }
            }

            ctx.drawImage(
                this.spriteSheet,
                -this.width / 2,
                -this.height / 2,
                this.width,
                this.height
            );

            ctx.restore();
        } else {
            // フォールバック: 紫の円
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // 透明度をリセット
        if (this.isWarping) {
            ctx.globalAlpha = 1.0;
        }

        // HPバーとデバッグ情報を描画
        super.draw(ctx, scrollX, scrollY);
    }
}
