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
            1: { 
                name: '砲鬼', 
                defeated: false, 
                unlocked: true, 
                icon: 'cannon_oni_select_button_UI.png',
                shadowIcon: 'cannon_oni_select_button_shadow_UI.png',
                shadowIcon2: 'cannon_oni_select_button_shadow_UI_2.png'
            },
            2: { 
                name: 'バイク鬼', 
                defeated: false, 
                unlocked: true, 
                icon: 'bike_oni_select_button_UI.png',
                shadowIcon: 'bike_oni_select_button_shadow_UI.png',
                shadowIcon2: 'bike_oni_select_button_shadow_UI_2.png'
            },
            3: { 
                name: 'ワープ鬼', 
                defeated: false, 
                unlocked: true, 
                icon: 'warp_oni_select_button_UI.png',
                shadowIcon: 'warp_oni_select_button_shadow_UI.png',
                shadowIcon2: 'warp_oni_select_button_shadow_UI_2.png'
            },
            4: { 
                name: '風神・雷神', 
                defeated: false, 
                unlocked: true, 
                icon: 'fuzin_raizin_select_button_UI.png',
                shadowIcon: 'fuzin_raizin_select_button_shadow_UI.png',
                shadowIcon2: 'fuzin_raizin_select_button_shadow_UI_2.png'
            },
            5: { 
                name: 'ラスボス', 
                defeated: false, 
                unlocked: false, 
                icon: 'last_stage_select_button_UI.png',
                shadowIcon: 'last_stage_select_button_shadow_UI.png',
                shadowIcon2: 'last_stage_select_button_shadow_UI_2.png'
            },
            7: { 
                name: 'ラストステージ', 
                defeated: false, 
                unlocked: false, 
                icon: 'last_stage_select_button_UI.png',
                shadowIcon: 'last_stage_select_button_shadow_UI.png',
                shadowIcon2: 'last_stage_select_button_shadow_UI_2.png'
            }
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
            
            // 即座にUI更新を試行（ボス選択画面が表示されている場合）
            this.updateUIImmediately();
        }
    }

    /**
     * 次のボスをアンロック
     * @param {number} defeatedBossId - 倒したボスのID
     */
    unlockNextBoss(defeatedBossId) {
        // 次のボスをアンロックする処理を削除
        // 4体のボスは最初からアンロック済み、ラスボスは4体クリア後にアンロック
        
        // 最終ステージの解放条件をチェック
        this.checkFinalStageUnlock();
    }

    /**
     * 最終ステージ（ラスボス）の解放条件をチェック
     * 4体のボスすべてを倒すとラスボスがアンロックされる
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
            if (this.bossData[7]) {
                this.bossData[7].unlocked = true;
                console.log('ラストステージ（全ボス同時出現）が解放されました！');
            }
            
            // UIの更新を促すイベントを発火
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('bossProgressUpdated'));
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
     * ボスの表示用画像を取得
     * @param {number} bossId - ボスID
     * @returns {string} 画像パス
     */
    getBossDisplayImage(bossId) {
        const bossData = this.bossData[bossId];
        if (!bossData) return '';
        
        if (bossId === 5 || bossId === 7) {
            // ラスボスまたはラストステージの場合の特別な処理
            const boss1Defeated = this.bossData[1]?.defeated || false;
            const boss2Defeated = this.bossData[2]?.defeated || false;
            const boss3Defeated = this.bossData[3]?.defeated || false;
            const boss4Defeated = this.bossData[4]?.defeated || false;
            
            if (boss1Defeated && boss2Defeated && boss3Defeated && boss4Defeated) {
                // 4体のボスすべてを倒した場合は通常画像
                return bossData.icon;
            } else {
                // まだ解放されていない場合は2番目のシルエット画像
                return bossData.shadowIcon2;
            }
        } else if (bossId === 1 || bossId === 2 || bossId === 3 || bossId === 4) {
            // boss1〜4（砲鬼、バイク鬼、ワープ鬼、風神・雷神）の場合は討伐前でも通常画像を表示
            if (bossData.unlocked) {
                // アンロック済みなら討伐状況に関係なく通常画像
                return bossData.icon;
            } else {
                // 未開放の場合は2番目のシルエット画像
                return bossData.shadowIcon2;
            }
        } else {
            // その他のボスの処理（将来的な拡張用）
            if (bossData.defeated) {
                // 討伐済みの場合は通常の画像
                return bossData.icon;
            } else if (bossData.unlocked) {
                // アンロック済みだが未討伐の場合はシルエット画像
                return bossData.shadowIcon;
            } else {
                // 未開放の場合は2番目のシルエット画像
                return bossData.shadowIcon2;
            }
        }
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

    /**
     * 特定のボスを強制討伐済みにする
     * @param {number} bossId - ボスID
     */
    forceDefeatBoss(bossId) {
        if (this.bossData[bossId]) {
            this.bossData[bossId].defeated = true;
            this.bossData[bossId].defeatedAt = new Date().toISOString();
            this.bossData[bossId].score = 1000;
            this.bossData[bossId].clearTime = 60;
            this.saveBossProgress();
            console.log(`ボス${bossId}を強制討伐済みにしました`);
            
            // 最終ステージの解放条件をチェック
            this.checkFinalStageUnlock();
        }
    }

    /**
     * 即座にUI更新を試行
     * ボス選択画面が表示されている場合は即座に更新
     */
    updateUIImmediately() {
        // ボス選択画面が表示されている場合のみ即座にUI更新
        if (typeof window !== 'undefined' && window.isBossSelectScreenVisible && window.updateBossCardProgress) {
            try {
                // 即座にUI更新を実行
                window.updateBossCardProgress();
                console.log('ボス選択画面表示中: 即座にUI更新を実行しました');
            } catch (error) {
                console.warn('即座のUI更新に失敗しました:', error);
            }
        }
        
        // イベントも発火（遅延更新用）
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('bossProgressUpdated'));
        }
    }
}
