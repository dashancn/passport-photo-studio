# 证件照工作室（Passport Photo Studio）

一个原创的纯前端证件照制作工具。照片处理、抠图、裁切、换底色与拼版均在浏览器内完成；没有应用后端，也不会把用户照片上传到项目服务器。

## 功能

- JPG / PNG / WebP 上传与拖放
- 使用 `@imgly/background-removal` 在浏览器本地抠图
- 白、蓝、红和自定义背景色
- 一寸 25×35mm、二寸 35×49mm、护照 33×48mm、35×45mm、美国 2×2in、自定义毫米尺寸
- 平移、缩放微调
- 300DPI 单张 PNG 下载
- 4R（4×6in）和 A4 300DPI 自动多图拼版
- 可选裁切线及拼版 PNG 下载
- 中文响应式界面

## 本地开发

要求 Node.js 20 或更高版本。

```bash
npm install
npm test
npm run dev
```

## 构建

- **Build command:** `npm run build`
- **Output directory:** `dist`

```bash
npm run build
npm run preview
```

## 部署到 Cloudflare Pages

1. 将本仓库推送到 GitHub。
2. 登录 Cloudflare Dashboard，进入 **Workers & Pages → Create → Pages → Connect to Git**。
3. 选择 GitHub 仓库 `passport-photo-studio`。
4. Framework preset 可选 **Vite**，或手工设置：
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `/`（默认）
5. 建议使用 Node.js 20+；如需明确指定，可添加环境变量 `NODE_VERSION=22`。
6. 保存并部署。项目是静态 SPA，不需要 Pages Functions。

`public/_headers` 会添加内容类型、防引用泄露和权限策略等静态安全响应头。项目未强制启用 COOP/COEP，因为抠图模型默认来自 IMG.LY 跨源 CDN；如改为自行托管模型资源，可再按 IMG.LY 文档配置跨源隔离，以启用 `SharedArrayBuffer` 优化。

## 模型资源与 Cloudflare 25MiB 限制

本仓库不包含 ONNX 模型。`@imgly/background-removal` 默认在第一次抠图时从 IMG.LY CDN 下载 WASM 和模型并缓存在浏览器中，因此不会产生超过 Cloudflare Pages 25MiB 单文件限制的静态部署文件。首次抠图需要网络连接，下载量和耗时取决于模型与网络。

## 隐私

用户照片只会被浏览器读取和处理。应用本身不设上传接口、不使用分析脚本。首次使用抠图功能时会向 IMG.LY CDN 请求运行资源，但照片不会随该请求发送。

## 许可证

本项目采用 [GNU Affero General Public License v3.0 only](LICENSE)，SPDX 标识为 `AGPL-3.0-only`。第三方组件及许可证见 [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md)。本软件不提供任何担保。
