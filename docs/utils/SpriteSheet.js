export class SpriteSheet {
    constructor(image, data) {
        this.image = image;
        this.frames = data.frames;
    }
    drawFrame(ctx, frameName, x, y, w, h) {
        const frame = this.frames[frameName].frame;
        ctx.drawImage(
            this.image,
            frame.x, frame.y, frame.w, frame.h,
            x, y, w, h
        );
    }
}