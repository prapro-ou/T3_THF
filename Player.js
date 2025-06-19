export class Player {
    constructor(game) {
        this.game = game;
        this.width = 80;
        this.height = 80;
        this.x = this.game.MAP_W / 2;
        this.y = this.game.MAP_H / 2;
        this.color = '#00f';
        this.lives = this.game.INITIAL_PLAYER_LIVES;
    }

    update() {
        if (this.game.keys['w']) this.y -= this.game.PLAYER_SPEED;
        if (this.game.keys['s']) this.y += this.game.PLAYER_SPEED;
        if (this.game.keys['a']) this.x -= this.game.PLAYER_SPEED;
        if (this.game.keys['d']) this.x += this.game.PLAYER_SPEED;

        // マップ端で止める
        this.x = Math.max(this.width / 2, Math.min(this.x, this.game.MAP_W - this.width / 2));
        this.y = Math.max(this.height / 2, Math.min(this.y, this.game.MAP_H - this.height / 2));
    }

    draw(ctx, scrollX, scrollY) {
        // プレイヤーの描画位置を補正
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
    }

    reset() {
        this.x = this.game.MAP_W / 2;
        this.y = this.game.MAP_H / 2;
        this.lives = this.game.INITIAL_PLAYER_LIVES;
    }
} 