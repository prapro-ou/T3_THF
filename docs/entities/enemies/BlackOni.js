import { Enemy } from '../base/Enemy.js';
import { playSE } from '../../managers/KoukaonManager.js'; // 追加
// ...existing code...

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
        
        // 回復アイテムドロップ処理
        if (this.game && this.game.recoveryItemManager) {
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            this.game.recoveryItemManager.tryDropItem(centerX, centerY, 'black');
        }
        
        if (this.game && typeof this.game.addOtomoExp === 'function') {
            this.game.addOtomoExp(3);
        }
        // 5%でスターパワーをドロップ
        if (this.game && Math.random() < 0.05) {
// ...existing code...
        }
        super.onDeath && super.onDeath();
    }
}
