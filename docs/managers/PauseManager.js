export class PauseManager {
    constructor(game, uiManager) {
        this.game = game;
        this.uiManager = uiManager;
        this.isPaused = false;
        this.setupPauseKey();
    }

    setupPauseKey() {
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'p') {
                this.togglePause();
            }
        });
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
} 