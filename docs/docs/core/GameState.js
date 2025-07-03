export class GameState {
    constructor(game) {
        this.game = game;
        this.score = 0;
        this.gameOver = false;
        this.animationId = null;
        this.deltaTime = 0;
        this.lastTime = 0;
    }

    updateDeltaTime() {
        const now = performance.now();
        this.lastTime = this.lastTime || now;
        this.deltaTime = (now - this.lastTime) / 1000;
        this.lastTime = now;
        return this.deltaTime;
    }

    setGameOver() {
        this.gameOver = true;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    isGameOver() {
        return this.gameOver;
    }

    addScore(points) {
        this.score += points;
    }

    getScore() {
        return this.score;
    }

    getDeltaTime() {
        return this.deltaTime;
    }

    setAnimationId(id) {
        this.animationId = id;
    }

    getAnimationId() {
        return this.animationId;
    }

    reset() {
        this.score = 0;
        this.gameOver = false;
        this.deltaTime = 0;
        this.lastTime = 0;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
} 