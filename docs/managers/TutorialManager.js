// チュートリアル進行管理
export class TutorialManager {
    constructor(game) {
        this.game = game;
        this.steps = [
            {
                text: 'ようこそ！キビ弾GO チュートリアルへ！\n\n矢印キーまたはWASDで移動してみよう！',
                action: 'move',
            },
            {
                text: '画面左下のミニマップで自分や敵の位置が分かるよ！\n\nオトモも一緒に戦ってくれる！',
                action: 'minimap',
            },
            {
                text: '鬼が近づいてきたら、クリックで攻撃してみよう！\n\n鬼にぶつかるとダメージを受けるので注意！',
                action: 'waitForOni',
            },
            {
                text: 'チュートリアルはここまで！ゲームを楽しんでね！',
                action: 'end',
            },
        ];
        this.currentStep = 0;
        this.active = false;
    }

    /**
     * 初回ログインかどうかをチェック
     * @returns {boolean} 初回ログインの場合true
     */
    isFirstTimeUser() {
        return !localStorage.getItem('kibidan_tutorial_completed');
    }

    /**
     * 初回ログイン時のチュートリアル表示が必要かチェック
     * @returns {boolean} チュートリアル表示が必要な場合true
     */
    shouldShowFirstTimeTutorial() {
        return this.isFirstTimeUser();
    }

    /**
     * チュートリアル完了を記録
     */
    markTutorialCompleted() {
        localStorage.setItem('kibidan_tutorial_completed', 'true');
    }

    /**
     * チュートリアル完了状態をリセット（デバッグ用）
     */
    resetTutorialStatus() {
        localStorage.removeItem('kibidan_tutorial_completed');
    }

    start() {
        this.active = true;
        this.currentStep = 0;
        this.showStep();
    }

    showStep() {
        if (!this.active) return;
        const step = this.steps[this.currentStep];
        if (step.action === 'waitForOni') {
            // 鬼が画面内に入ったら説明
            this.game.resumeFromTutorial();
            this._oniCheckInterval = setInterval(() => {
                const oniInView = this.game.enemyManager.enemies.some(e => this._isInView(e));
                if (oniInView) {
                    clearInterval(this._oniCheckInterval);
                    this.game.pauseForTutorial(step.text);
                }
            }, 300);
        } else {
            this.game.pauseForTutorial(step.text);
        }
    }

    nextStep() {
        this.currentStep++;
        if (this.currentStep >= this.steps.length) {
            this.end();
        } else {
            this.showStep();
        }
    }

    end() {
        this.active = false;
        if (this._oniCheckInterval) clearInterval(this._oniCheckInterval);
        this.game.resumeFromTutorial();
        // チュートリアル完了を記録
        this.markTutorialCompleted();
    }

    // 鬼が画面内にいるか判定（カメラ範囲内）
    _isInView(enemy) {
        if (!enemy || !this.game || !this.game.cameraManager) return false;
        const cam = this.game.cameraManager;
        const { x, y, width, height } = cam.getCameraRect();
        return (
            enemy.x + enemy.width > x &&
            enemy.x < x + width &&
            enemy.y + enemy.height > y &&
            enemy.y < y + height
        );
    }
}
