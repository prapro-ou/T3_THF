﻿# T3_THF Game

画像,SE,BGMなど素材は assetsフォルダに追加をお願いします

## 🎮 ゲーム概要

桃太郎を操作して鬼を倒すアクションゲームです。WASDキーで移動し、マウスクリックで攻撃します。時間内にできるだけ多くの鬼を倒してスコアを稼ぎ、ボス鬼を倒してクリアしましょう！

## デモ　

https://prapro-ou.github.io/T3_THF/

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
│   │   ├── BossOni.js      # ボス鬼（基本）
│   │   ├── BossOni1.js     # 四天王1：でかいボス
│   │   ├── BossOni2.js     # 四天王2：はやいボス
│   │   ├── BossOni3.js     # 四天王3：ワープボス
│   │   ├── BossOni4.js     # 四天王4：2体1組ボス
│   │   ├── BossOni5.js     # ラスボス
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
    ├── UI/                 # UI素材
    │   └── title1.png      # タイトル画面背景
    ├── characters/         # キャラクター素材
    │   ├── players/        # プレイヤー素材
    │   │   └── momotaro/   # 桃太郎素材
    │   │       ├── momotaro_spritesheet.png
    │   │       └── momotaro_spritesheet.json
    │   └── oni/            # 鬼素材
    │       ├── red_oni_script/    # 赤鬼素材
    │       ├── blue_oni_script/   # 青鬼素材
    │       ├── black_oni_script/  # 黒鬼素材
    │       ├── warp_oni/          # ワープ鬼素材
    │       ├── cannon_oni/        # 大砲鬼素材
    │       ├── bike_oni/          # バイク鬼素材
    │       └── fuzin_raizin/      # 風神雷神素材
    └── effects/            # エフェクト素材
        └── boss_attack/    # ボス攻撃エフェクト
```

## 🎯 ゲーム機能

### 基本操作
- **WASDキー**: プレイヤー移動
- **マウスクリック**: 攻撃（弾薬消費）
- **Pキー**: ポーズ/再開
- **Hキー**: ヘルプ表示（ポーズ中のみ）
- **1-3キー**: お供のモード切替
- **F12キー**: 開発者ツール（ゲーム中のみ）

### ゲームシステム
- **フェーズ制**: 通常フェーズ → ボスフェーズ
- **ボス出現まで**: デフォルト3分（開発者ツールで変更可能）
- **ボス攻略時間**: デフォルト2分（開発者ツールで変更可能）
- **スコアシステム**: 敵を倒すとスコア獲得
- **弾薬システム**: 攻撃に弾薬が必要、時間で回復
- **パーティクルエフェクト**: 攻撃や敵の死亡時の視覚効果
- **アニメーション**: スプライトシートによるキャラクターアニメーション
- **レベルアップシステム**: お供のレベルアップで能力向上

### 敵の種類
#### 通常鬼
- **赤鬼**: HP 20, 標準速度
- **青鬼**: HP 40, 低速、大きい
- **黒鬼**: HP 60, 高速、大きい

#### ボス鬼
- **四天王1（でかいボス）**: HP 600, 弾を撃つ
- **四天王2（はやいボス）**: HP 350, 急加速と停止を繰り返す
- **四天王3（ワープボス）**: HP 400, ワープで逃げ、鬼を呼ぶ
- **四天王4（2体1組ボス）**: HP 400, 2体で異なる能力
- **ラスボス**: HP 500, 四天王の力を併せ持つ

## 🛠️ 技術仕様

- **言語**: JavaScript 
- **描画**: HTML5 Canvas
- **アーキテクチャ**: モジュラー設計
- **設計原則**: オブジェクト指向の三大要素 + 単一責任の原則
- **改行コード**: LF (Unix形式)
- **開発者ツール**: リアルタイムパラメータ調整機能

## 🔧 拡張性

### 新しい敵の追加
1. `entities/enemies/`に新しい敵クラスを作成
2. `Enemy`クラスを継承
3. `entities/enemies/index.js`にエクスポートを追加
4. `EnemyManager`で生成対象に追加

### 新しいボスの追加
1. `entities/enemies/`に新しいボスクラスを作成
2. `BossOni`クラスを継承
3. `EnemyManager.spawnBoss()`で生成対象に追加

### 新しい機能の追加
- 各マネージャーは独立しているため、新しい機能を追加しやすい
- 基底クラスを活用して共通機能を継承
- インターフェースを統一して多態性を活用

## 🎮 開発者ツール

F12キーで開発者ツールを開き、以下のパラメータをリアルタイムで調整できます：

### 鬼の設定
- 出現頻度（フレーム）
- 最大敵数
- 各鬼のHP
- 鬼の基本速度
- ボス出現時間（秒）
- ボス攻略時間（秒）

### プレイヤーの設定
- プレイヤーHP
- プレイヤー速度
- 最大弾数
- 弾回復時間（秒）
