import { Enemy } from '../base/Enemy.js';
import { playSE } from '../../managers/KoukaonManager.js'; // 追加

/**
 * 黒鬼クラス
 * 単一責任: 黒鬼固有の行動と特性
 * 継承: Enemyから基本機能を継承
 */
export class BlackOni extends Enemy {
    constructor(game, color = 'black', maxHP = 60) {
        super(game, color, maxHP);
        this.width = 70;
        this.height = 70;
        this.speed += 0.5;
    }

    // 多態性: 親クラスのメソッドをオーバーライド
    updateMovement() {
        super.updateMovement();
        // 黒鬼特有の移動ロジックがあれば追加
    }

    onDeath() {
        playSE("enemy-death"); // 死亡時に効果音
        if (this.game && typeof this.game.addOtomoExp === 'function') {
            this.game.addOtomoExp(3);
        }
        super.onDeath && super.onDeath();
    }
}
