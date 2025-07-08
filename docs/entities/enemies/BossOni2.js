import { BossOni } from './BossOni.js';

export class BossOni2 extends BossOni {
    constructor(game) {
        super(game);
        this.color = '#3498db'; // 青系
        this._maxHP = 350;
        this._hp = 350;
        this.name = 'BossOni2';
    }
} 