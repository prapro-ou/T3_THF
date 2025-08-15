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
