import { Enemy } from '../base/Enemy.js';
import { playSE } from '../../managers/KoukaonManager.js'; // 追加

/**
 * 青鬼クラス
 * 単一責任: 青鬼固有の行動と特性
 * 継承: Enemyから基本機能を継承
 */
export class BlueOni extends Enemy {
    constructor(game, color = 'blue', maxHP = 40) {
        super(game, color, maxHP);
        this.speed -= 0.5; // 青鬼は少し遅い
        if (this.speed < 0.5) this.speed = 0.5; // 最低速度を0.5に設定
        this.width = 60;
        this.height = 60;
    }

    // 多態性: 親クラスのメソッドをオーバーライド
    updateMovement() {
        super.updateMovement();
        // 青鬼特有の移動ロジックがあれば追加
    }

    onDeath() {
        playSE("enemy-death"); // 死亡時に効果音
        if (this.game && typeof this.game.addOtomoExp === 'function') {
            this.game.addOtomoExp(2);
        }
        super.onDeath && super.onDeath();
    }
}
