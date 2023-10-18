import { drawText, fill } from "./drawing.js";

function lerp(a, b, alpha) {
    return a + alpha * (b - a);
}

function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
}

function moveToward(a, b, rate) {
    return clamp(a + Math.sign(b - a) * rate, Math.min(a, b), Math.max(a, b));
}

class Text {
    constructor() {
        this.text = "";
        this.x = 0;
        this.y = 0;
        this.r = 0;
        this.g = 0;
        this.b = 0;
        this.alpha = 1;

        this.targetX = 0;
        this.targetY = 0;
        this.targetAlpha = 1;

        this.wrapWidth = 1;
    }

    draw() {
        this.x = lerp(this.x, this.targetX, 0.1);
        this.y = lerp(this.y, this.targetY, 0.1);
        this.alpha = moveToward(this.alpha, this.targetAlpha, 0.1);

        fill(`rgb(${lerp(255, this.r, this.alpha)},${lerp(255, this.g, this.alpha)},${lerp(255, this.b, this.alpha)})`);
        drawText(this.text, this.x, this.y, this.wrapWidth);
    }

    setXImmediate(newX) {
        this.x = newX;
        this.targetX = newX;
    }

    setYImmediate(newY) {
        this.y = newY;
        this.targetY = newY;
    }

    setAlphaImmediate(newA) {
        this.alpha = newA;
        this.targetAlpha = newA;
    }
}

export { Text };