import { BossOni } from './BossOni.js';

export class BossOni5 extends BossOni {
    constructor(game, x = null, y = null) {
        super(game, x, y);
        this.color = '#e67e22'; // オレンジ系
        this._maxHP = 500;
        this._hp = 500;
        this.name = 'BossOni5';
        // 視覚的サイズを設定
        this.setSize(450, 450);
        // 円形当たり判定の半径を設定
        this.setCircularCollision(180);
    }

    update() {
        // 親クラスの更新処理を呼び出し
        super.update();
        // BossOni5特有の挙動があればここに追加
    }

    // サイズ変更メソッド（将来的な拡張用）
    changeSize(newWidth, newHeight) {
        this.setSize(newWidth, newHeight);
        console.log(`BossOni5: Size changed to ${newWidth}x${newHeight}`);
    }
} 