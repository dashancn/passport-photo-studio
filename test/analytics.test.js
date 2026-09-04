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

test('折叠区域完整披露隐私、许可证和第三方归属', async () => {
  const html = await readFile(projectFile('index.html'), 'utf8')
  const details = html.match(/<details class="legal-details">([\s\S]*?)<\/details>/)?.[1] ?? ''

  assert.match(html, /照片本地处理/)
  assert.match(html, /AGPL-3\.0 开源/)
  assert.match(details, /照片[^。]*本地处理/)
  assert.match(details, /抠图[^。]*本地处理/)
  for (const item of ['匿名访问', '性能', 'UTM', '跨站点击']) {
    assert.ok(details.includes(item), `隐私说明缺少发送范围：${item}`)
  }
  for (const item of ['照片', '文件名', '导出内容', '永久标识']) {
    assert.match(details, new RegExp(`不(?:会)?(?:收集|发送)[^。]*${item}`), `隐私说明未明确排除：${item}`)
  }
  for (const item of ['@imgly/background-removal', 'AGPL-3.0-only', '第三方声明', '本软件不提供任何担保']) {
    assert.ok(details.includes(item), `折叠说明缺少：${item}`)
  }
})

test('拍摄建议默认折叠且页脚保持精简', async () => {
  const html = await readFile(projectFile('index.html'), 'utf8')
  assert.match(html, /<details class="shooting-tips">[\s\S]*?<summary>查看拍摄建议<\/summary>/)
  assert.match(html, /<footer>证件照工作室 · i41 免费实用工具 · 本地处理<\/footer>/)
  assert.doesNotMatch(html, /<section class="info-grid">/)
})

test('README 隐私文档与页面匿名统计披露一致', async () => {
  const readme = await readFile(projectFile('README.md'), 'utf8')
  const privacy = readme.match(/## 隐私\s+([\s\S]*?)(?=\n## |$)/)?.[1] ?? ''

  assert.doesNotMatch(privacy, /不使用分析脚本/)
  for (const item of ['匿名访问', '性能', 'UTM', '跨站点击', '照片', '文件名', '导出内容', '永久标识']) {
    assert.ok(privacy.includes(item), `README 隐私说明缺少：${item}`)
  }
})
