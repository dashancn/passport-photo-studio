import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const projectFile = (name) => new URL(`../${name}`, import.meta.url)

test('顶部导航展示品牌生态并安全打开外链', async () => {
  const html = await readFile(projectFile('index.html'), 'utf8')

  assert.match(html, /<nav[^>]+aria-label="品牌生态"/)
  assert.match(html, /href="https:\/\/www\.i41\.cn"[^>]+rel="noopener noreferrer"[^>]*>i方案<\/a>/)
  assert.match(html, /href="https:\/\/tools\.i41\.cn"[^>]+rel="noopener noreferrer"[^>]*>开发者工具<\/a>/)
  assert.match(html, /href="https:\/\/imgzip\.i41\.cn"[^>]+rel="noopener noreferrer"[^>]*>图片压缩<\/a>/)
  assert.match(html, /aria-current="page"[^>]*>证件照<\/span>/)
})

test('README 记录完整品牌生态链接', async () => {
  const readme = await readFile(projectFile('README.md'), 'utf8')

  for (const url of ['https://www.i41.cn', 'https://tools.i41.cn', 'https://imgzip.i41.cn', 'https://idphoto.i41.cn']) {
    assert.ok(readme.includes(url), `README 缺少 ${url}`)
  }
})
