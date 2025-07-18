import { GameEntity } from './GameEntity.js';

/**
 * キャラクターの基底クラス
 * 単一責任: HP管理とキャラクター固有の機能
 * 継承: GameEntityから基本機能を継承
 */
export class Character extends GameEntity {
    constructor(game, x, y, width, height, color, maxHP) {
        super(game, x, y, width, height, color);
        this._maxHP = maxHP;
        this._hp = maxHP;
    }

    // カプセル化: HP関連のプロパティへのアクセスを制御
    get maxHP() { 
        return this._maxHP; 
    }
    set maxHP(value) { 
        this._maxHP = Math.max(1, value);
        this._hp = Math.min(this._hp, this._maxHP);
    }
    
    get health() { 
        return this._hp; 
    }
    set health(value) { 
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