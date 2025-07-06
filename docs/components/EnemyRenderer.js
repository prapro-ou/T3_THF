import { Sprite } from '../utils/Sprite.js';
import { HealthBar } from './HealthBar.js';
import { SpriteSheet } from '../utils/SpriteSheet.js';

// 各鬼のスプライトシートを管理
const enemySpriteSheets = {
    red: { sheet: null, loaded: false },
    blue: { sheet: null, loaded: false },
    black: { sheet: null, loaded: false },
    boss: { sheet: null, loaded: false }
};

// 赤鬼のスプライトシート読み込み
export function preloadRedOniSpriteSheet(callback) {
    if (enemySpriteSheets.red.loaded) {
        window.redOniSpriteSheetLoaded = true;
        return callback();
    }
    
    fetch('assets/red_oni_spritesheet.json')
        .then(res => {
            if (!res.ok) throw new Error('Red Oni JSON not found');
            console.log('Red Oni JSON fetch success');
            return res.json();
        })
        .then(json => {
            let retryCount = 0;
            const maxRetries = 10;
            function tryLoadImage() {
                const img = new Image();
                img.src = 'assets/red_oni_spritesheet.png?' + new Date().getTime();
                console.log('Trying to load red oni image, attempt', retryCount + 1, 'src:', img.src);
                img.onload = () => {
                    console.log('Red Oni image loaded successfully');
                    enemySpriteSheets.red.sheet = new SpriteSheet(img, json);
                    enemySpriteSheets.red.loaded = true;
                    window.redOniSpriteSheetLoaded = true;
                    callback();
                };
                img.onerror = () => {
                    console.log('Red Oni image load failed, attempt', retryCount + 1, 'src:', img.src);
                    retryCount++;
                    if (retryCount < maxRetries) {
                        setTimeout(tryLoadImage, 500);
                    } else {
                        console.log('Red Oni image load failed after', maxRetries, 'attempts');
                        window.redOniSpriteSheetLoaded = false;
                        callback();
                    }
                };
            }
            tryLoadImage();
        })
        .catch(err => {
            console.log('Red Oni JSON fetch or image load failed:', err);
            window.redOniSpriteSheetLoaded = false;
            callback();
        });
}

// 他の鬼のスプライトシート読み込み関数（将来の拡張用）
export function preloadEnemySpriteSheet(enemyType, callback) {
    if (enemySpriteSheets[enemyType] && enemySpriteSheets[enemyType].loaded) {
        return callback();
    }
    
    fetch(`assets/${enemyType}_oni_spritesheet.json`)
        .then(res => {
            if (!res.ok) throw new Error(`${enemyType} Oni JSON not found`);
            console.log(`${enemyType} Oni JSON fetch success`);
            return res.json();
        })
        .then(json => {
            let retryCount = 0;
            const maxRetries = 10;
            function tryLoadImage() {
                const img = new Image();
                img.src = `assets/${enemyType}_oni_spritesheet.png?${new Date().getTime()}`;
                console.log(`Trying to load ${enemyType} oni image, attempt`, retryCount + 1, 'src:', img.src);
                img.onload = () => {
                    console.log(`${enemyType} Oni image loaded successfully`);
                    enemySpriteSheets[enemyType] = { sheet: new SpriteSheet(img, json), loaded: true };
                    callback();
                };
                img.onerror = () => {
                    console.log(`${enemyType} Oni image load failed, attempt`, retryCount + 1, 'src:', img.src);
                    retryCount++;
                    if (retryCount < maxRetries) {
                        setTimeout(tryLoadImage, 500);
                    } else {
                        console.log(`${enemyType} Oni image load failed after`, maxRetries, 'attempts');
                        callback();
                    }
                };
            }
            tryLoadImage();
        })
        .catch(err => {
            console.log(`${enemyType} Oni JSON fetch or image load failed:`, err);
            callback();
        });
}

export class EnemyRenderer {
    constructor(renderer) {
        this.renderer = renderer;
    }

    drawEnemy(enemy, ctx, scrollX, scrollY) {
        const { width: viewWidth, height: viewHeight } = this.renderer.getViewDimensions();
        const { width: mapWidth, height: mapHeight } = this.renderer.getMapDimensions();
        
        // 敵の描画位置を計算
        let drawX = enemy.x - scrollX;
        let drawY = enemy.y - scrollY;
        
        // 画面外の敵は描画しない
        if (drawX + enemy.width < 0 || drawX > viewWidth || 
            drawY + enemy.height < 0 || drawY > viewHeight) {
            return;
        }

        // 敵の種類を判定
        let enemyType = 'red';
        if (enemy.constructor.name === 'BlueOni') {
            enemyType = 'blue';
        } else if (enemy.constructor.name === 'BlackOni') {
            enemyType = 'black';
        } else if (enemy.constructor.name === 'BossOni') {
            enemyType = 'boss';
        }

        // 移動方向を判定
        const isMoving = Math.abs(enemy.dx) > 0.1 || Math.abs(enemy.dy) > 0.1;
        
        // 移動方向を決定
        let direction = 'front';
        if (isMoving) {
            if (Math.abs(enemy.dx) > Math.abs(enemy.dy)) {
                direction = enemy.dx > 0 ? 'right' : 'left';
            } else {
                direction = enemy.dy > 0 ? 'front' : 'back';
            }
        }

        // スプライトシートがロード済みならアニメーション描画
        if (enemySpriteSheets[enemyType] && enemySpriteSheets[enemyType].loaded) {
            const spriteSheet = enemySpriteSheets[enemyType].sheet;
            const frameName = `${enemyType}_oni_${direction}`;
            
            // フレームが存在するかチェック
            if (spriteSheet.frames[frameName]) {
                spriteSheet.drawFrame(ctx, frameName, drawX, drawY, enemy.width, enemy.height);
            } else {
                // フレームが存在しない場合はフォールバック
                console.log(`Frame ${frameName} not found, using fallback`);
                const sprite = new Sprite(drawX, drawY, enemy.width, enemy.height, enemy.color);
                sprite.draw(ctx, 0, 0);
            }
        } else {
            // ロード前は四角形で描画
            const sprite = new Sprite(drawX, drawY, enemy.width, enemy.height, enemy.color);
            sprite.draw(ctx, 0, 0);
        }

        // HPバー描画
        const barWidth = enemy.width;
        const barHeight = 6;
        const healthBar = new HealthBar(drawX, drawY - barHeight - 2, barWidth, barHeight, enemy.hp, enemy.maxHP, '#f00');
        healthBar.draw(ctx, 0, 0);
    }
} 