import test from 'node:test'
import assert from 'node:assert/strict'
import { getSheetPixels, calculateGridLayout, createCropMarks } from '../src/lib/layout.js'

test('4R 与 A4 纸张按 300DPI 返回正确画布像素', () => {
  assert.deepEqual(getSheetPixels('4r'), { width: 1200, height: 1800, label: '4R 4×6in' })
  assert.deepEqual(getSheetPixels('a4'), { width: 2480, height: 3508, label: 'A4 210×297mm' })
})

test('自动拼版选择能容纳最多照片的横竖方向', () => {
  const result = calculateGridLayout(1200, 1800, 295, 413, 30)
  assert.equal(result.items.length, 12)
  assert.equal(result.rotated, false)
  assert.equal(result.columns, 3)
  assert.equal(result.rows, 4)
})

test('拼版项目居中且不越出纸张', () => {
  const result = calculateGridLayout(1200, 1800, 600, 600, 20)
  assert.equal(result.items.length, 2)
  for (const item of result.items) {
    assert.ok(item.x >= 0 && item.y >= 0)
    assert.ok(item.x + item.width <= 1200)
    assert.ok(item.y + item.height <= 1800)
  }
})

test('每张照片生成四角八条裁切线', () => {
  const marks = createCropMarks([{ x: 50, y: 60, width: 300, height: 400 }], 12, 6)
  assert.equal(marks.length, 8)
  assert.deepEqual(marks[0], { x1: 38, y1: 60, x2: 44, y2: 60 })
})
