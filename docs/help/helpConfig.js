/**
 * 操作説明設定ファイル
 * ページ数や画像パスを簡単に変更できます
 */

export const helpConfig = {
    // 操作説明のページ数をここで変更
    totalPages: 10,
    
    // 各ページの画像パス（1920x1080pxの画像を想定）
    images: [
        'assets/help/help_01.png',  //ページ1:クイック操作説明
        'assets/help/help_02.png',  //ページ2:ゲーム概要
        'assets/help/help_03.png',  //ページ3:ゲームの流れ
        'assets/help/help_04.png',  //ページ4:UIの見方
        'assets/help/help_05.png',  //ページ5:基本操作
        'assets/help/help_06.png',  //ページ6:ダメージ残弾について
        'assets/help/help_07.png',  //ページ7:レベルアップについて
        'assets/help/help_08.png',  //ページ8:オトモについて
        'assets/help/help_09.png',  //ページ9:回復について
        'assets/help/help_10.png',  //ページ10:ステージ選択について
    ],
    
    // 各ページのタイトル（オプション）
    titles: [
        'クイック操作説明',
        'ゲーム概要',
        'ゲームの流れ',
        'UIの見方',
        '基本操作',
        'ダメージ残弾について',
        'レベルアップについて',
        'オトモについて',
        '回復について',
        'ステージ選択について',
    ],
    
    // 各ページの説明（オプション）
    descriptions: [
        'クイック操作説明',
        'ゲーム概要',
        'ゲームの流れ',
        'UIの見方',
        '基本操作',
        'ダメージ残弾について',
        'レベルアップについて',
        'オトモについて',
        '回復について',
        'ステージ選択について',
    ]
};

/**
 * 設定を更新する関数
 * @param {Object} newConfig - 新しい設定
 */
export function updateHelpConfig(newConfig) {
    Object.assign(helpConfig, newConfig);
}

/**
 * ページ数を変更する関数
 * @param {number} totalPages - 新しいページ数
 */
export function setTotalPages(totalPages) {
    helpConfig.totalPages = totalPages;
}

/**
 * 画像パスを追加する関数
 * @param {string} imagePath - 新しい画像パス
 * @param {string} title - ページタイトル（オプション）
 * @param {string} description - ページ説明（オプション）
 */
export function addImage(imagePath, title = '', description = '') {
    helpConfig.images.push(imagePath);
    helpConfig.titles.push(title);
    helpConfig.descriptions.push(description);
    helpConfig.totalPages = helpConfig.images.length;
}

/**
 * 画像パスを削除する関数
 * @param {number} index - 削除する画像のインデックス
 */
export function removeImage(index) {
    if (index >= 0 && index < helpConfig.images.length) {
        helpConfig.images.splice(index, 1);
        helpConfig.titles.splice(index, 1);
        helpConfig.descriptions.splice(index, 1);
        helpConfig.totalPages = helpConfig.images.length;
    }
}

/**
 * 設定をリセットする関数
 */
export function resetHelpConfig() {
    helpConfig.totalPages = 3;
    helpConfig.images = [
        'assets/help/help_01.png',
        'assets/help/help_02.png',
        'assets/help/help_03.png'
    ];
    helpConfig.titles = [
        '基本操作',
        '戦闘システム',
        'ボス戦'
    ];
    helpConfig.descriptions = [
        'プレイヤーの移動と基本操作について',
        '攻撃方法と戦闘システムについて',
        'ボス戦の攻略方法について'
    ];
}
