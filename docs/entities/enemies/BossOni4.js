import { BossOni } from './BossOni.js';

export class BossOni4 extends BossOni {
    constructor(game, x = null, y = null) {
        super(game, x, y);
        this.color = '#9b59b6'; // 紫系
        this._maxHP = 400;
        this._hp = 400;
        this.name = 'BossOni4';
    }

    update() {
        // 親クラスの更新処理を呼び出し
        super.update();
        // BossOni4特有の挙動があればここに追加
    }
} 