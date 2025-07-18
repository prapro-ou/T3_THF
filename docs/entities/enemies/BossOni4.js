import { BossOni } from './BossOni.js';

export class BossOni4 extends BossOni {
    constructor(game, x = null, y = null) {
        super(game, x, y);
        this.color = '#9b59b6'; // 紫系
        this._maxHP = 400;
        this._hp = 400;
        this.name = 'BossOni4';
        // 視覚的サイズを設定
        this.setSize(350, 350);
        // 円形当たり判定の半径を設定
        this.setCircularCollision(140);
    }

    update() {
        // 親クラスの更新処理を呼び出し
        super.update();
        // BossOni4特有の挙動があればここに追加
    }

    // サイズ変更メソッド（将来的な拡張用）
    changeSize(newWidth, newHeight) {
        this.setSize(newWidth, newHeight);
        console.log(`BossOni4: Size changed to ${newWidth}x${newHeight}`);
    }
} 