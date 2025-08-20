# 操作説明用画像フォルダ

このフォルダには、操作説明画面で表示する画像ファイルを配置してください。

## 画像の仕様
- **サイズ**: 1920px × 1080px（推奨）
- **形式**: PNG、JPG、JPEG
- **ファイル名**: `help_01.png`、`help_02.png`、`help_03.png` など

## ファイル構成例
```
assets/help/
├── help_01.png    # ページ1: 基本操作
├── help_02.png    # ページ2: 戦闘システム
├── help_03.png    # ページ3: ボス戦
└── README.md      # このファイル
```

## 設定方法
`docs/main.js`の`helpConfig`オブジェクトで画像パスとページ数を設定：

```javascript
const helpConfig = {
    totalPages: 3,  // ページ数を変更
    images: [
        'assets/help/help_01.png',
        'assets/help/help_02.png',
        'assets/help/help_03.png'
    ]
};
```

## 注意事項
- 画像ファイルは必ずこのフォルダ内に配置してください
- ファイル名は連番で統一してください
- 画像サイズが大きすぎる場合は、読み込みに時間がかかる可能性があります
