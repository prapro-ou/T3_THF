import { BossOni } from './BossOni.js';
import { RedOni } from './RedOni.js'; // 例: 雑魚鬼

export class BossOni3 extends BossOni {
    constructor(game, x = null, y = null) {
        super(game, x, y);
        this.color = '#8e44ad'; // 紫系
        this._maxHP = 500;
        this._hp = 500;
        this.name = 'BossOni3';

        this.summonInterval = 180; // 3秒ごとに雑魚召喚
        this.summonTimer = 0;

        this.isEdgeWarping = false;
        this.edgeWarpTimer = 0;
        this.edgeWarpDuration = 120; // 2秒硬直（60FPS想定）

        this.setSize(350, 350);
        this.setCircularCollision(120);
    }

    update() {
        // 端ワープ硬直管理
        if (this.isEdgeWarping) {
            this.edgeWarpTimer++;
            if (this.edgeWarpTimer >= this.edgeWarpDuration) {
                this.warpToRandomPosition();
                this.isEdgeWarping = false;
                this.edgeWarpTimer = 0;
            }
            // ワープ演出フック（点滅やエフェクトなど入れたい場合ここで）
            return;
        }
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
        this.x += this._dx;
        this.y += this._dy;

        // マップ端でボスの座標を制限
        const { width: mapWidth, height: mapHeight } = this.game.cameraManager.getMapDimensions();
        const atEdge =
            this.x <= 0 || this.x >= mapWidth - this.width ||
            this.y <= 0 || this.y >= mapHeight - this.height;
        this.x = Math.max(0, Math.min(this.x, mapWidth - this.width));
        this.y = Math.max(0, Math.min(this.y, mapHeight - this.height));

        // 端に到達したらワープ準備
        if (atEdge && !this.isEdgeWarping) {
            this.isEdgeWarping = true;
            this.edgeWarpTimer = 0;
        }
    }

    summonMinion() {
        // 雑魚鬼を自分の近くに召喚
        const minion = new RedOni(this.game, this.x + this.width / 2, this.y + this.height / 2);
        this.game.enemyManager.enemies.push(minion);
        console.log("BossOni3 summoned a minion!");
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
        // ワープ演出フック（エフェクト等）をここに追加可
        console.log('BossOni3 warped to:', newX, newY);
    }
} 