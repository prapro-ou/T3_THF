export class SpriteSheet {
    constructor(image, data) {
        this.image = image;
        this.frames = data.frames;
        
        // 配列形式とオブジェクト形式の両方に対応
        if (Array.isArray(this.frames)) {
            // 配列形式の場合 - filenameプロパティを使用
            this.frameNames = this.frames.map(frame => frame.filename);
            this.frameData = this.frames;
        } else {
            // オブジェクト形式の場合
            this.frameNames = Object.keys(this.frames);
            this.frameData = this.frames;
        }
        
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.frameDelay = 8; // フレーム間の遅延（60fpsで約0.13秒）
        this.isAnimating = false;
    }

    drawFrame(ctx, frameName, x, y, w, h) {
        let frame;
        if (Array.isArray(this.frames)) {
            // 配列形式の場合
            const frameIndex = this.frameNames.indexOf(frameName);
            if (frameIndex >= 0) {
                frame = this.frames[frameIndex].frame;
            }
        } else {
            // オブジェクト形式の場合
            frame = this.frames[frameName].frame;
        }
        
        if (frame) {
            ctx.drawImage(
                this.image,
                frame.x, frame.y, frame.w, frame.h,
                x, y, w, h
            );
        } else {
            // フレームが見つからない場合のデバッグ情報
            console.log('Frame not found:', frameName, 'Available frames:', this.frameNames);
        }
    }

    // アニメーション機能を追加
    startAnimation() {
        this.isAnimating = true;
        this.currentFrame = 0;
        this.frameTimer = 0;
    }

    stopAnimation() {
        this.isAnimating = false;
    }

    updateAnimation() {
        if (!this.isAnimating) return;

        this.frameTimer++;
        if (this.frameTimer >= this.frameDelay) {
            this.currentFrame = (this.currentFrame + 1) % this.frameNames.length;
            this.frameTimer = 0;
        }
    }

    drawAnimatedFrame(ctx, x, y, w, h) {
        if (this.frameNames.length === 0) {
            return;
        }
        
        const frameName = this.frameNames[this.currentFrame];
        this.drawFrame(ctx, frameName, x, y, w, h);
    }

    // 特定のフレーム範囲でアニメーション
    setAnimationRange(startFrame, endFrame) {
        this.frameNames = this.frameNames.slice(startFrame, endFrame + 1);
        this.currentFrame = 0;
    }

    // フレーム遅延を設定
    setFrameDelay(delay) {
        this.frameDelay = delay;
    }
}