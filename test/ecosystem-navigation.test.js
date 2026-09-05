import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const projectFile = (name) => new URL(`../${name}`, import.meta.url)

test('顶部导航按标准顺序展示八个生态入口且不重复当前站', async () => {
  const html = await readFile(projectFile('index.html'), 'utf8')
  const nav = html.match(/<nav[^>]+aria-label="品牌生态"[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? ''
  const items = [...nav.matchAll(/<a\b([^>]*)>([^<]+)<\/a>/g)].map(([, attributes, label]) => ({
    attributes,
    label: label.trim(),
  }))
  const expected = [
    ['i方案', 'https://www.i41.cn?utm_source=idphoto&utm_medium=tool_referral&utm_campaign=ifangan&utm_content=ecosystem_nav'],
    ['开发者工具', 'https://tools.i41.cn'],
    ['图片压缩', 'https://imgzip.i41.cn'],
    ['智能抠图', 'https://imgzip.i41.cn/remove-background/'],
    ['多图拼接', 'https://imgzip.i41.cn/collage/'],
    ['PDF 工具', 'https://pdf.i41.cn'],
    ['证件水印', 'https://watermark.i41.cn'],
    ['临时剪贴板', 'https://clip.i41.cn'],
  ]

  assert.deepEqual(items.map(({ label }) => label), expected.map(([label]) => label))
  expected.forEach(([label, url], index) => {
    assert.match(items[index].attributes, new RegExp(`href="${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`), `${label} 链接错误`)
  })
  assert.doesNotMatch(nav, />证件照<\//)
  assert.doesNotMatch(nav, /target="_blank"|\brel=/)
})

test('顶部保留品牌、隐私徽章并采用统一导航视觉', async () => {
  const [html, css] = await Promise.all([
    readFile(projectFile('index.html'), 'utf8'),
    readFile(projectFile('src/style.css'), 'utf8'),
  ])

  assert.match(html, /<span class="logo">证<\/span><strong>证件照工作室<\/strong>/)
  assert.match(html, /<span class="privacy-badge">🔒 图片仅在本地处理<\/span>/)
  assert.match(css, /\.site-header\{[^}]*min-height:64px/)
  assert.match(css, /\.site-header\{[^}]*background:#fff/)
  assert.match(css, /\.ecosystem-nav a,.ecosystem-nav span\{[^}]*min-width:(?:7[2-9]|[89][0-9]|\d{3,})px[^}]*padding:/)
  assert.match(css, /\.ecosystem-nav \.featured\{[^}]*color:#fff[^}]*background:#246bfd[^}]*font-weight:(?:7[0-9]{2}|8[0-9]{2}|900)/)
})

test('窄屏导航保持顺序并允许滚动或折行', async () => {
  const css = await readFile(projectFile('src/style.css'), 'utf8')
  const narrowScreenRules = [...css.matchAll(/@media\s*\([^)]*max-width[^)]*\)\s*\{([\s\S]*?)\}\s*\}/g)].map((match) => match[1]).join('\n')

  assert.match(narrowScreenRules, /\.ecosystem-nav\{[^}]*(?:overflow-x:auto|flex-wrap:wrap)/)
})

test('生态导航在悬停和键盘聚焦时展示完整介绍且不会溢出视口', async () => {
  const [html, css] = await Promise.all([
    readFile(projectFile('index.html'), 'utf8'),
    readFile(projectFile('src/style.css'), 'utf8'),
  ])
  const tooltips = new Map([
    ['i方案', 'i方案是一套面向本地实体商家、内容运营人员和营销服务团队的智能内容工作平台。平台围绕行业、平台、品类、风格和使用场景，提供文案生成、文案诊断、客户跟单话术、文生图、视频包制作和精品模板等能力，帮助用户从内容构思、表单草稿、生成优化到后续复用形成完整工作链路。'],
    ['开发者工具', '开发者工具箱汇集编码转换、格式化、加密、网络、文本和图片等常用在线工具，强调快速、易用和浏览器端处理。'],
    ['图片压缩', '图片修改压缩是一款浏览器端在线图片处理工具，支持压缩、调整尺寸和格式转换，图片尽量在本地处理，适合日常上传、分享和网页优化。'],
    ['智能抠图', '智能抠图在浏览器中自动移除图片背景，适合人像和商品图快速换背景。'],
    ['多图拼接', '多图拼接支持在浏览器中组合多张图片并调整布局。'],
    ['PDF 工具', 'PDF 工具箱提供合并、拆分、压缩、转换、编辑、OCR 和发票拼版等浏览器端 PDF 处理能力。'],
    ['证件水印', '证件水印工具支持为身份证、营业执照和合同截图添加用途水印，图片仅在浏览器本地处理。'],
    ['临时剪贴板', '临时剪贴板支持客户端加密、自动过期、读取次数限制和阅后即焚，适合跨设备传递临时文本。'],
  ])

  for (const [label, tooltip] of tooltips) {
    const escapedTooltip = tooltip.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    assert.match(html, new RegExp(`data-tooltip="${escapedTooltip}"[^>]*>${label}</`))
  }
  assert.equal(tooltips.size, 8)
  assert.match(css, /\[data-tooltip\]:hover::after/)
  assert.match(css, /\[data-tooltip\]:focus-visible::after/)
  assert.match(css, /max-width:min\([^;]+100vw/)
})

test('README 记录完整品牌生态链接', async () => {
  const readme = await readFile(projectFile('README.md'), 'utf8')

  for (const url of ['https://www.i41.cn', 'https://tools.i41.cn', 'https://imgzip.i41.cn', 'https://pdf.i41.cn', 'https://watermark.i41.cn', 'https://clip.i41.cn', 'https://idphoto.i41.cn']) {
    assert.ok(readme.includes(url), `README 缺少 ${url}`)
  }
})
