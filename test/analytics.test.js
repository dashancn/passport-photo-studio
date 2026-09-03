import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const projectFile = (name) => new URL(`../${name}`, import.meta.url)

test('页面加载 i41 匿名统计并声明站点标识', async () => {
  const html = await readFile(projectFile('index.html'), 'utf8')

  assert.match(html, /<html[^>]+data-i41-site="idphoto"/)
  assert.match(html, /<script[^>]+src="https:\/\/stats\.i41\.cn\/analytics\.js"[^>]*><\/script>/)
})

test('安全策略允许加载和发送 i41 匿名统计', async () => {
  const headers = await readFile(projectFile('public/_headers'), 'utf8')
  const csp = headers.match(/^\s*Content-Security-Policy:\s*(.+)$/m)?.[1]

  if (csp) {
    assert.match(csp, /script-src[^;]*https:\/\/stats\.i41\.cn/)
    assert.match(csp, /connect-src[^;]*https:\/\/stats\.i41\.cn/)
  }
})

test('可见隐私说明完整披露本地处理和匿名统计边界', async () => {
  const html = await readFile(projectFile('index.html'), 'utf8')
  const privacy = html.match(/<article><h2>隐私说明<\/h2>([\s\S]*?)<\/article>/)?.[1] ?? ''

  assert.match(privacy, /照片[^。]*本地处理/)
  assert.match(privacy, /抠图[^。]*本地处理/)
  for (const item of ['匿名访问', '性能', 'UTM', '跨站点击']) {
    assert.ok(privacy.includes(item), `隐私说明缺少发送范围：${item}`)
  }
  for (const item of ['照片', '文件名', '导出内容', '永久标识']) {
    assert.match(privacy, new RegExp(`不(?:会)?(?:收集|发送)[^。]*${item}`), `隐私说明未明确排除：${item}`)
  }
})

test('README 隐私文档与页面匿名统计披露一致', async () => {
  const readme = await readFile(projectFile('README.md'), 'utf8')
  const privacy = readme.match(/## 隐私\s+([\s\S]*?)(?=\n## |$)/)?.[1] ?? ''

  assert.doesNotMatch(privacy, /不使用分析脚本/)
  for (const item of ['匿名访问', '性能', 'UTM', '跨站点击', '照片', '文件名', '导出内容', '永久标识']) {
    assert.ok(privacy.includes(item), `README 隐私说明缺少：${item}`)
  }
})
