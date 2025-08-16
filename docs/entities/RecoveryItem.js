import { GameEntity } from './base/GameEntity.js';
import { playSE } from '../managers/KoukaonManager.js'; // 効果音をインポート

/**
 * 回復アイテムクラス
 * 敵を倒した時に一定確率でドロップし、プレイヤーが触れると回復アイテム数が増加
 */
export class RecoveryItem extends GameEntity {
    constructor(game, x, y) {
        super(game, x, y, 32, 32, '#00ff00');
        this.image = new Image();
        this.imageLoaded = false;
        
        // 画像読み込み成功時
        this.image.onload = () => {
            this.imageLoaded = true;
            console.log('Recovery item image loaded successfully:', this.image.src);
        };
        
        // 画像読み込み失敗時
        this.image.onerror = () => {
            console.error('Failed to load recovery item image:', this.image.src);
            this.imageLoaded = false;
        };
        
        // 画像パスを設定（正しいファイル名を使用）
        this.image.src = 'assets/UI/UI/recover_bags.png';
        console.log('Loading recovery item image from:', this.image.src);
        
        // アニメーション用
        this.floatOffset = 0;
        this.floatTime = 0; // フレームベースの時間カウンター
        this.floatSpeed = 0.05;
        this.opacity = 1.0;
        this.collected = false;
        
        // 自動消失タイマー（30秒）
        this.lifeTime = 30 * 60; // 60FPS想定で30秒
        this.currentLifeTime = this.lifeTime;
    }

    update() {
        if (this.collected) return;
        
        // フローティングアニメーション（フレームベース）
        this.floatTime += this.floatSpeed;
        this.floatOffset = Math.sin(this.floatTime) * 5;
        
        // ライフタイム減少
        this.currentLifeTime--;
        if (this.currentLifeTime <= 0) {
            this.markForDeletion();
            return;
        }
        
        // 終了間近での点滅効果（フレームベース）
        if (this.currentLifeTime < 300) { // 最後の5秒
            this.opacity = Math.sin(this.floatTime * 0.3) * 0.5 + 0.5;
        }
        
        // プレイヤーとの衝突判定
        const player = this.game.player;
        if (player && this.checkCollisionWith(player)) {
            this.collectByPlayer();
        }
    }

    checkCollisionWith(other) {
        const buffer = 10; // 当たり判定を少し大きく
        return this.x < other.x + other.width + buffer &&
               this.x + this.width + buffer > other.x &&
               this.y < other.y + other.height + buffer &&
               this.y + this.height + buffer > other.y;
    }

    collectByPlayer() {
        if (this.collected) return;
        
        this.collected = true;
        // プレイヤーの回復アイテム数を増加
        this.game.player.addRecoveryItem();
        // 回復アイテム取得音を再生
        playSE('get');
        this.markForDeletion();
    }

    draw(ctx, scrollX, scrollY) {
        if (this.collected) return;
        
        ctx.save();
        ctx.globalAlpha = this.opacity;
        
        const drawX = this.x - scrollX;
        const drawY = this.y - scrollY + this.floatOffset;
        
        // 表示サイズを大きく（当たり判定サイズは変更なし）
        const displayWidth = this.width * 2;  // 2倍のサイズで表示
        const displayHeight = this.height * 2; // 2倍のサイズで表示
        const offsetX = (displayWidth - this.width) / 2;  // 中央揃えのためのオフセット
        const offsetY = (displayHeight - this.height) / 2; // 中央揃えのためのオフセット
        
        if (this.imageLoaded) {
            ctx.drawImage(
                this.image, 
                drawX - offsetX, 
                drawY - offsetY, 
                displayWidth, 
                displayHeight
            );
        } else {
            // フォールバック描画：桃らしい見た目
            const centerX = drawX + this.width / 2;
            const centerY = drawY + this.height / 2;
            
            // 桃色の円を描画
            ctx.fillStyle = '#FFB6C1';
            ctx.beginPath();
            ctx.arc(centerX, centerY, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
            
            // 桃の文字
            ctx.fillStyle = '#FF69B4';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('桃', centerX, centerY);
            
            // デバッグ用：画像が読み込まれていないことを示す
            console.log('Recovery item image not loaded, using fallback rendering');
        }
        
        ctx.restore();
    }

    markForDeletion() {
        this.shouldDelete = true;
    }
}
