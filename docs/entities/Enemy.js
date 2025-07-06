import { Character } from './Character.js';
import { distance } from '../utils/Utils.js';
import { Sprite } from '../utils/Sprite.js';
import { HealthBar } from '../components/HealthBar.js';
import { EnemyRenderer } from '../components/EnemyRenderer.js';

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
        this.renderer = new EnemyRenderer(game.renderer);
    }

    update() {
        this.updateMovement();
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
        // 移動方向を設定（アニメーション用）
        this.direction = this.getDirection();
    }
    
    getDirection() {
        if (Math.abs(this.dx) > Math.abs(this.dy)) {
            return this.dx > 0 ? 'right' : 'left';
        } else {
            return this.dy > 0 ? 'front' : 'back';
        }
    }

    draw(ctx, scrollX, scrollY) {
        // スプライト描画
        this.renderer.drawEnemy(this, ctx, scrollX, scrollY);
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.markedForDeletion = true;
            // パーティクル生成
            this.game.particleManager.createExplosion(
                this.x + this.width / 2,
                this.y + this.height / 2,
                this.color
            );
        }
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
        // 移動方向を設定（アニメーション用）
        this.direction = this.getDirection();
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
        // 移動方向を設定（アニメーション用）
        this.direction = this.getDirection();
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
        // 移動方向を設定（アニメーション用）
        this.direction = this.getDirection();
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
        // 移動方向を設定（アニメーション用）
        this.direction = this.getDirection();
    }
}