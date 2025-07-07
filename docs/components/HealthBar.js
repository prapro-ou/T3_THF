﻿export class HealthBar {
    constructor(x, y, width, height, hp, maxHP, color='#0f0', bgColor='#222') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.hp = hp;
        this.maxHP = maxHP;
        this.color = color;
        this.bgColor = bgColor;
        console.log('HealthBar constructor - hp:', hp, 'maxHP:', maxHP); // デバッグログ
    }
    draw(ctx, scrollX, scrollY) {
        const hpRatio = Math.max(0, this.hp / this.maxHP);
        console.log('HealthBar draw - hp:', this.hp, 'maxHP:', this.maxHP, 'ratio:', hpRatio); // デバッグログ
        ctx.fillStyle = this.bgColor;
        ctx.fillRect(this.x - scrollX, this.y - scrollY, this.width, this.height);
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - scrollX, this.y - scrollY, this.width * hpRatio, this.height);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(this.x - scrollX, this.y - scrollY, this.width, this.height);
    }
} 