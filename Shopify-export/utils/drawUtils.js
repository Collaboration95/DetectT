export function drawPoint(ctx, x, y, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

export function connectPoints(ctx, aX, aY, bX, bY, linecolor, lineWidth) {
  ctx.beginPath();
  ctx.moveTo(aX, aY);
  ctx.lineTo(bX, bY);
  ctx.strokeStyle = linecolor;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}
