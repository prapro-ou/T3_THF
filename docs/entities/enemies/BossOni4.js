import { BossOni } from './BossOni.js';

export class BossOni4 extends BossOni {
    constructor(game) {
        super(game);
        this.color = '#f1c40f'; // 黄系
        this._maxHP = 450;
        this._hp = 450;
        this.name = 'BossOni4';
    }
} 