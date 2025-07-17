export class RenderManager {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.VIEW_W = canvas.width;
        this.VIEW_H = canvas.height;
        this.MAP_W = this.VIEW_W * 3;
        this.MAP_H = this.VIEW_H * 3;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.VIEW_W, this.VIEW_H);
    }

    drawBackground(scrollX, scrollY, selectedBossType = 0, isBossSpawned = false) {
        // BOSS出現時は全ステージMAP5、それ以外はステージごと
        let mapSrc;
        if (isBossSpawned) {
            mapSrc = 'assets/UI/MAP/momoGOmap5.jpeg';
        } else {
            mapSrc = (selectedBossType === 5)
                ? 'assets/UI/MAP/momoGOmap6.jpeg'
                : 'assets/UI/MAP/momoGOmap4.jpeg';
        }
        // 毎フレームmapSrcが変わったら新しくImage生成（BOSS出現時も即切り替え）
        if (!this.mapImage || this._lastMapSrc !== mapSrc) {
            this.mapImage = new window.Image();
            this.mapImageLoaded = false;
            this.mapImage.onload = () => {
                this.mapImageLoaded = true;
            };
            this.mapImage.src = mapSrc;
            this._lastMapSrc = mapSrc;
        }
        if (this.mapImageLoaded && this.mapImage.width > 0 && this.mapImage.height > 0) {
            this.ctx.drawImage(
                this.mapImage,
                scrollX * (this.mapImage.width / this.MAP_W),
                scrollY * (this.mapImage.height / this.MAP_H),
                this.mapImage.width * (this.VIEW_W / this.MAP_W),
                this.mapImage.height * (this.VIEW_H / this.MAP_H),
                0, 0, this.VIEW_W, this.VIEW_H
            );
        } else {
            // ロード前はグレー背景
            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(0, 0, this.VIEW_W, this.VIEW_H);
        }
        this.ctx.save();
        this.ctx.translate(-scrollX, -scrollY);
        // マップの縁取りを赤に
        this.ctx.strokeStyle = '#f00';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(0, 0, this.MAP_W, this.MAP_H);
        this.ctx.restore();
    }

    drawAttackCircle(attackCircle, scrollX, scrollY) {
        if (attackCircle && attackCircle.timer > 0) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.3;
            this.ctx.beginPath();
            this.ctx.arc(
                attackCircle.x - scrollX,
                attackCircle.y - scrollY,
                attackCircle.radius,
                0, Math.PI * 2
            );
            this.ctx.fillStyle = '#0af';
            this.ctx.fill();
            this.ctx.restore();
        }
    }

    drawSprite(sprite, scrollX, scrollY) {
        sprite.draw(this.ctx, scrollX, scrollY);
    }

    drawHealthBar(healthBar, scrollX, scrollY) {
        healthBar.draw(this.ctx, scrollX, scrollY);
    }

    drawAmmoGauge(x, y, width, height, ratio) {
        this.ctx.fillStyle = '#444';
        this.ctx.fillRect(x, y, width, height);
        this.ctx.fillStyle = '#0af';
        this.ctx.fillRect(x, y, width * ratio, height);
        this.ctx.strokeStyle = '#fff';
        this.ctx.strokeRect(x, y, width, height);
    }

    getViewDimensions() {
        return { width: this.VIEW_W, height: this.VIEW_H };
    }

    getMapDimensions() {
        return { width: this.MAP_W, height: this.MAP_H };
    }
} 