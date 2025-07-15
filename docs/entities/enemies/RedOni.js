import { Enemy } from '../base/Enemy.js';

/**
 * 赤鬼クラス
 * 単一責任: 赤鬼固有の行動と特性
 * 継承: Enemyから基本機能を継承
 */
export class RedOni extends Enemy {
    constructor(game, color = 'red', maxHP = 20) {
        super(game, color, maxHP);
        this.speed += 0;
    }

    // 多態性: 親クラスのメソッドをオーバーライド
    updateMovement() {
        super.updateMovement(); // 親クラスの処理を再利用
        // 赤鬼特有の移動ロジックがあれば追加
    }

    onDeath() {
        if (this.game && typeof this.game.addOtomoExp === 'function') {
            this.game.addOtomoExp(1);
        }
        super.onDeath && super.onDeath();
    }
}