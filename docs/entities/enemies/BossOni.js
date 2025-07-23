import { Enemy } from '../base/Enemy.js';

/**
 * ボス鬼クラス
 * 単一責任: ボス鬼固有の行動と特性
 * 継承: Enemyから基本機能を継承
 */
export class BossOni extends Enemy {
    constructor(game, x = null, y = null) {
        super(game, x, y);
        this.width = 250;
        this.height = 250;
        this.speed -= 1;
        if (this.speed < 1) this.speed = 1;
        
        // 視覚的サイズと当たり判定サイズを分離
        this.visualWidth = 250;  // 描画サイズ
        this.visualHeight = 250; // 描画サイズ
        this.collisionWidth = 250;  // 当たり判定サイズ
        this.collisionHeight = 250; // 当たり判定サイズ
        
        // 円形当たり判定をデフォルトで有効化
        this.useCircularCollision = true;
        
        // スケーリング情報を初期化
        this.updateSpriteScaling();
        
        // 位置が指定されている場合は設定
        if (x !== null && y !== null) {
            this.x = x - this.width / 2; // 中央揃え
            this.y = y - this.height / 2; // 中央揃え
        }
    }

    // 視覚的サイズの設定（円形当たり判定はcollisionRadiusで管理）
    setSize(visualWidth, visualHeight) {
        const oldWidth = this.visualWidth || this.width;
        const oldHeight = this.visualHeight || this.height;
        
        // 中心位置を計算
        const centerX = this.x + oldWidth / 2;
        const centerY = this.y + oldHeight / 2;
        
        // 視覚的サイズを設定
        this.visualWidth = visualWidth;
        this.visualHeight = visualHeight;
        
        // 基本サイズも同期（後方互換性のため）
        this.width = visualWidth;
        this.height = visualHeight;
        
        // 中心位置を維持するため、位置を調整
        this.x = centerX - this.visualWidth / 2;
        this.y = centerY - this.visualHeight / 2;
        
        // スプライトシートのスケーリング情報を更新
        this.updateSpriteScaling();
        
        console.log(`${this.constructor.name}: Visual size set to ${visualWidth}x${visualHeight}`);
    }

    // スプライトシートのスケーリング情報を更新
    updateSpriteScaling() {
        // 各ボス鬼の元のスプライトサイズを定義
        const originalSpriteSizes = {
            'BossOni': { width: 250, height: 250 },
            'BossOni1': { width: 400, height: 400 }, // cannon_oni
            'BossOni2': { width: 400, height: 400 }, // bike_oni
            'BossOni3': { width: 250, height: 250 },
            'BossOni4': { width: 250, height: 250 },
            'BossOni5': { width: 250, height: 250 }
        };

        const bossType = this.constructor.name;
        const originalSize = originalSpriteSizes[bossType];
        
        if (originalSize) {
            // スケーリング比率を計算（視覚的サイズを使用）
            this.spriteScaleX = this.visualWidth / originalSize.width;
            this.spriteScaleY = this.visualHeight / originalSize.height;
            this.originalSpriteWidth = originalSize.width;
            this.originalSpriteHeight = originalSize.height;
            
            console.log(`${bossType}: Sprite scaling updated - scaleX: ${this.spriteScaleX}, scaleY: ${this.spriteScaleY}`);
        }
    }





    // 円形当たり判定を設定
    setCircularCollision(radius) {
        this.useCircularCollision = true;
        this.collisionRadius = radius;
        console.log(`${this.constructor.name}: Circular collision set with radius ${radius}`);
    }

    // 矩形当たり判定に戻す
    setRectangularCollision() {
        this.useCircularCollision = false;
        console.log(`${this.constructor.name}: Rectangular collision enabled`);
    }

    // 当たり判定の更新
    updateCollisionBounds() {
        // centerXとcenterYはgetterなので自動的に計算される
        // boundsもgetterなので自動的に計算される
        // このメソッドは将来の拡張用に残しておく
        console.log(`BossOni: Collision bounds updated - centerX: ${this.centerX}, centerY: ${this.centerY}`);
    }

    // 多態性: 親クラスのメソッドをオーバーライド
    update() {
        super.update();
        // ボス特有の挙動を追加する場合はここに記述
    }

    updateMovement() {
        super.updateMovement();
        // ボス特有の移動ロジックがあれば追加
    }

    // サイズ変更メソッド（将来的な拡張用）
    changeSize(newWidth, newHeight) {
        this.setSize(newWidth, newHeight);
        console.log(`BossOni: Size changed to ${newWidth}x${newHeight}, scaleX: ${this.spriteScaleX}, scaleY: ${this.spriteScaleY}`);
    }


    // HPプロパティへの統一アクセサを追加
    get hp() {
        return this._hp;
    }
    
    get maxHP() {
        return this._maxHP;
    }
    
    set hp(value) {
        this._hp = value;
    }
    
    set maxHP(value) {
        this._maxHP = value;
    }
    
}