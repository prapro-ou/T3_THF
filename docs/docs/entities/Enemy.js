import { Character } from './Character.js';
import { distance } from '../utils/Utils.js';
import { Sprite } from '../utils/Sprite.js';
import { HealthBar } from '../components/HealthBar.js';

export class Enemy extends Character {
    static BASE_HP = 30;
    static BASE_SPEED = 1;

    constructor(game, color = '#888') {
        // マップ端からランダムスポ�Eン
        const width = 50;
        const height = 50;
        let x, y;
        const { width: mapWidth, height: mapHeight } = game.cameraManager.getMapDimensions();
        
        const edge = Math.floor(Math.random() * 4);
        switch (edge) {
            case 0: // 丁E                x = Math.random() * (mapWidth - width);
                y = 0;
                break;
            case 1: // 右
                x = mapWidth - width;
                y = Math.random() * (mapHeight - height);
                break;
            case 2: // 丁E                x = Math.random() * (mapWidth - width);
                y = mapHeight - height;
                break;
            case 3: // 左
                x = 0;
                y = Math.random() * (mapHeight - height);
                break;
        }
        super(game, x, y, width, height, color, Enemy.BASE_HP);
        this.markedForDeletion = false;
        this.speed = Enemy.BASE_SPEED + Math.random();
        this.dx = 0;
        this.dy = 0;
    }

    update() {
        this.updateMovement();
    }

    updateMovement() {
        // プレイヤーに向かって移勁E        const deltaX = this.game.player.x - this.x;
        const deltaY = this.game.player.y - this.y;
        const dist = distance(this.game.player.x, this.game.player.y, this.x, this.y);
        if (dist > 0) {
            this.dx = (deltaX / dist) * this.speed;
            this.dy = (deltaY / dist) * this.speed;
        } else {
            this.dx = 0;
            this.dy = 0;
        }
        this.x += this.dx;
        this.y += this.dy;
    }

    draw(ctx, scrollX, scrollY) {
        // スプライト描画
        const sprite = new Sprite(this.x, this.y, this.width, this.height, this.color);
        sprite.draw(ctx, scrollX, scrollY);
        // HPバ�E
        const barWidth = this.width;
        const barHeight = 6;
        const healthBar = new HealthBar(this.x, this.y - barHeight - 2, barWidth, barHeight, this.hp, this.maxHP, '#f00');
        healthBar.draw(ctx, scrollX, scrollY);
    }
}

// 赤鬼
export class RedOni extends Enemy {
    constructor(game) {
        super(game, 'red');
        this.speed += 0;
        this.maxHP = 20;
        this.hp = this.maxHP;
    }

    updateMovement() {
        // プレイヤーに向かって移動
        const deltaX = this.game.player.x - this.x;
        const deltaY = this.game.player.y - this.y;
        const dist = distance(this.game.player.x, this.game.player.y, this.x, this.y);
        if (dist > 0) {
            this.dx = (deltaX / dist) * this.speed;
            this.dy = (deltaY / dist) * this.speed;
        } else {
            this.dx = 0;
            this.dy = 0;
        }
        this.x += this.dx;
        this.y += this.dy;
    }
}

// 青鬼
export class BlueOni extends Enemy {
    constructor(game) {
        super(game, 'blue');
        this.speed -= 0.5; // 青鬼は少し遅い
        if (this.speed < 0.5) this.speed = 0.5; // 最低速度を0.5に設定
        this.maxHP = 40;
        this.hp = this.maxHP;
        this.width = 60;
        this.height = 60;
    }

    updateMovement() {
        // プレイヤーに向かって移動
        const deltaX = this.game.player.x - this.x;
        const deltaY = this.game.player.y - this.y;
        const dist = distance(this.game.player.x, this.game.player.y, this.x, this.y);
        if (dist > 0) {
            this.dx = (deltaX / dist) * this.speed;
            this.dy = (deltaY / dist) * this.speed;
        } else {
            this.dx = 0;
            this.dy = 0;
        }
        this.x += this.dx;
        this.y += this.dy;
    }
}

// 黒鬼
export class BlackOni extends Enemy {
    constructor(game) {
        super(game, 'black');
        this.width = 70;
        this.height = 70;
        this.speed += 0.5;
        this.maxHP = 60;
        this.hp = this.maxHP;
    }

    updateMovement() {
        // プレイヤーに向かって移動
        const deltaX = this.game.player.x - this.x;
        const deltaY = this.game.player.y - this.y;
        const dist = distance(this.game.player.x, this.game.player.y, this.x, this.y);
        if (dist > 0) {
            this.dx = (deltaX / dist) * this.speed;
            this.dy = (deltaY / dist) * this.speed;
        } else {
            this.dx = 0;
            this.dy = 0;
        }
        this.x += this.dx;
        this.y += this.dy;
    }
}

// ボス鬼
export class BossOni extends Enemy {
    constructor(game) {
        super(game, 'gold');
        this.width = 250;
        this.height = 250;
        this.speed -= 1;
        if (this.speed < 1) this.speed = 1;
        this.maxHP = 300;
        this.hp = this.maxHP;
    }

    update() {
        super.update();
        // ボス特有の挙動を追加する場合はここに記述
    }

    updateMovement() {
        // プレイヤーに向かって移動
        const deltaX = this.game.player.x - this.x;
        const deltaY = this.game.player.y - this.y;
        const dist = distance(this.game.player.x, this.game.player.y, this.x, this.y);
        if (dist > 0) {
            this.dx = (deltaX / dist) * this.speed;
            this.dy = (deltaY / dist) * this.speed;
        } else {
            this.dx = 0;
            this.dy = 0;
        }
        this.x += this.dx;
        this.y += this.dy;
    }
}