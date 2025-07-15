import { Sprite } from '../utils/Sprite.js';
import { HealthBar } from './HealthBar.js';
import { SpriteSheet } from '../utils/SpriteSheet.js';

let momotaroSpriteSheet = null;
let momotaroSpriteSheetLoaded = false;

export function preloadMomotaroSpriteSheet(callback) {
    if (momotaroSpriteSheetLoaded) {
        window.momotaroSpriteSheetLoaded = true;
        return callback();
    }
    const img = new Image();
    img.src = 'assets/characters/players/momotaro/momotaro_spritesheet.png';
    fetch('assets/characters/players/momotaro/momotaro_spritesheet.json')
        .then(res => {
            if (!res.ok) throw new Error('JSON not found');
            console.log('JSON fetch success');
            return res.json();
        })
        .then(json => {
            let retryCount = 0;
            const maxRetries = 10;
            function tryLoadImage() {
                const img = new Image();
                img.src = 'assets/characters/players/momotaro/momotaro_spritesheet.png?' + new Date().getTime(); // キャッシュバスター
                console.log('Trying to load image, attempt', retryCount + 1, 'src:', img.src);
            img.onload = () => {
                    console.log('Image loaded successfully');
                momotaroSpriteSheet = new SpriteSheet(img, json);
                momotaroSpriteSheetLoaded = true;
                    window.momotaroSpriteSheetLoaded = true;
                callback();
            };
            img.onerror = () => {
                    console.log('Image load failed, attempt', retryCount + 1, 'src:', img.src);
                    retryCount++;
                    if (retryCount < maxRetries) {
                        setTimeout(tryLoadImage, 500);
                    } else {
                        console.log('Image load failed after', maxRetries, 'attempts');
                window.momotaroSpriteSheetLoaded = false;
                alert('画像の読み込みに失敗しました');
                callback();
                    }
            };
            }
            tryLoadImage();
        })
        .catch(err => {
            console.log('JSON fetch or image load failed:', err);
            window.momotaroSpriteSheetLoaded = false;
            alert('スプライトシートの読み込みに失敗しました');
            callback();
        });
}

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

        // momotaroスプライトシートがロード済みならアニメーション描画
        if (momotaroSpriteSheetLoaded && momotaroSpriteSheet) {
            let frameName = 'momotaro_frontstand';
            if (player.direction === 'up') {
                frameName = (player.isMoving && player.moveFrame % 30 < 15)
                    ? 'momotaro_backwalk1'
                    : 'momotaro_backwalk2';
            } else if (player.direction === 'down') {
                frameName = (player.isMoving && player.moveFrame % 30 < 15)
                    ? 'momotaro_frontwalk'
                    : 'momotaro_frontstand';
            } else if (player.direction === 'left') {
                frameName = (player.isMoving && player.moveFrame % 30 < 15)
                    ? 'momotaro_leftwalk'
                    : 'momotaro_leftstand';
            } else if (player.direction === 'right') {
                frameName = (player.isMoving && player.moveFrame % 30 < 15)
                    ? 'momotaro_rightwalk'
                    : 'momotaro_rightstand';
            }
            momotaroSpriteSheet.drawFrame(ctx, frameName, drawX, drawY, player.width, player.height);
        } else {
            // ロード前は四角だけ描画
            const sprite = new Sprite(drawX, drawY, player.width, player.height, player.color);
            sprite.draw(ctx, 0, 0);
        }

        // HPバー・ゲージ描画
        const barWidth = player.width;
        const barHeight = 10;
        console.log('PlayerRenderer - player.health:', player.health, 'player.maxHP:', player.maxHP); // デバッグログ
        const healthBar = new HealthBar(drawX, drawY - barHeight - 4, barWidth, barHeight, player.health, player.maxHP);
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