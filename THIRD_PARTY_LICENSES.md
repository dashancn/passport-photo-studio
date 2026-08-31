# 第三方软件与许可证

本文件用于说明直接依赖。完整的传递依赖及其精确版本记录在 `package-lock.json` 中；各包自带许可证文件是其权威条款。

## @imgly/background-removal 1.7.0

- 用途：浏览器端背景移除
- 来源：https://github.com/imgly/background-removal-js
- 包内声明：`SEE LICENSE IN LICENSE.md`
- 包内 `LICENSE.md`：GNU Affero General Public License v3
- 项目 README 说明该软件可在 AGPL 下免费使用
- 默认远程资源：ONNX 模型与 WASM 首次使用时由 IMG.LY CDN 提供，本仓库不复制或再分发这些大型资源

## onnxruntime-web 1.21.0

- 用途：`@imgly/background-removal` 的浏览器推理运行时/peer dependency
- 来源：https://github.com/microsoft/onnxruntime
- 许可证：MIT（以安装包内许可证为准）

## Vite 8.2.2（仅开发与构建）

- 用途：开发服务器和静态生产构建
- 来源：https://github.com/vitejs/vite
- 许可证：MIT（以安装包内许可证为准）

## 许可证兼容提示

发布者应保留本项目 `LICENSE`、本文件、源码和构建所需文件，并遵守 AGPL-3.0-only 关于对应源码和网络交互的要求。如需要其他 IMG.LY 商业授权，请联系 IMG.LY。本说明不构成法律意见。
