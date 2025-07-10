import { BossOni } from './BossOni.js';

export class BossOni4 extends BossOni {
    constructor(game) {
        super(game);
        this.color = '#f1c40f'; // 黄系
        this._maxHP = 450;
        this._hp = 450;
        this.name = 'BossOni4';
    }

    update() {
        // 親クラスの更新処理を呼び出し
        super.update();
        // BossOni4特有の挙動があればここに追加
    }
} 