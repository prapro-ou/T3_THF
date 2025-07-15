import { BossOni } from './BossOni.js';

export class BossOni3 extends BossOni {
    constructor(game, x = null, y = null) {
        super(game, x, y);
        this.color = '#2ecc71'; // 緑系
        this._maxHP = 400;
        this._hp = 400;
        this.name = 'BossOni3';
    }

    update() {
        // 親クラスの更新処理を呼び出し
        super.update();
        // BossOni3特有の挙動があればここに追加
    }
} 