import { GameEntity } from './GameEntity.js';

/**
 * キャラクターの基底クラス
 * 単一責任: HP管理とキャラクター固有の機能
 * 継承: GameEntityから基本機能を継承
 */
export class Character extends GameEntity {
    constructor(game, x, y, width, height, color, maxHP) {
        super(game, x, y, width, height, color);
        console.log('Character constructor - maxHP:', maxHP); // デバッグログ
        this._maxHP = maxHP;
        this._hp = maxHP;
        console.log('Character constructor - _maxHP:', this._maxHP, '_hp:', this._hp); // デバッグログ
    }

    // カプセル化: HP関連のプロパティへのアクセスを制御
    get maxHP() { 
        console.log('maxHP getter called, returning:', this._maxHP); // デバッグログ
        return this._maxHP; 
    }
    set maxHP(value) { 
        console.log('maxHP setter called with:', value); // デバッグログ
        this._maxHP = Math.max(1, value);
        this._hp = Math.min(this._hp, this._maxHP);
    }
    
    get health() { 
        console.log('health getter called, returning:', this._hp); // デバッグログ
        return this._hp; 
    }
    set health(value) { 
        console.log('health setter called with:', value); // デバッグログ
        this._hp = Math.max(0, Math.min(value, this._maxHP)); 
    }
    
    get isAlive() { return this._hp > 0; }
    get healthRatio() { return this._hp / this._maxHP; }

    // 多態性: サブクラスでオーバーライド可能なメソッド
    takeDamage(amount) {
        this.health -= amount;
        if (!this.isAlive) {
            this.onDeath();
        }
    }

    heal(amount) {
        this.health += amount;
    }

    onDeath() {
        // 基本実装（何もしない）
        // サブクラスでオーバーライドして具体的な処理を実装
    }

    reset(x, y) {
        super.reset(x, y);
        this.health = this.maxHP;
    }
} 