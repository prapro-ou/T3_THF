import { Sprite } from '../utils/Sprite.js';
import { HealthBar } from './HealthBar.js';

export class PlayerRenderer {
    constructor(renderer) {
        this.renderer = renderer;
    }

    drawPlayer(player, ctx, scrollX, scrollY) {
        const { width: viewWidth, height: viewHeight } = this.renderer.getViewDimensions();
        const { width: mapWidth, height: mapHeight } = this.renderer.getMapDimensions();
        
        // プレイヤーは画面中央に描画
        let drawX = viewWidth / 2 - player.width / 2;
        let drawY = viewHeight / 2 - player.height / 2;
        if (player.x < viewWidth / 2) drawX = player.x - scrollX - player.width / 2;
        if (player.x > mapWidth - viewWidth / 2) drawX = player.x - scrollX - player.width / 2;
        if (player.y < viewHeight / 2) drawY = player.y - scrollY - player.height / 2;
        if (player.y > mapHeight - viewHeight / 2) drawY = player.y - scrollY - player.height / 2;

        // スプライト描画
        const sprite = new Sprite(drawX, drawY, player.width, player.height, player.color);
        sprite.draw(ctx, 0, 0);

        // HPバ�E描画
        const barWidth = player.width;
        const barHeight = 10;
        const healthBar = new HealthBar(drawX, drawY - barHeight - 4, barWidth, barHeight, player.hp, player.maxHP);
        healthBar.draw(ctx, 0, 0);

        // 残弾回復ゲージ描画
        if (player.ammo < player.maxAmmo) {
            const gaugeWidth = player.width;
            const gaugeHeight = 6;
            const gaugeY = drawY + player.height + 8;
            const ratio = player.ammoRecoveryTimer / player.ammoRecoveryTime;
            this.renderer.drawAmmoGauge(drawX, gaugeY, gaugeWidth, gaugeHeight, ratio);
        }
    }
} 