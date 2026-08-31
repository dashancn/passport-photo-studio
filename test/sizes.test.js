import test from 'node:test'
import assert from 'node:assert/strict'
import { mmToPx, inchesToPx, resolvePhotoSize } from '../src/lib/sizes.js'

test('毫米按指定 DPI 换算为整数像素', () => {
  assert.equal(mmToPx(25, 300), 295)
  assert.equal(mmToPx(35, 300), 413)
})

test('英寸按指定 DPI 换算为整数像素', () => {
  assert.equal(inchesToPx(2, 300), 600)
})

test('解析内置证件照尺寸并统一为毫米', () => {
  assert.deepEqual(resolvePhotoSize('passport'), { widthMm: 33, heightMm: 48, label: '护照 33×48mm' })
  assert.deepEqual(resolvePhotoSize('us-2x2'), { widthMm: 50.8, heightMm: 50.8, label: '美国 2×2in' })
})

test('自定义尺寸必须是有效正数', () => {
  assert.deepEqual(resolvePhotoSize('custom', 30, 40), { widthMm: 30, heightMm: 40, label: '自定义 30×40mm' })
  assert.throws(() => resolvePhotoSize('custom', 0, 40), /正数/)
})

test('自定义尺寸限制在常见打印安全范围内', () => {
  assert.throws(() => resolvePhotoSize('custom', 301, 35), /不超过 300mm/)
  assert.throws(() => resolvePhotoSize('custom', 35, 301), /不超过 300mm/)
})
