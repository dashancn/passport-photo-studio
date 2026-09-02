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
  assert.match(html, /href="https:\/\/pdf\.i41\.cn"[^>]+rel="noopener noreferrer"[^>]*>PDF 工具<\/a>/)
  assert.match(html, /href="https:\/\/watermark\.i41\.cn"[^>]+rel="noopener noreferrer"[^>]*>证件水印<\/a>/)
  assert.match(html, /href="https:\/\/clip\.i41\.cn"[^>]+rel="noopener noreferrer"[^>]*>临时剪贴板<\/a>/)
  assert.match(html, /aria-current="page"[^>]*>证件照<\/span>/)
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
    ['PDF 工具', 'PDF 工具箱提供合并、拆分、压缩、转换、编辑、OCR 和发票拼版等浏览器端 PDF 处理能力。'],
    ['证件水印', '证件水印工具支持为身份证、营业执照和合同截图添加用途水印，图片仅在浏览器本地处理。'],
    ['临时剪贴板', '临时剪贴板支持客户端加密、自动过期、读取次数限制和阅后即焚，适合跨设备传递临时文本。'],
    ['证件照', '证件照工作室是一款浏览器端证件照制作工具，支持本地智能抠图、背景换色、常用证件尺寸和 300DPI 多图拼版，照片无需上传到业务服务器。'],
  ])

  for (const [label, tooltip] of tooltips) {
    const escapedTooltip = tooltip.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    assert.match(html, new RegExp(`data-tooltip="${escapedTooltip}"[^>]*>${label}</`))
  }
  assert.match(html, /class="active"[^>]+tabindex="0"[^>]+aria-current="page"/)
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
