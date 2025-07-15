import { BossOni } from './BossOni.js';

export class BossOni2 extends BossOni {
    constructor(game, x = null, y = null) {
        super(game, x, y);
        this.color = '#3498db'; // 青系
        this._maxHP = 350;
        this._hp = 350;
        this.name = 'BossOni2';
    }

    update() {
        // 親クラスの更新処理を呼び出し
        super.update();
        // BossOni2特有の挙動があればここに追加
    }
} 