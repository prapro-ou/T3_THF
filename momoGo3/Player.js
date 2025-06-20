export class Player {
    constructor(game) {
        this.game = game;
        this.width = 80;
        this.height = 80;
        this.x = this.game.MAP_W / 2;
        this.y = this.game.MAP_H / 2;
        this.color = '#00f';
        this.maxHP = 100;
        this.hp = this.maxHP;
        this.ammo = 30; // 残弾数
        this.maxAmmo = 30;
        this.ammoRecoveryTime = 1; // n秒で1回復（例: 1秒）
        this.ammoRecoveryTimer = 0; // 経過時間（秒）
    }

    update(deltaTime) {
        if (this.game.keys['w']) this.y -= this.game.PLAYER_SPEED;
        if (this.game.keys['s']) this.y += this.game.PLAYER_SPEED;
        if (this.game.keys['a']) this.x -= this.game.PLAYER_SPEED;
        if (this.game.keys['d']) this.x += this.game.PLAYER_SPEED;
        this.x = Math.max(this.width / 2, Math.min(this.x, this.game.MAP_W - this.width / 2));
        this.y = Math.max(this.height / 2, Math.min(this.y, this.game.MAP_H - this.height / 2));

        // 残弾数回復処理
        if (this.ammo < this.maxAmmo) {
            this.ammoRecoveryTimer += deltaTime;
            if (this.ammoRecoveryTimer >= this.ammoRecoveryTime) {
                this.ammo++;
                this.ammoRecoveryTimer = 0;
            }
        } else {
            this.ammoRecoveryTimer = 0;
        }

        // ★ここで毎フレーム残弾数表示を更新
        this.game.livesDisplay.textContent = `残弾数: ${this.ammo}/${this.maxAmmo}`;
    }

    draw(ctx, scrollX, scrollY) {
        let drawX = this.game.VIEW_W / 2 - this.width / 2;
        let drawY = this.game.VIEW_H / 2 - this.height / 2;
        if (this.x < this.game.VIEW_W / 2) drawX = this.x - scrollX - this.width / 2;
        if (this.x > this.game.MAP_W - this.game.VIEW_W / 2) drawX = this.x - scrollX - this.width / 2;
        if (this.y < this.game.VIEW_H / 2) drawY = this.y - scrollY - this.height / 2;
        if (this.y > this.game.MAP_H - this.game.VIEW_H / 2) drawY = this.y - scrollY - this.height / 2;

        ctx.fillStyle = this.color;
        ctx.fillRect(drawX, drawY, this.width, this.height);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(drawX, drawY, this.width, this.height);

        // HPバー描画
        const barWidth = this.width;
        const barHeight = 10;
        const hpRatio = Math.max(0, this.hp / this.maxHP);
        ctx.fillStyle = '#222';
        ctx.fillRect(drawX, drawY - barHeight - 4, barWidth, barHeight);
        ctx.fillStyle = '#0f0';
        ctx.fillRect(drawX, drawY - barHeight - 4, barWidth * hpRatio, barHeight);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(drawX, drawY - barHeight - 4, barWidth, barHeight);

        // 残弾回復ゲージ描画
        if (this.ammo < this.maxAmmo) {
            const gaugeWidth = this.width;
            const gaugeHeight = 6;
            const gaugeY = drawY + this.height + 8;
            const ratio = this.ammoRecoveryTimer / this.ammoRecoveryTime;
            ctx.fillStyle = '#444';
            ctx.fillRect(drawX, gaugeY, gaugeWidth, gaugeHeight);
            ctx.fillStyle = '#0af';
            ctx.fillRect(drawX, gaugeY, gaugeWidth * ratio, gaugeHeight);
            ctx.strokeStyle = '#fff';
            ctx.strokeRect(drawX, gaugeY, gaugeWidth, gaugeHeight);
        }
    }

    reset() {
        this.x = this.game.MAP_W / 2;
        this.y = this.game.MAP_H / 2;
        this.hp = this.maxHP;
        this.ammo = this.maxAmmo;
        this.ammoRecoveryTimer = 0;
    }
}