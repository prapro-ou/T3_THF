import { Enemy } from '../base/Enemy.js';
import { playSE } from '../../managers/KoukaonManager.js'; // 追加

/**
 * 赤鬼クラス
 * 単一責任: 赤鬼固有の行動と特性
 * 継承: Enemyから基本機能を継承
 */
export class RedOni extends Enemy {
    constructor(game, color = 'red', maxHP = 20, isBossSummoned = false) {
        super(game, color, maxHP);
        this.speed += 0;
        this.isBossSummoned = isBossSummoned; // ボスが召喚したかどうかのフラグ
    }

    // 多態性: 親クラスのメソッドをオーバーライド
    updateMovement() {
        super.updateMovement(); // 親クラスの処理を再利用
        // 赤鬼特有の移動ロジックがあれば追加
    }

    onDeath() {
        playSE("enemy-death"); // 死亡時に効果音
        
        // ボスが召喚した赤鬼は回復アイテムをドロップしない
        if (!this.isBossSummoned && this.game && this.game.recoveryItemManager) {
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            this.game.recoveryItemManager.tryDropItem(centerX, centerY, 'red');
        }
        
        if (this.game && typeof this.game.addOtomoExp === 'function') {
            this.game.addOtomoExp(1);
        }
        super.onDeath && super.onDeath();
    }
}
