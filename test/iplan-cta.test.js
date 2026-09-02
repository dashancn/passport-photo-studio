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

  assert.match(html, /class="iplan-cta"/)
  assert.ok(html.includes(`href="${ecosystemUrl}"`), '顶部生态导航应使用 ecosystem_nav 归属链接')
  assert.ok(html.includes(`href="${bannerUrl}"`), '浅黄色横幅应使用 promo_banner 归属链接')
  assert.match(html, /关注 i方案/)
  assert.match(html, /访问 i方案/)
  assert.match(css, /\.iplan-cta/)
})

test('页面明确归属 i41 免费实用工具且保留许可边界', async () => {
  const html = await readFile(projectFile('index.html'), 'utf8')

  assert.match(html, />[^<]*i41 免费实用工具[^<]*</)
  assert.doesNotMatch(html, /永久免费/)
  assert.match(html, /AGPL-3\.0-only/)
  assert.match(html, />第三方声明</)
})
