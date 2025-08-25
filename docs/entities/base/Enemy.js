import { Character } from './Character.js';
import { MovableEntity } from './MovableEntity.js';

/**
 * 敵の基底クラス
 * 単一責任: 敵の基本行動と状態管理.
 * 継承: CharacterとMovableEntityの機能を組み合わせ
 */
export class Enemy extends Character {
    static BASE_HP = 30;
    static BASE_SPEED = 1.5;

    constructor(game, color = '#888', maxHP = Enemy.BASE_HP) {
        // マップ端からランダムスポーン位置を計算（thisを使用しない）
    const spawnPosition = Enemy.generateSpawnPosition(game);
    const speed = Enemy.BASE_SPEED + Math.random() * 1.2;
        
        console.log('Enemy constructor - maxHP:', maxHP, 'color:', color); // デバッグログ
        
        super(game, spawnPosition.x, spawnPosition.y, 50, 50, color, maxHP);
        
        // MovableEntityの機能を手動で追加（多重継承の代替）
        this._speed = speed;
        this._dx = 0;
        this._dy = 0;
        this._direction = 'front';
        this._markedForDeletion = false;
        
        console.log('Enemy constructor finished - _maxHP:', this._maxHP, '_hp:', this._hp); // デバッグログ
    }

    // 統一的なHPアクセサがない場合は追加
    get hp() {
        return this._hp !== undefined ? this._hp : this.health;
    }
    
    get maxHP() {
        return this._maxHP !== undefined ? this._maxHP : this.maxHealth;
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
    
    get markedForDeletion() { return this._markedForDeletion; }
    set markedForDeletion(value) { this._markedForDeletion = value; }

    // 多態性: サブクラスでオーバーライド可能なメソッド
    updateMovement() {
        // プレイヤーに向かって移動
        this.moveTowards(this.game.player);
    }

    update(deltaTime) {
        // ゲームがポーズ中またはレベルアップ中は処理を停止
        if (this.game.pauseManager && this.game.pauseManager.isPaused) {
            return;
        }
        
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

    onDeath() {
        this._markedForDeletion = true;
        // パーティクル生成
        this.game.particleManager.createExplosion(
            this.centerX,
            this.centerY,
            this.color
        );
    }

    // 静的メソッド: thisを使用しない
    static generateSpawnPosition(game) {
        const { width: mapWidth, height: mapHeight } = game.cameraManager.getMapDimensions();
        const edge = Math.floor(Math.random() * 4);
        const width = 50; // 固定値を使用
        const height = 50; // 固定値を使用
        
        switch (edge) {
            case 0: // 上
                return {
                    x: Math.random() * (mapWidth - width),
                    y: 0
                };
            case 1: // 右
                return {
                    x: mapWidth - width,
                    y: Math.random() * (mapHeight - height)
                };
            case 2: // 下
                return {
                    x: Math.random() * (mapWidth - width),
                    y: mapHeight - height
                };
            case 3: // 左
                return {
                    x: 0,
                    y: Math.random() * (mapHeight - height)
                };
        }
    }
}