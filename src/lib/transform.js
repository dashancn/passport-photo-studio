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

export function constrainAdjustment(base, canvasWidth, canvasHeight, zoom, offsetX, offsetY) {
  const boundedZoom = Math.min(3, Math.max(1, Number(zoom) || 1))
  const drawWidth = base.drawWidth * boundedZoom
  const drawHeight = base.drawHeight * boundedZoom
  const maxOffsetX = Math.max(0, (drawWidth - canvasWidth) / 2)
  const maxOffsetY = Math.max(0, (drawHeight - canvasHeight) / 2)

  return {
    zoom: boundedZoom,
    offsetX: Math.min(maxOffsetX, Math.max(-maxOffsetX, Number(offsetX) || 0)),
    offsetY: Math.min(maxOffsetY, Math.max(-maxOffsetY, Number(offsetY) || 0))
  }
}

export function clientDeltaToCanvas(deltaX, deltaY, canvasWidth, canvasHeight, clientWidth, clientHeight) {
  return {
    x: Number(deltaX) * canvasWidth / clientWidth,
    y: Number(deltaY) * canvasHeight / clientHeight
  }
}
