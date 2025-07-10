import { BossOni } from './BossOni.js';

export class BossOni5 extends BossOni {
    constructor(game) {
        super(game);
        this.color = '#9b59b6'; // 紫系
        this._maxHP = 500;
        this._hp = 500;
        this.name = 'BossOni5';
    }

    update() {
        // 親クラスの更新処理を呼び出し
        super.update();
        // BossOni5特有の挙動があればここに追加
    }
} 