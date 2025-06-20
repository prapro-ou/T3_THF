export class Enemy {
    constructor(game, color = '#888') {
        this.game = game;
        this.width = 50;
        this.height = 50;
        this.markedForDeletion = false;
        this.color = color;
        this.speed = this.game.ENEMY_BASE_SPEED + Math.random() * 1;

        // マップ端からランダムスポーン
        const edge = Math.floor(Math.random() * 4);
        switch (edge) {
            case 0: // 上
                this.x = Math.random() * (this.game.MAP_W - this.width);
                this.y = 0;
                break;
            case 1: // 右
                this.x = this.game.MAP_W - this.width;
                this.y = Math.random() * (this.game.MAP_H - this.height);
                break;
            case 2: // 下
                this.x = Math.random() * (this.game.MAP_W - this.width);
                this.y = this.game.MAP_H - this.height;
                break;
            case 3: // 左
                this.x = 0;
                this.y = Math.random() * (this.game.MAP_H - this.height);
                break;
        }
        this.dx = 0;
        this.dy = 0;
    }

    update() {
        const deltaX = this.game.player.x - this.x;
        const deltaY = this.game.player.y - this.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance > 0) {
            this.dx = (deltaX / distance) * this.speed;
            this.dy = (deltaY / distance) * this.speed;
        } else {
            this.dx = 0;
            this.dy = 0;
        }

        this.x += this.dx;
        this.y += this.dy;

        if (
            this.x < -this.width * 2 || this.x > this.game.MAP_W + this.width * 2 ||
            this.y < -this.height * 2 || this.y > this.game.MAP_H + this.height * 2
        ) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx, scrollX, scrollY) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - scrollX, this.y - scrollY, this.width, this.height);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(this.x - scrollX, this.y - scrollY, this.width, this.height);
    }
}

// 赤鬼
export class RedOni extends Enemy {
    constructor(game) {
        super(game, 'red');
        this.speed += 1; // 速い
    }
}

// 青鬼
export class BlueOni extends Enemy {
    constructor(game) {
        super(game, 'blue');
        this.speed -= 1; // 遅い
        if (this.speed < 1) this.speed = 1;
    }
}

// 黒鬼
export class BlackOni extends Enemy {
    constructor(game) {
        super(game, 'black');
        this.width = 70;
        this.height = 70;
        this.speed += 0.5;
    }
}