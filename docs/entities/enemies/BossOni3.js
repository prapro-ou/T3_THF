import { BossOni } from './BossOni.js';

export class BossOni3 extends BossOni {
    constructor(game) {
        super(game);
        this.color = '#2ecc71'; // 緑系
        this._maxHP = 400;
        this._hp = 400;
        this.name = 'BossOni3';
    }
} 