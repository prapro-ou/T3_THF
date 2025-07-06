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

    // 衝突判定
    collidesWith(other) {
        return (
            this.x < other.x + other.width &&
            this.x + this.width > other.x &&
            this.y < other.y + other.height &&
            this.y + this.height > other.y
        );
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
    }
} 