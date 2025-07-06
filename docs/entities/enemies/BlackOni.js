import { Enemy } from '../base/Enemy.js';

/**
 * 黒鬼クラス
 * 単一責任: 黒鬼固有の行動と特性
 * 継承: Enemyから基本機能を継承
 */
export class BlackOni extends Enemy {
    constructor(game) {
        super(game, 'black', 60);
        this.width = 70;
        this.height = 70;
        this.speed += 0.5;
    }

    // 多態性: 親クラスのメソッドをオーバーライド
    updateMovement() {
        super.updateMovement();
        // 黒鬼特有の移動ロジックがあれば追加
    }
} 