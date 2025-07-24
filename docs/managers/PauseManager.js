export class PauseManager {
    constructor(game, uiManager) {
        this.game = game;
        this.uiManager = uiManager;
        this.isPaused = false;
        this.pauseKeyHandler = null;
        this.visibilityChangeHandler = null;
        this.setupPauseKey();
    }

    setupPauseKey() {
        this.pauseKeyHandler = (e) => {
            if (e.key.toLowerCase() === 'p') {
                this.togglePause();
            }
        };
        
        this.visibilityChangeHandler = () => {
            this.handleVisibilityChange();
        };
        
        window.addEventListener('keydown', this.pauseKeyHandler);
        document.addEventListener('visibilitychange', this.visibilityChangeHandler);
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.pause();
        } else {
            this.resume();
        }
    }

    pause() {
        this.isPaused = true;
        this.game.timer.pause();
        this.uiManager.showPauseMessage();
        if (this.game.gameState.getAnimationId()) {
            cancelAnimationFrame(this.game.gameState.getAnimationId());
        }
    }

    resume() {
        this.isPaused = false;
        this.game.timer.resume();
        this.uiManager.hidePauseMessage();
        this.game.animate();
    }

    handleVisibilityChange() {
        if (document.hidden && !this.isPaused) {
            this.pause();
        }
    }

    destroy() {
        // イベントリスナーを削除
        if (this.pauseKeyHandler) {
            window.removeEventListener('keydown', this.pauseKeyHandler);
        }
        if (this.visibilityChangeHandler) {
            document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
        }
        
        // 参照をクリア
        this.game = null;
        this.uiManager = null;
        this.pauseKeyHandler = null;
        this.visibilityChangeHandler = null;
    }
} 