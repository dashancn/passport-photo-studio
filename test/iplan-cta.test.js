import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const projectFile = (name) => new URL(`../${name}`, import.meta.url)

test('首页提供醒目的 i方案访问引导', async () => {
  const [html, css] = await Promise.all([
    readFile(projectFile('index.html'), 'utf8'),
    readFile(projectFile('src/style.css'), 'utf8'),
  ])
  assert.match(html, /class="iplan-cta"/)
  assert.match(html, /href="https:\/\/www\.i41\.cn"[^>]+rel="noopener noreferrer"/)
  assert.match(html, /关注 i方案/)
  assert.match(html, /访问 i方案/)
  assert.match(css, /\.iplan-cta/)
})
