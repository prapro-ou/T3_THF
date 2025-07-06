import { Enemy } from '../base/Enemy.js';

/**
 * ボス鬼クラス
 * 単一責任: ボス鬼固有の行動と特性
 * 継承: Enemyから基本機能を継承
 */
export class BossOni extends Enemy {
    constructor(game) {
        super(game, 'gold', 300);
        this.width = 250;
        this.height = 250;
        this.speed -= 1;
        if (this.speed < 1) this.speed = 1;
    }

    // 多態性: 親クラスのメソッドをオーバーライド
    update() {
        super.update();
        // ボス特有の挙動を追加する場合はここに記述
    }

    updateMovement() {
        super.updateMovement();
        // ボス特有の移動ロジックがあれば追加
    }
} 