export class InputManager {
    constructor() {
        this.keys = {};
        this.mousePosition = { x: 0, y: 0 };
        this.isMouseDown = false;
        this.eventHandlers = {};
        this.setupEvents();
    }

    setupEvents() {
        this.eventHandlers.keydown = (e) => {
            this.keys[e.key.toLowerCase()] = true;
        };
        
        this.eventHandlers.keyup = (e) => {
            this.keys[e.key.toLowerCase()] = false;
        };

        this.eventHandlers.mousemove = (e) => {
            this.mousePosition.x = e.clientX;
            this.mousePosition.y = e.clientY;
        };

        this.eventHandlers.mousedown = (e) => {
            if (e.button === 0) { // 左クリックのみ
                this.isMouseDown = true;
            }
        };

        this.eventHandlers.mouseup = (e) => {
            if (e.button === 0) {
                this.isMouseDown = false;
            }
        };

        window.addEventListener('keydown', this.eventHandlers.keydown);
        window.addEventListener('keyup', this.eventHandlers.keyup);
        window.addEventListener('mousemove', this.eventHandlers.mousemove);
        window.addEventListener('mousedown', this.eventHandlers.mousedown);
        window.addEventListener('mouseup', this.eventHandlers.mouseup);
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

    destroy() {
        // イベントリスナーを削除
        window.removeEventListener('keydown', this.eventHandlers.keydown);
        window.removeEventListener('keyup', this.eventHandlers.keyup);
        window.removeEventListener('mousemove', this.eventHandlers.mousemove);
        window.removeEventListener('mousedown', this.eventHandlers.mousedown);
        window.removeEventListener('mouseup', this.eventHandlers.mouseup);
        
        // データをクリア
        this.keys = null;
        this.mousePosition = null;
        this.eventHandlers = null;
    }
} 