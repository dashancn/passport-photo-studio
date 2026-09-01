import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { markModelCached, modelCacheStatus, MODEL_CACHE_MARKER, MODEL_DOWNLOAD_MB } from '../src/lib/model-cache.js'

const projectFile = (name) => new URL(`../${name}`, import.meta.url)

test('抠图区域显示模型缓存或首次加载提示', async () => {
  const html = await readFile(projectFile('index.html'), 'utf8')
  assert.match(html, /id="modelStatus"/)
  assert.match(html, /首次使用需要下载约/)
  assert.match(html, /模型已缓存/)
})

test('成功加载模型后记录缓存状态', () => {
  const values = new Map()
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }
  assert.equal(modelCacheStatus(storage), 'missing')
  markModelCached(storage)
  assert.equal(values.get(MODEL_CACHE_MARKER), '1')
  assert.equal(modelCacheStatus(storage), 'cached')
  assert.equal(MODEL_DOWNLOAD_MB, 54)
})
