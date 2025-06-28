export class Timer {
    constructor(gameTime = 300) { // チE��ォルチE刁E
        this.gameTime = gameTime;
        this.elapsedSeconds = 0;
        this.lastTimerResume = Date.now();
        this.isPaused = false;
    }

    start() {
        this.lastTimerResume = Date.now();
        this.isPaused = false;
    }

    pause() {
        if (!this.isPaused) {
            this.elapsedSeconds += Math.floor((Date.now() - this.lastTimerResume) / 1000);
            this.lastTimerResume = null;
            this.isPaused = true;
        }
    }

    resume() {
        if (this.isPaused) {
            this.lastTimerResume = Date.now();
            this.isPaused = false;
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
        const minutes = String(Math.floor(remaining / 60)).padStart(2, '0');
        const seconds = String(remaining % 60).padStart(2, '0');
        return `${minutes}:${seconds}`;
    }

    isTimeUp() {
        return this.update() <= 0;
    }

    reset() {
        this.elapsedSeconds = 0;
        this.lastTimerResume = Date.now();
        this.isPaused = false;
    }

    setGameTime(seconds) {
        this.gameTime = seconds;
    }
} 