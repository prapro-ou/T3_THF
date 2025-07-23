/**
 * ゲームエンティティの基底クラス
 * 単一責任: エンティティの基本状態管理
 */
export class GameEntity {
    constructor(game, x, y, width, height, color) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        
        // 当たり判定サイズを初期化（デフォルトは描画サイズと同じ）
        this.collisionWidth = width;
        this.collisionHeight = height;
        
        // 円形当たり判定の設定
        this.collisionRadius = Math.min(width, height) / 2; // デフォルトは短辺の半分
        this.useCircularCollision = false; // デフォルトは矩形当たり判定
    }

    // カプセル化: プロパティへのアクセスを制御
    get centerX() { return this.x + this.width / 2; }
    get centerY() { return this.y + this.height / 2; }
    
    get bounds() {
        return {
            left: this.x,
            right: this.x + this.width,
            top: this.y,
            bottom: this.y + this.height
        };
    }

    // 当たり判定用のgetter
    get collisionCenterX() { return this.x + this.collisionWidth / 2; }
    get collisionCenterY() { return this.y + this.collisionHeight / 2; }
    
    get collisionBounds() {
        return {
            left: this.x,
            right: this.x + this.collisionWidth,
            top: this.y,
            bottom: this.y + this.collisionHeight
        };
    }

    // 多態性: サブクラスでオーバーライド可能なメソッド
    update(deltaTime) {
        // 基本実装（何もしない）
        // サブクラスでオーバーライドして具体的な処理を実装
    }

    draw(ctx, scrollX, scrollY) {
        // 基本実装（何もしない）
        // サブクラスでオーバーライドして具体的な描画を実装
    }

    // 他のエンティティとの距離計算
    distanceTo(other) {
        const dx = this.centerX - other.centerX;
        const dy = this.centerY - other.centerY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // 衝突判定（円形当たり判定のみ使用）
    collidesWith(other) {
        return this.collidesWithCircular(other);
    }

    // 円形当たり判定
    collidesWithCircular(other) {
        // 雑魚鬼の挙動に合わせてcollisionRadius未設定ならMath.min(width, height)/2
        const thisVisualWidth = this.visualWidth || this.width;
        const thisVisualHeight = this.visualHeight || this.height;
        const otherVisualWidth = other.visualWidth || other.width;
        const otherVisualHeight = other.visualHeight || other.height;

        const thisRadius = (typeof this.collisionRadius === 'number' ? this.collisionRadius : Math.min(thisVisualWidth, thisVisualHeight) / 2);
        const otherRadius = (typeof other.collisionRadius === 'number' ? other.collisionRadius : Math.min(otherVisualWidth, otherVisualHeight) / 2);

        const thisCenterX = this.x + thisVisualWidth / 2;
        const thisCenterY = this.y + thisVisualHeight / 2;
        const otherCenterX = other.x + otherVisualWidth / 2;
        const otherCenterY = other.y + otherVisualHeight / 2;

        const dx = thisCenterX - otherCenterX;
        const dy = thisCenterY - otherCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        return distance < (thisRadius + otherRadius);
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
    }
} 