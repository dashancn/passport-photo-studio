import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateCoverTransform, applyAdjustment, clampAdjustment } from '../src/lib/transform.js'

test('计算图片覆盖目标画布所需的居中缩放', () => {
  assert.deepEqual(calculateCoverTransform(1200, 800, 300, 400), {
    scale: 0.5,
    drawWidth: 600,
    drawHeight: 400,
    x: -150,
    y: 0
  })
})

test('用户缩放和平移叠加在基础适配上', () => {
  assert.deepEqual(applyAdjustment({ scale: 0.5, x: -150, y: 0, drawWidth: 600, drawHeight: 400 }, 1.2, 10, -20), {
    scale: 0.6,
    drawWidth: 720,
    drawHeight: 480,
    x: -200,
    y: -60
  })
})

test('微调值限制在安全范围', () => {
  assert.deepEqual(clampAdjustment(5, 999, -999), { zoom: 3, offsetX: 300, offsetY: -300 })
  assert.deepEqual(clampAdjustment(0.1, 0, 0), { zoom: 0.5, offsetX: 0, offsetY: 0 })
})
