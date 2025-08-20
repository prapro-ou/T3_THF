# 操作説明モジュール

このフォルダには、操作説明画面の管理に必要なファイルが含まれています。

## ファイル構成

```
docs/help/
├── HelpManager.js      # 操作説明の管理クラス
├── helpConfig.js       # 設定ファイル
├── help.css           # スタイルシート
├── index.js           # エントリーポイント
├── README.md          # このファイル
└── assets/help/       # 画像ファイル用フォルダ
    └── README.md      # 画像フォルダの説明
```

## 使用方法

### 1. 基本的な使用
```javascript
import { HelpManager } from './help/index.js';

const helpManager = new HelpManager();
helpManager.show();  // 操作説明を表示
helpManager.hide();  // 操作説明を非表示
```

### 2. 設定の変更
```javascript
import { helpConfig, setTotalPages, addImage } from './help/index.js';

// ページ数を変更
setTotalPages(5);

// 画像を追加
addImage('assets/help/help_04.png', '新しいページ', '説明文');
```

### 3. 画像の配置
- `docs/assets/help/`フォルダに画像ファイルを配置
- 推奨サイズ: 1920px × 1080px
- ファイル名: `help_01.png`、`help_02.png`など

## 機能

- **ページング**: 左右矢印でページ移動
- **キーボード操作**: 矢印キー、Escapeキー対応
- **レスポンシブ**: 画面サイズに応じた表示調整
- **設定管理**: ページ数や画像パスの簡単変更

## カスタマイズ

### ページ数の変更
`helpConfig.js`の`totalPages`を変更

### 画像の追加・削除
`helpConfig.js`の`images`配列を編集

### スタイルの変更
`help.css`を編集してデザインをカスタマイズ
