export function calculateCoverTransform(imageWidth, imageHeight, canvasWidth, canvasHeight) {
  const scale = Math.max(canvasWidth / imageWidth, canvasHeight / imageHeight)
  const drawWidth = imageWidth * scale
  const drawHeight = imageHeight * scale
  return {
    scale,
    drawWidth,
    drawHeight,
    x: (canvasWidth - drawWidth) / 2,
    y: (canvasHeight - drawHeight) / 2
  }
}

export function applyAdjustment(base, zoom, offsetX, offsetY) {
  const drawWidth = base.drawWidth * zoom
  const drawHeight = base.drawHeight * zoom
  return {
    scale: base.scale * zoom,
    drawWidth,
    drawHeight,
    x: base.x - (drawWidth - base.drawWidth) / 2 + offsetX,
    y: base.y - (drawHeight - base.drawHeight) / 2 + offsetY
  }
}

export function clampAdjustment(zoom, offsetX, offsetY) {
  return {
    zoom: Math.min(3, Math.max(0.5, Number(zoom))),
    offsetX: Math.min(300, Math.max(-300, Number(offsetX))),
    offsetY: Math.min(300, Math.max(-300, Number(offsetY)))
  }
}
