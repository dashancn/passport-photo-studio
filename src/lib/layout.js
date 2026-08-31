import { inchesToPx, mmToPx } from './sizes.js'

export function getSheetPixels(key) {
  if (key === '4r') return { width: inchesToPx(4), height: inchesToPx(6), label: '4R 4×6in' }
  if (key === 'a4') return { width: mmToPx(210), height: mmToPx(297), label: 'A4 210×297mm' }
  throw new Error('未知拼版纸张')
}

function candidate(sheetWidth, sheetHeight, photoWidth, photoHeight, gap, rotated) {
  const columns = Math.max(0, Math.floor((sheetWidth + gap) / (photoWidth + gap)))
  const rows = Math.max(0, Math.floor((sheetHeight + gap) / (photoHeight + gap)))
  const gridWidth = columns * photoWidth + Math.max(0, columns - 1) * gap
  const gridHeight = rows * photoHeight + Math.max(0, rows - 1) * gap
  const startX = Math.round((sheetWidth - gridWidth) / 2)
  const startY = Math.round((sheetHeight - gridHeight) / 2)
  const items = []
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      items.push({
        x: startX + column * (photoWidth + gap),
        y: startY + row * (photoHeight + gap),
        width: photoWidth,
        height: photoHeight,
        rotated
      })
    }
  }
  return { columns, rows, items, rotated }
}

export function calculateGridLayout(sheetWidth, sheetHeight, photoWidth, photoHeight, gap = 24) {
  const portrait = candidate(sheetWidth, sheetHeight, photoWidth, photoHeight, gap, false)
  const landscape = candidate(sheetWidth, sheetHeight, photoHeight, photoWidth, gap, true)
  return landscape.items.length > portrait.items.length ? landscape : portrait
}

export function createCropMarks(items, length = 18, inset = 5) {
  return items.flatMap(({ x, y, width, height }) => {
    const left = x
    const right = x + width
    const top = y
    const bottom = y + height
    return [
      { x1: left - length, y1: top, x2: left - inset, y2: top },
      { x1: left, y1: top - length, x2: left, y2: top - inset },
      { x1: right + inset, y1: top, x2: right + length, y2: top },
      { x1: right, y1: top - length, x2: right, y2: top - inset },
      { x1: left - length, y1: bottom, x2: left - inset, y2: bottom },
      { x1: left, y1: bottom + inset, x2: left, y2: bottom + length },
      { x1: right + inset, y1: bottom, x2: right + length, y2: bottom },
      { x1: right, y1: bottom + inset, x2: right, y2: bottom + length }
    ]
  })
}
