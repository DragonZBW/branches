let ctx;
let canvas;

function initDrawing(_ctx, _canvas) {
    canvas = _canvas;
    ctx = _ctx;
    ctx.fillStyle = "#000";
    ctx.font = "2rem monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
}

function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function fill(style) {
    ctx.fillStyle = style;
}

function drawText(text, x, y, wrapWidth = 0.333) {
    if (!text)
        return;

    let lines = getLines(text, canvas.width * wrapWidth);
    for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], canvas.width * x, canvas.height * y - (lines.length - 1) * 17.5 + i * 35);
    }
}

function drawArrow(x, y) {
    ctx.fillStyle = "#88A";
    ctx.beginPath();
    // ctx.moveTo(0, 0);
    // ctx.lineTo(100, 100);
    // ctx.lineTo(0, 100);
    ctx.moveTo(canvas.width * (x - 0.016), canvas.height * (y - 0.01));
    ctx.lineTo(canvas.width * (x + 0.016), canvas.height * (y - 0.01));
    ctx.lineTo(canvas.width * x, canvas.height * (y + 0.01));
    ctx.closePath();
    ctx.fill();
}

// from https://stackoverflow.com/questions/2936112/text-wrap-in-a-canvas-element,
// with some modifications
function getLines(text, maxWidth) {
    let lines = [];
    let currentLine = text[0];

    for (let i = 1; i < text.length; i++) {
        currentLine += text[i];
        let width = ctx.measureText(currentLine).width;
        if (width >= maxWidth) {
            let spaceIndex = currentLine.lastIndexOf(" ");
            if (spaceIndex >= 0) {
                lines.push(currentLine.substring(0, spaceIndex + 1));
                currentLine = currentLine.substring(spaceIndex + 1);
            } else {
                lines.push(currentLine.substring(0, currentLine.length - 1) + "-");
                currentLine = currentLine[currentLine.length - 1];
            }
        }
    }
    lines.push(currentLine);
    return lines;
}

export { initDrawing, clear, fill, drawText, drawArrow };