export class Enemy {
    static BASE_HP = 30;
    static BASE_SPEED = 1;

    constructor(game, color = '#888') {
        this.game = game;
        this.width = 50;
        this.height = 50;
        this.markedForDeletion = false;
        this.color = color;
        this.speed = Enemy.BASE_SPEED + Math.random();
        this.maxHp = Enemy.BASE_HP; // 最大HP
        this.hp = this.maxHp;       // 現在HP

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
        // まず自分の移動
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

        // --- ここから重なり解消処理 ---
        for (const other of this.game.enemies) {
            if (other === this) continue;
            const dx = (this.x + this.width / 2) - (other.x + other.width / 2);
            const dy = (this.y + this.height / 2) - (other.y + other.height / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = (Math.max(this.width, this.height) + Math.max(other.width, other.height)) / 2;
            if (dist > 0 && dist < minDist) {
                // 重なっていたら押し戻す
                const overlap = minDist - dist;
                this.x += (dx / dist) * (overlap / 2);
                this.y += (dy / dist) * (overlap / 2);
                other.x -= (dx / dist) * (overlap / 2);
                other.y -= (dy / dist) * (overlap / 2);
            }
        }
        // --- ここまで ---

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

        // HPバー
        const barWidth = this.width;
        const barHeight = 6;
        const hpRatio = Math.max(0, this.hp / this.maxHp); 
        ctx.fillStyle = '#222';
        ctx.fillRect(this.x - scrollX, this.y - scrollY - barHeight - 2, barWidth, barHeight);
        ctx.fillStyle = '#f00';
        ctx.fillRect(this.x - scrollX, this.y - scrollY - barHeight - 2, barWidth * hpRatio, barHeight);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(this.x - scrollX, this.y - scrollY - barHeight - 2, barWidth, barHeight);
    }
}

// 赤鬼
export class RedOni extends Enemy {
    constructor(game) {
        super(game, 'red');
        this.speed += 0; //標準
        this.maxHp = 20;
        this.hp = this.maxHp;
    }
}

// 青鬼
export class BlueOni extends Enemy {
    constructor(game) {
        super(game, 'blue');
        this.speed -= 0.5; // 青鬼は少し遅い
        if (this.speed < 0.5) this.speed = 0.5; // 最低速度を0.5に設定
        this.maxHp = 40;
        this.hp = this.maxHp;
        this.width = 60;
        this.height = 60;
    }
}

// 黒鬼
export class BlackOni extends Enemy {
    constructor(game) {
        super(game, 'black');
        this.width = 70;
        this.height = 70;
        this.speed += 0.5;
        this.maxHp = 60;
        this.hp = this.maxHp;
    }
}

// ボス鬼
export class BossOni extends Enemy {
    constructor(game) {
        super(game, 'gold');
        this.width = 250;
        this.height = 250;
        this.speed -=1 ; // ボスは少し遅い
        if (this.speed < 1) this.speed = 1; // 最低速度を1に設定
        this.maxHp = 300;
        this.hp = this.maxHp;
    }

    update() {
        super.update();
        // ボス特有の挙動を追加する場合はここに記述
    }
}