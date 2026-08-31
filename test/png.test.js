import test from 'node:test'
import assert from 'node:assert/strict'
import { addPngDpiMetadata, readPngPixelsPerMeter } from '../src/lib/png.js'

const ONE_PIXEL_PNG = Uint8Array.from(Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
))

test('为 PNG 写入 300DPI 对应的 pHYs 元数据', () => {
  const output = addPngDpiMetadata(ONE_PIXEL_PNG, 300)
  assert.equal(readPngPixelsPerMeter(output), 11811)
})

test('重复写入 DPI 时替换原 pHYs 而不是累加', () => {
  const once = addPngDpiMetadata(ONE_PIXEL_PNG, 96)
  const twice = addPngDpiMetadata(once, 300)
  assert.equal(readPngPixelsPerMeter(twice), 11811)
  const text = Buffer.from(twice).toString('latin1')
  assert.equal(text.split('pHYs').length - 1, 1)
})
