import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const projectFile = (name) => new URL(`../${name}`, import.meta.url)

test('首页提供带来源归属的 i方案访问引导', async () => {
  const [html, css] = await Promise.all([
    readFile(projectFile('index.html'), 'utf8'),
    readFile(projectFile('src/style.css'), 'utf8'),
  ])
  const ecosystemUrl = 'https://www.i41.cn?utm_source=idphoto&utm_medium=tool_referral&utm_campaign=ifangan&utm_content=ecosystem_nav'
  const bannerUrl = 'https://www.i41.cn?utm_source=idphoto&utm_medium=tool_referral&utm_campaign=ifangan&utm_content=promo_banner'

  const banner = html.match(/<aside class="iplan-cta"[^>]*>([\s\S]*?)<\/aside>/)?.[1] ?? ''

  assert.ok(html.includes(`href="${ecosystemUrl}"`), '顶部生态导航应使用 ecosystem_nav 归属链接')
  assert.ok(banner.includes(`href="${bannerUrl}"`), '浅黄色横幅应使用 promo_banner 归属链接')
  assert.match(banner, /<strong>关注 i方案<\/strong>/)
  assert.match(banner, /获取内容创作、客户跟单、文生图与视频制作方案/)
  assert.match(banner, /访问 i方案\s*<span aria-hidden="true">→<\/span>/)
  assert.match(banner, /target="_blank"/)
  assert.match(banner, /rel="noopener noreferrer"/)
  assert.match(css, /\.iplan-cta\{[^}]*background:#fff8d8/)
})

test('页面明确归属 i41 免费实用工具且保留许可边界', async () => {
  const html = await readFile(projectFile('index.html'), 'utf8')

  assert.match(html, />[^<]*i41 免费实用工具[^<]*</)
  assert.doesNotMatch(html, /永久免费/)
  assert.match(html, /AGPL-3\.0-only/)
  assert.match(html, />第三方声明</)
})
