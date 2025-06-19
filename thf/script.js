document.addEventListener('DOMContentLoaded', () => {
    // HTML要素への参照を取得 (キャメルケースで変数名を定義)
    const gameCanvas = document.getElementById('gameCanvas');
    const ctx = gameCanvas.getContext('2d');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const livesDisplay = document.getElementById('livesDisplay'); // ライフ表示要素を追加
    const gameOverMessage = document.getElementById('gameOverMessage');
    const restartButton = document.getElementById('restartButton');

    // ゲームの状態を管理する変数
    let score = 0; // 現在のスコア
    let enemies = []; // 敵オブジェクトを格納する配列
    let particles = []; // パーティクルオブジェクトを格納する配列
    let gameFrame = 0; // ゲームのフレーム数
    let animationId; // requestAnimationFrameのIDを保存
    let gameOver = false; // ゲームオーバー状態を管理するフラグ

    // 敵の出現設定
    const INITIAL_ENEMY_SPAWN_INTERVAL = 90; // 初期敵出現フレーム間隔
    const MIN_ENEMY_SPAWN_INTERVAL = 30; // 最小敵出現フレーム間隔
    const SPAWN_INTERVAL_DECREASE_RATE = 2; // 出現間隔の減少量 (小さくするほど頻繁に出る)
    const SPAWN_INTERVAL_DECREASE_FREQUENCY = 300; // 出現間隔を減少させるフレーム頻度 (このフレーム数ごとに難易度アップ)
    let currentEnemySpawnInterval = INITIAL_ENEMY_SPAWN_INTERVAL; // 現在の敵出現間隔

    const ENEMY_BASE_SPEED = 2; // 敵の基本移動速度

    const PLAYER_SPEED = 5; // プレイヤーの移動速度
    const INITIAL_PLAYER_LIVES = 3; // プレイヤーの初期ライフ数
    let keys = {}; // 押されているキーを追跡するオブジェクト

    // プレイヤーオブジェクトのクラス定義
    class Player {
        constructor() {
            this.width = 80;
            this.height = 80;
            // プレイヤーの初期位置 (キャンバスの中央下部)
            this.x = (gameCanvas.width - this.width) / 2;
            this.y = gameCanvas.height - this.height - 20; // 下から少し上に配置
            this.color = '#00f'; // プレイヤーの色を青に設定
            this.lives = INITIAL_PLAYER_LIVES; // プレイヤーのライフ (追加)
        }

        // キー入力に基づいてプレイヤーの位置を更新するメソッド
        update() {
            if (keys['w']) { // 上に移動
                this.y -= PLAYER_SPEED;
            }
            if (keys['s']) { // 下に移動
                this.y += PLAYER_SPEED;
            }
            if (keys['a']) { // 左に移動
                this.x -= PLAYER_SPEED;
            }
            if (keys['d']) { // 右に移動
                this.x += PLAYER_SPEED;
            }

            // プレイヤーをキャンバスの境界内に留める
            if (this.x < 0) this.x = 0;
            if (this.x + this.width > gameCanvas.width) this.x = gameCanvas.width - this.width;
            if (this.y < 0) this.y = 0;
            if (this.y + this.height > gameCanvas.height) this.y = gameCanvas.height - this.height;
        }

        // プレイヤーを描画するメソッド
        draw() {
            ctx.fillStyle = this.color; // プレイヤーの塗りつぶし色を設定
            ctx.fillRect(this.x, this.y, this.width, this.height); // 四角形を描画
            ctx.strokeStyle = '#fff'; // プレイヤーの枠線の色を白に設定
            ctx.strokeRect(this.x, this.y, this.width, this.height); // 枠線を描画
        }
    }

    // 敵オブジェクトのクラス定義
    class Enemy {
        constructor() {
            this.width = 50;
            this.height = 50;
            this.markedForDeletion = false;
            this.color = `hsl(${Math.random() * 360}, 70%, 50%)`; // 敵のランダムな色
            this.speed = ENEMY_BASE_SPEED + Math.random() * 1; // 速度にランダムなばらつきを追加

            // 出現する辺を決定 (0: 上, 1: 右, 2: 下, 3: 左)
            const spawnEdge = Math.floor(Math.random() * 4);

            // 初期位置を設定
            switch (spawnEdge) {
                case 0: // 上
                    this.x = Math.random() * (gameCanvas.width - this.width);
                    this.y = -this.height;
                    break;
                case 1: // 右
                    this.x = gameCanvas.width;
                    this.y = Math.random() * (gameCanvas.height - this.height);
                    break;
                case 2: // 下
                    this.x = Math.random() * (gameCanvas.width - this.width);
                    this.y = gameCanvas.height;
                    break;
                case 3: // 左
                    this.x = -this.width;
                    this.y = Math.random() * (gameCanvas.height - this.height);
                    break;
            }
            // 初期移動方向はupdateメソッドでプレイヤーを追尾するため、ここでは設定しない
            this.dx = 0;
            this.dy = 0;
        }

        // 敵の状態を更新するメソッド (プレイヤーを追尾するように修正)
        update() {
            // 敵とプレイヤーの間の差分を計算
            const deltaX = player.x - this.x;
            const deltaY = player.y - this.y;

            // 敵とプレイヤーの間の距離を計算
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            // 距離が0より大きい場合のみ移動方向を計算して正規化
            if (distance > 0) {
                this.dx = (deltaX / distance) * this.speed;
                this.dy = (deltaY / distance) * this.speed;
            } else {
                // 距離が0の場合（敵がプレイヤーと同じ位置にいる場合）は移動しない
                this.dx = 0;
                this.dy = 0;
            }

            // 敵の位置を更新
            this.x += this.dx;
            this.y += this.dy;

            // 敵が画面から十分に外に出たら削除マークを付ける
            // 追尾中は画面外に出にくいが、念のため残す
            if (this.x < -this.width * 2 || this.x > gameCanvas.width + this.width * 2 ||
                this.y < -this.height * 2 || this.y > gameCanvas.height + this.height * 2) {
                this.markedForDeletion = true;
            }
        }

        // 敵を描画するメソッド
        draw() {
            ctx.fillStyle = this.color; // 敵の塗りつぶし色を設定
            ctx.fillRect(this.x, this.y, this.width, this.height); // 四角形を描画
            ctx.strokeStyle = '#fff'; // 敵の枠線の色を白に設定
            ctx.strokeRect(this.x, this.y, this.width, this.height); // 枠線を描画
        }
    }

    // パーティクルオブジェクトのクラス定義
    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 7 + 3; // パーティクルのサイズ (3～10)
            this.speedX = Math.random() * 6 - 3; // X方向の速度 (-3～3)
            this.speedY = Math.random() * 6 - 3; // Y方向の速度 (-3～3)
            this.color = color; // 親の敵の色を継承
            this.life = 30; // パーティクルの寿命 (フレーム数)
            this.markedForDeletion = false;
        }

        // パーティクルの状態を更新するメソッド
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.life--; // 寿命を減らす
            if (this.life <= 0) {
                this.markedForDeletion = true;
            }
        }

        // パーティクルを描画するメソッド
        draw() {
            ctx.fillStyle = this.color;
            ctx.globalAlpha = this.life / 30; // 寿命に応じて透明度を変化させる
            ctx.fillRect(this.x, this.y, this.size, this.size); // 四角形を描画
            ctx.globalAlpha = 1; // 透明度をリセット
        }
    }

    // プレイヤーインスタンスの生成
    const player = new Player();

    // ゲームを初期化する関数
    function initializeGame() {
        score = 0;
        enemies = [];
        particles = []; // パーティクル配列をリセット
        gameFrame = 0;
        gameOver = false;
        scoreDisplay.textContent = `スコア: ${score}`;
        player.lives = INITIAL_PLAYER_LIVES; // プレイヤーのライフを初期値にリセット
        livesDisplay.textContent = `ライフ: ${player.lives}`; // ライフ表示を更新
        gameOverMessage.classList.add('hidden'); // ゲームオーバーメッセージを非表示にする
        // 既存のアニメーションループがあれば停止
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        // キーの状態をリセット
        keys = {};
        // プレイヤーの位置をリセット
        player.x = (gameCanvas.width - player.width) / 2;
        player.y = gameCanvas.height - player.height - 20;
        // 敵の出現間隔を初期値にリセット
        currentEnemySpawnInterval = INITIAL_ENEMY_SPAWN_INTERVAL; 
        animate(); // ゲームループを開始
    }

    // ゲームのメインループ
    function animate() {
        if (gameOver) {
            cancelAnimationFrame(animationId); // ゲームオーバーならアニメーションを停止
            gameOverMessage.classList.remove('hidden'); // ゲームオーバーメッセージを表示
            return;
        }

        ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height); // 前のフレームの描画をクリア

        // プレイヤーを更新し、描画
        player.update();
        player.draw();

        // 時間経過で敵の出現間隔を短くする (難易度上昇)
        // gameFrameがSPAWN_INTERVAL_DECREASE_FREQUENCYの倍数になったら間隔を減少させる
        if (gameFrame > 0 && gameFrame % SPAWN_INTERVAL_DECREASE_FREQUENCY === 0) {
            currentEnemySpawnInterval = Math.max(MIN_ENEMY_SPAWN_INTERVAL, currentEnemySpawnInterval - SPAWN_INTERVAL_DECREASE_RATE);
        }

        // 敵の生成にランダム性を加える
        // currentEnemySpawnIntervalの前後20フレームの範囲でランダムな間隔にする (ただし1より小さくならないように制限)
        const actualSpawnInterval = Math.max(1, Math.floor(currentEnemySpawnInterval + (Math.random() * 40 - 20))); 
        if (gameFrame % actualSpawnInterval === 0) {
            spawnEnemy();
        }

        // 各敵オブジェクトを更新し、描画、衝突判定
        // 衝突した敵を削除するための新しい配列
        const enemiesToKeep = [];
        enemies.forEach(enemy => {
            enemy.update();
            enemy.draw();

            // 敵とプレイヤーの衝突判定 (四角形同士の衝突)
            if (enemy.x < player.x + player.width &&
                enemy.x + enemy.width > player.x &&
                enemy.y < player.y + player.height &&
                enemy.y + enemy.height > player.y) {
                
                // 衝突した場合、ライフを減らす
                if (!enemy.markedForDeletion) { // 既に衝突済みでない場合のみ処理
                    player.lives--;
                    livesDisplay.textContent = `ライフ: ${player.lives}`; // ライフ表示を更新
                    enemy.markedForDeletion = true; // 敵を削除対象にする
                    
                    // 衝突した敵の場所にパーティクルを生成
                    for (let p = 0; p < 15; p++) {
                        particles.push(new Particle(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color));
                    }
                }
            }
            // 削除マークがついていない敵のみを新しい配列に追加
            if (!enemy.markedForDeletion) {
                enemiesToKeep.push(enemy);
            }
        });
        enemies = enemiesToKeep; // 衝突した敵を配列から除外

        // ライフが0以下になったらゲームオーバー
        if (player.lives <= 0) {
            gameOver = true;
        }

        // パーティクルを更新し、描画
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });

        // 削除マークがtrueのパーティクルを配列から除外
        particles = particles.filter(particle => !particle.markedForDeletion);


        gameFrame++; // フレーム数をインクリメント
        animationId = requestAnimationFrame(animate); // 次のフレームの描画を要求
    }

    // 新しい敵を生成してenemies配列に追加する関数
    function spawnEnemy() {
        enemies.push(new Enemy());
    }

    // キャンバスへのクリックイベントリスナー (敵を倒す)
    gameCanvas.addEventListener('click', (event) => {
        if (gameOver) return; // ゲームオーバー中はクリックを無効にする

        // クリックされた位置のキャンバス内座標を計算
        const mouseX = event.clientX - gameCanvas.getBoundingClientRect().left;
        const mouseY = event.clientY - gameCanvas.getBoundingClientRect().top;

        // 新しい配列を作成し、クリックされた敵を除外しながらスコアを更新
        const newEnemies = [];
        let hit = false; // 敵に当たったかどうかのフラグ
        // enemies配列を逆順に処理することで、手前にいる敵から判定する
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            // クリック位置が敵の矩形範囲内にあるか判定 かつ 既に他の敵に当たっていない場合
            if (mouseX > enemy.x && mouseX < enemy.x + enemy.width &&
                mouseY > enemy.y && mouseY < enemy.y + enemy.height && !hit) { 
                
                enemy.markedForDeletion = true; // 敵を削除対象にする
                score += 10; // スコアを加算
                scoreDisplay.textContent = `スコア: ${score}`; // スコア表示を更新
                hit = true; // 敵に当たったことをマーク

                // 敵を倒したときにパーティクルを生成
                for (let p = 0; p < 15; p++) { // 15個のパーティクルを生成
                    particles.push(new Particle(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color));
                }
            } else {
                newEnemies.unshift(enemy); // 当たらなかった敵は新しい配列の先頭に追加 (元の順序を維持)
            }
        }
        enemies = newEnemies; // 更新された敵配列を適用
    });

    // Keydownイベントリスナー (プレイヤー移動用)
    window.addEventListener('keydown', (e) => {
        // キーを小文字に変換して大文字・小文字を区別しないようにする
        keys[e.key.toLowerCase()] = true; 
    });

    // Keyupイベントリスナー (プレイヤー移動用)
    window.addEventListener('keyup', (e) => {
        // キーを小文字に変換して大文字・小文字を区別しないようにする
        keys[e.key.toLowerCase()] = false;
    });

    // リスタートボタンのクリックイベントリスナー
    restartButton.addEventListener('click', () => {
        initializeGame(); // ゲームを初期化して再開
    });

    // ゲーム開始
    initializeGame();
});
