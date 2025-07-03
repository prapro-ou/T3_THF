export class InputManager {
    constructor() {
        this.keys = {};
        this.mousePosition = { x: 0, y: 0 };
        this.isMouseDown = false;
        this.setupEvents();
    }

    setupEvents() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        window.addEventListener('mousemove', (e) => {
            this.mousePosition.x = e.clientX;
            this.mousePosition.y = e.clientY;
        });

        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // 左クリチE��のみ
                this.isMouseDown = true;
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.isMouseDown = false;
            }
        });
    }

    isKeyPressed(key) {
        return this.keys[key.toLowerCase()] || false;
    }

    getMousePosition() {
        return { ...this.mousePosition };
    }

    isMousePressed() {
        return this.isMouseDown;
    }

    resetMouseState() {
        this.isMouseDown = false;
    }
} 