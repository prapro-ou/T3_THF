import { RecoveryItem } from '../entities/RecoveryItem.js';

/**
 * 回復アイテム管理クラス
 * アイテムのドロップ、更新、描画を管理
 */
export class RecoveryItemManager {
    constructor(game) {
        this.game = game;
        this.items = [];
    this.dropRate = 0.06; // 6%の確率でドロップ
    }

    // ドロップ率を設定（デバッグ用）
    setDropRate(ratePercent) {
        this.dropRate = ratePercent / 100; // パーセンテージを割合に変換
        console.log(`Recovery item drop rate set to ${ratePercent}%`);
    }

    // 現在のドロップ率を取得（パーセンテージ）
    getDropRate() {
        return this.dropRate * 100;
    }

    // 敵を倒した時にアイテムをドロップする可能性
    tryDropItem(x, y, enemyType) {
        // 赤鬼、青鬼、黒鬼のみドロップ対象
        if (!['red', 'blue', 'black'].includes(enemyType)) {
            return;
        }

        if (Math.random() < this.dropRate) {
            this.spawnRecoveryItem(x, y);
        }
    }

    spawnRecoveryItem(x, y) {
        const item = new RecoveryItem(this.game, x, y);
        this.items.push(item);
        console.log(`Recovery item spawned at (${x}, ${y})`);
    }

    update() {
        // アイテムの更新
        for (const item of this.items) {
            item.update();
        }

        // 削除フラグが立ったアイテムを除去
        this.items = this.items.filter(item => !item.shouldDelete);
    }

    draw(ctx, scrollX, scrollY) {
        for (const item of this.items) {
            item.draw(ctx, scrollX, scrollY);
        }
    }

    // デバッグ用：すべてのアイテムを削除
    clearAllItems() {
        this.items = [];
    }

    // デバッグ用：アイテム数を取得
    getItemCount() {
        return this.items.length;
    }

    // ドロップ率を設定
    setDropRate(rate) {
        this.dropRate = Math.max(0, Math.min(1, rate));
    }
}
