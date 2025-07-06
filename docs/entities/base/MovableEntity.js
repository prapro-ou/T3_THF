import { GameEntity } from './GameEntity.js';

/**
 * 移動可能なエンティティの基底クラス
 * 単一責任: 移動ロジックの管理
 * 継承: GameEntityから基本機能を継承
 */
export class MovableEntity extends GameEntity {
    constructor(game, x, y, width, height, color, speed) {
        super(game, x, y, width, height, color);
        this._speed = speed;
        this._dx = 0;
        this._dy = 0;
        this._direction = 'front';
    }

    // カプセル化: 移動関連のプロパティへのアクセスを制御
    get speed() { return this._speed; }
    set speed(value) { this._speed = Math.max(0, value); }
    
    get dx() { return this._dx; }
    set dx(value) { this._dx = value; }
    
    get dy() { return this._dy; }
    set dy(value) { this._dy = value; }
    
    get direction() { return this._direction; }
    set direction(value) { this._direction = value; }
    
    get isMoving() { return Math.abs(this._dx) > 0.1 || Math.abs(this._dy) > 0.1; }

    // 多態性: サブクラスでオーバーライド可能なメソッド
    updateMovement() {
        // 基本実装（何もしない）
        // サブクラスでオーバーライドして具体的な移動ロジックを実装
    }

    update(deltaTime) {
        this.updateMovement();
        this.updateDirection();
    }

    updateDirection() {
        if (this.isMoving) {
            if (Math.abs(this._dx) > Math.abs(this._dy)) {
                this._direction = this._dx > 0 ? 'right' : 'left';
            } else {
                this._direction = this._dy > 0 ? 'front' : 'back';
            }
        }
    }

    moveTowards(target, speed = null) {
        const targetSpeed = speed || this._speed;
        const dx = target.centerX - this.centerX;
        const dy = target.centerY - this.centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            this._dx = (dx / dist) * targetSpeed;
            this._dy = (dy / dist) * targetSpeed;
        } else {
            this._dx = 0;
            this._dy = 0;
        }
        
        this.x += this._dx;
        this.y += this._dy;
    }

    stop() {
        this._dx = 0;
        this._dy = 0;
    }
} 