# T3_THF Game

## 🎮 ゲーム概要

桃太郎を操作して鬼を倒すアクションゲームです。WASDキーで移動し、マウスクリックで攻撃します。時間内にできるだけ多くの鬼を倒してスコアを稼ぎましょう！

## 📁 ファイル構造

```
docs/
├── index.html              # メインHTMLファイル
├── main.js                 # エントリーポイント
├── style.css               # スタイルシート
├── README.md               # このファイル
├── .gitattributes          # Git設定ファイル
├── core/                   # ゲームの核となるクラス
│   ├── Game.js             # メインゲームクラス
│   ├── GameState.js        # ゲーム状態管理
│   └── Timer.js            # タイマー管理
├── managers/               # 各種マネージャークラス
│   ├── InputManager.js     # 入力管理
│   ├── RenderManager.js    # 描画管理
│   ├── CollisionManager.js # 衝突判定
│   ├── EnemyManager.js     # 敵管理
│   ├── ParticleManager.js  # パーティクル管理
│   ├── UIManager.js        # UI管理
│   ├── PauseManager.js     # ポーズ管理
│   ├── AttackManager.js    # 攻撃管理
│   ├── CameraManager.js    # カメラ管理
│   ├── AmmoManager.js      # 弾薬管理
│   └── ProjectileManager.js # 弾丸管理
├── entities/               # ゲームエンティティ
│   ├── base/               # 基底クラス
│   │   ├── GameEntity.js   # ゲームエンティティ基底クラス
│   │   ├── Character.js    # キャラクター基底クラス
│   │   ├── MovableEntity.js # 移動可能エンティティ基底クラス
│   │   └── Enemy.js        # 敵基底クラス
│   ├── enemies/            # 敵クラス
│   │   ├── RedOni.js       # 赤鬼
│   │   ├── BlueOni.js      # 青鬼
│   │   ├── BlackOni.js     # 黒鬼
│   │   ├── BossOni.js      # ボス鬼
│   │   └── index.js        # 敵クラスエクスポート
│   ├── Player.js           # プレイヤークラス
│   ├── Otomo.js            # お供クラス
│   ├── Projectile.js       # 弾丸クラス
│   └── Particle.js         # パーティクルクラス
├── components/             # コンポーネントクラス
│   ├── PlayerController.js # プレイヤー制御
│   ├── PlayerRenderer.js   # プレイヤー描画
│   ├── EnemyRenderer.js    # 敵描画
│   └── HealthBar.js        # HPバー
├── utils/                  # ユーティリティクラス
│   ├── Sprite.js           # スプライト描画
│   ├── SpriteSheet.js      # スプライトシート管理
│   └── Utils.js            # 汎用ユーティリティ
└── assets/                 # 画像・音声ファイル
    ├── momotaro_spritesheet.png    # 桃太郎スプライトシート
    ├── momotaro_spritesheet.json   # 桃太郎スプライト設定
    ├── red_oni_spritesheet.png     # 赤鬼スプライトシート
    └── red_oni_spritesheet.json    # 赤鬼スプライト設定
```

## 🎯 ゲーム機能

### 基本操作
- **WASDキー**: プレイヤー移動
- **マウスクリック**: 攻撃（弾薬消費）
- **Pキー**: ポーズ/再開
- **Hキー**: ヘルプ表示（ポーズ中のみ）
- **1-3キー**: お供のモード切替

### ゲームシステム
- **時間制限**: 5分
- **スコアシステム**: 敵を倒すとスコア獲得
- **弾薬システム**: 攻撃に弾薬が必要、時間で回復
- **パーティクルエフェクト**: 攻撃や敵の死亡時の視覚効果
- **アニメーション**: スプライトシートによるキャラクターアニメーション

### 敵の種類
- **赤鬼**: HP 20, 標準速度
- **青鬼**: HP 40, 低速、大きい
- **黒鬼**: HP 60, 高速、大きい
- **ボス鬼**: HP 300, 非常に大きい

## 🛠️ 技術仕様

- **言語**: JavaScript 
- **描画**: HTML5 Canvas
- **アーキテクチャ**: モジュラー設計
- **設計原則**: オブジェクト指向の三大要素 + 単一責任の原則
- **改行コード**: LF (Unix形式)


## 🔧 拡張性

### 新しい敵の追加
1. `entities/enemies/`に新しい敵クラスを作成
2. `Enemy`クラスを継承
3. `entities/enemies/index.js`にエクスポートを追加
4. `EnemyManager`で生成対象に追加

### 新しい機能の追加
- 各マネージャーは独立しているため、新しい機能を追加しやすい
- 基底クラスを活用して共通機能を継承
- インターフェースを統一して多態性を活用

