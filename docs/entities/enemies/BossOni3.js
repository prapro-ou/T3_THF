import { BossOni } from './BossOni.js';

export class BossOni3 extends BossOni {
    constructor(game, x = null, y = null) {
        super(game, x, y);
        this.color = '#2ecc71'; // 緑系
        this._maxHP = 400;
        this._hp = 400;
        this.name = 'BossOni3';
        // 視覚的サイズを設定
        this.setSize(300, 300);
        // 円形当たり判定の半径を設定
        this.setCircularCollision(120);
    }

    update() {
        // 親クラスの更新処理を呼び出し
        super.update();
        // BossOni3特有の挙動があればここに追加
    }

    // サイズ変更メソッド（将来的な拡張用）
    changeSize(newWidth, newHeight) {
        this.setSize(newWidth, newHeight);
        console.log(`BossOni3: Size changed to ${newWidth}x${newHeight}`);
    }
} 