/**
 * ボスの討伐状況を管理するマネージャークラス
 * 単一責任: ボスの討伐状況の管理とローカルストレージでの永続化
 */
export class BossProgressManager {
    constructor() {
        this.storageKey = 'bossProgress';
        this.bossData = this.loadBossProgress();
        this.initializeBossData();
    }

    /**
     * ボスデータの初期化
     */
    initializeBossData() {
        const defaultBosses = {
            1: { name: '砲鬼', defeated: false, unlocked: true, icon: 'cannon_oni_select_button_UI.png' },
            2: { name: 'バイク鬼', defeated: false, unlocked: true, icon: 'bike_oni_select_button_UI.png' },
            3: { name: 'ワープ鬼', defeated: false, unlocked: true, icon: 'warp_oni_select_button_UI.png' },
            4: { name: '風神・雷神', defeated: false, unlocked: true, icon: 'fuzin_raizin_select_button_UI.png' },
            5: { name: 'ラスボス', defeated: false, unlocked: false, icon: null }
        };

        // 既存データとマージ
        for (const [bossId, defaultData] of Object.entries(defaultBosses)) {
            if (!this.bossData[bossId]) {
                this.bossData[bossId] = { ...defaultData };
            } else {
                // 既存データを保持しつつ、新しいフィールドを追加
                this.bossData[bossId] = { ...defaultData, ...this.bossData[bossId] };
            }
        }

        // 最終ステージ（ラスボス）の解放条件をチェック
        this.checkFinalStageUnlock();

        this.saveBossProgress();
    }

    /**
     * ボス討伐の記録
     * @param {number} bossId - ボスID
     * @param {number} score - 獲得スコア
     * @param {number} time - クリア時間（秒）
     */
    recordBossDefeat(bossId, score = 0, time = 0) {
        if (this.bossData[bossId]) {
            this.bossData[bossId].defeated = true;
            this.bossData[bossId].defeatedAt = new Date().toISOString();
            this.bossData[bossId].score = score;
            this.bossData[bossId].clearTime = time;
            
            // 次のボスをアンロック
            this.unlockNextBoss(bossId);
            
            this.saveBossProgress();
            console.log(`ボス${bossId}（${this.bossData[bossId].name}）の討伐を記録しました`);
        }
    }

    /**
     * 次のボスをアンロック
     * @param {number} defeatedBossId - 倒したボスのID
     */
    unlockNextBoss(defeatedBossId) {
        const nextBossId = defeatedBossId + 1;
        if (this.bossData[nextBossId]) {
            this.bossData[nextBossId].unlocked = true;
            console.log(`ボス${nextBossId}（${this.bossData[nextBossId].name}）をアンロックしました`);
        }
        
        // 最終ステージの解放条件をチェック
        this.checkFinalStageUnlock();
    }

    /**
     * 最終ステージ（ラスボス）の解放条件をチェック
     * 4体のボスすべてを倒すと解放される
     */
    checkFinalStageUnlock() {
        const boss1Defeated = this.bossData[1]?.defeated || false;
        const boss2Defeated = this.bossData[2]?.defeated || false;
        const boss3Defeated = this.bossData[3]?.defeated || false;
        const boss4Defeated = this.bossData[4]?.defeated || false;
        
        // 4体のボスすべてを倒した場合、最終ステージを解放
        if (boss1Defeated && boss2Defeated && boss3Defeated && boss4Defeated) {
            if (this.bossData[5]) {
                this.bossData[5].unlocked = true;
                console.log('最終ステージ（ラスボス）が解放されました！');
            }
        }
    }

    /**
     * ボスが討伐済みかチェック
     * @param {number} bossId - ボスID
     * @returns {boolean} 討伐済みかどうか
     */
    isBossDefeated(bossId) {
        return this.bossData[bossId]?.defeated || false;
    }

    /**
     * ボスが選択可能かチェック（討伐済みでも選択可能）
     * @param {number} bossId - ボスID
     * @returns {boolean} 選択可能かどうか
     */
    isBossSelectable(bossId) {
        return this.bossData[bossId]?.unlocked || false;
    }

    /**
     * ボスがアンロックされているかチェック
     * @param {number} bossId - ボスID
     * @returns {boolean} アンロックされているかどうか
     */
    isBossUnlocked(bossId) {
        return this.bossData[bossId]?.unlocked || false;
    }

    /**
     * 特定のボスを強制的にアンロック
     * @param {number} bossId - ボスID
     */
    forceUnlockBoss(bossId) {
        if (this.bossData[bossId]) {
            this.bossData[bossId].unlocked = true;
            this.saveBossProgress();
            console.log(`ボス${bossId}（${this.bossData[bossId].name}）を強制アンロックしました`);
            
            // 最終ステージの解放条件をチェック
            this.checkFinalStageUnlock();
        }
    }

    /**
     * 全ボスの討伐状況を取得
     * @returns {Object} 全ボスのデータ
     */
    getAllBossData() {
        return { ...this.bossData };
    }

    /**
     * 討伐済みボスの数を取得
     * @returns {number} 討伐済みボスの数
     */
    getDefeatedBossCount() {
        return Object.values(this.bossData).filter(boss => boss.defeated).length;
    }

    /**
     * アンロック済みボスの数を取得
     * @returns {number} アンロック済みボスの数
     */
    getUnlockedBossCount() {
        return Object.values(this.bossData).filter(boss => boss.unlocked).length;
    }

    /**
     * お供の開放条件をチェック
     * @returns {Object} お供の開放状況
     */
    getOtomoUnlockStatus() {
        const defeatedCount = this.getDefeatedBossCount();
        return {
            dog: defeatedCount >= 1,      // 1体目のボス討伐で犬を開放
            monkey: defeatedCount >= 2,   // 2体目のボス討伐で猿を開放
            bird: defeatedCount >= 3,     // 3体目のボス討伐で雉を開放
            allUnlocked: defeatedCount >= 3
        };
    }

    /**
     * ローカルストレージからボス進捗を読み込み
     * @returns {Object} ボス進捗データ
     */
    loadBossProgress() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('ボス進捗の読み込みに失敗しました:', error);
            return {};
        }
    }

    /**
     * ローカルストレージにボス進捗を保存
     */
    saveBossProgress() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.bossData));
        } catch (error) {
            console.error('ボス進捗の保存に失敗しました:', error);
        }
    }

    /**
     * ボス進捗をリセット
     */
    resetBossProgress() {
        this.bossData = {};
        this.initializeBossData();
        this.saveBossProgress();
        console.log('ボス進捗をリセットしました');
    }

    /**
     * 特定のボスの進捗をリセット
     * @param {number} bossId - ボスID
     */
    resetBossProgressById(bossId) {
        if (this.bossData[bossId]) {
            this.bossData[bossId].defeated = false;
            this.bossData[bossId].defeatedAt = null;
            this.bossData[bossId].score = 0;
            this.bossData[bossId].clearTime = 0;
            this.saveBossProgress();
            console.log(`ボス${bossId}の進捗をリセットしました`);
            
            // 最終ステージの解放条件をチェック
            this.checkFinalStageUnlock();
        }
    }
}
