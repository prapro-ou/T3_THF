export class Timer {
    constructor(gameTime = 300) { // デフォルト5分
        this.gameTime = gameTime;
        this.elapsedSeconds = 0;
        this.lastTimerResume = Date.now();
        this.isPaused = false;
        this.pauseStartTime = null; // ポーズ開始時刻を記録
        this.pauseElapsedSeconds = 0; // ポーズ前の累積経過時間
    }

    start() {
        this.lastTimerResume = Date.now();
        this.isPaused = false;
        this.pauseStartTime = null;
        this.pauseElapsedSeconds = 0;
    }

    pause() {
        if (!this.isPaused) {
            // ポーズ前の累積経過時間を保存
            this.pauseElapsedSeconds = this.elapsedSeconds + Math.floor((Date.now() - this.lastTimerResume) / 1000);
            this.pauseStartTime = Date.now(); // ポーズ開始時刻を記録
            this.lastTimerResume = null;
            this.isPaused = true;
        }
    }

    resume() {
        if (this.isPaused && this.pauseStartTime) {
            // ポーズ前の累積経過時間を復元
            this.elapsedSeconds = this.pauseElapsedSeconds;
            this.lastTimerResume = Date.now();
            this.isPaused = false;
            this.pauseStartTime = null;
            this.pauseElapsedSeconds = 0;
        }
    }

    update() {
        if (this.isPaused) return;
        
        let totalElapsed = this.elapsedSeconds;
        if (this.lastTimerResume) {
            totalElapsed += Math.floor((Date.now() - this.lastTimerResume) / 1000);
        }
        
        return Math.max(0, this.gameTime - totalElapsed);
    }

    getFormattedTime() {
        const remaining = this.update();
        return `${remaining}`;
    }

    isTimeUp() {
        return this.update() <= 0;
    }

    reset() {
        this.elapsedSeconds = 0;
        this.lastTimerResume = Date.now();
        this.isPaused = false;
        this.pauseStartTime = null;
        this.pauseElapsedSeconds = 0;
    }

    setGameTime(seconds) {
        this.gameTime = seconds;
    }

    getTime() {
        return this.update();
    }

    getElapsedTime() {
        if (this.isPaused) {
            return this.pauseElapsedSeconds;
        }
        
        let totalElapsed = this.elapsedSeconds;
        if (this.lastTimerResume) {
            totalElapsed += Math.floor((Date.now() - this.lastTimerResume) / 1000);
        }
        
        return totalElapsed;
    }

    stop() {
        this.isPaused = true;
        this.lastTimerResume = null;
        this.pauseStartTime = null;
        this.pauseElapsedSeconds = 0;
    }
} 