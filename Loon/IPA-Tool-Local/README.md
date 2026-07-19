# IPA 工具箱增强版 · Loon

基于你提供的 `IPA-Tool.scripting` 实现流程，并兼容原版 Loon 助手的两个入口：

- `https://apple-api.com`：Apple ID 登录、搜索、版本、许可和下载信息 API。
- `https://xiaobai.app`：为 Scripting 本地下载文件生成 OTA 安装清单。

增强版同时提供独立的 Loon 本地控制面板，不安装 Scripting 也能查询应用、查看历史版本、获取 Apple CDN 原始下载地址、导出 metadata 与 sinf。

## 一键安装

### 推荐：网页一键唤起 Loon

https://www.nsloon.com/openloon/import?plugin=https%3A%2F%2Fraw.githubusercontent.com%2FGUIEROOR%2Fchatgpt%2Fmain%2FLoon%2FIPA-Tool-Local%2FIPA-Tool-Enhanced.lpx

### Loon Scheme

loon://import?plugin=https%3A%2F%2Fraw.githubusercontent.com%2FGUIEROOR%2Fchatgpt%2Fmain%2FLoon%2FIPA-Tool-Local%2FIPA-Tool-Enhanced.lpx

### 插件订阅地址

https://raw.githubusercontent.com/GUIEROOR/chatgpt/main/Loon/IPA-Tool-Local/IPA-Tool-Enhanced.lpx

安装后启用插件。首次打开会从本仓库下载 7 个压缩核心分片并保存到 Loon 本地；之后日常启动直接读取本地缓存。保持 Loon 运行，再用 Safari 打开：

http://ipa-tool.local/

也可以在 Loon 的脚本页面手动运行“打开 IPA 工具箱面板”。

## 相比原版辅助插件的改进

### 可用性与界面

- 新增响应式本地网页，适配 iPhone、iPad、深色模式和横屏。
- 搜索支持应用名称和数字 App ID。
- 历史版本先加载轻量索引；只有点击“查看下载详情”时才请求该版本完整信息，减少滑动卡顿和无意义请求。
- 增加搜索历史、应用收藏、下载准备记录、多账号切换和状态提示。
- 下载前显示版本、构建号、文件大小、最低系统、External ID 和当前账号。

### 稳定性

- 会话、GUID、设置、收藏、历史记录和版本缓存保存在 `$persistentStore`。
- 状态写入前自动保留上一份备份；主状态损坏时尝试恢复。
- 网络请求支持指数退避重试。
- 重试最后一次自动从 HTTP/2 回退到 HTTP/1.1，兼容部分网络和代理节点。
- Apple 返回 2034/2042 时标记会话过期；开启“允许自动刷新登录”后可自动重新登录一次。
- Timbrd 与 Bilin 版本源并发查询、去重合并；其中一个失效时仍可使用另一个。
- 内置网络诊断，可分别检查账号会话、iTunes Search、Timbrd 和 Bilin。

### 下载体验

- Loon 只负责取得临时下载地址，点击下载后以 HTTP 302 直接跳转 Apple CDN。
- IPA 大文件不经过脚本转发，也不进入 JavaScript 内存，避免代理脚本成为速度瓶颈。
- 可复制 Apple CDN 地址，或分别导出 `iTunesMetadata.plist` 与 `.sinf`。
- 下载链接是 Apple 临时地址；过期后重新点击“查看下载详情”即可刷新。

### 原版兼容

保持以下 API 路由兼容：

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/reset`
- `GET /apps/:id`
- `GET /apps/:id/versions`
- `GET /apps/:id/versions/legacy`
- `POST /apps/:id/purchase`
- `GET /apps/search/:term`

原 Scripting 项目仍可继续请求 `apple-api.com` 和 `xiaobai.app`，无需修改项目中的接口地址。

## 插件参数

- `default_country`：默认 App Store 地区，默认 `us`。
- `cache_hours`：历史版本缓存时长，默认 24 小时。
- `compat_mode`：是否兼容原版 `apple-api.com` / `xiaobai.app`，默认开启。
- `remember_password`：是否允许保存密码以自动刷新 Cookie，默认关闭。
- `max_retry`：网络失败重试次数，默认 2。
- `debug`：输出调试日志，默认关闭。

## 密码和隐私

默认不会把 Apple ID 密码写入本地存储，只持久化 Apple 返回的 Cookie、DSID、passwordToken 和 StoreFront。会话过期后需要重新登录。

若开启 `remember_password`，密码会以普通字符串保存在 Loon 的 `$persistentStore`，用于原版 `/auth/refresh` 和自动恢复会话。只有在你理解风险并且设备、Loon 配置备份均可信时才建议开启。

请勿分享 Loon 配置备份、持久化数据、完整调试日志或账号会话。

## Loon 能力限制

Loon 脚本可以发起 HTTP 请求、生成伪响应和保存字符串，但没有通用文件目录、流式文件写入、ZIP 编辑和重打包 API。因此增强版不能在纯 Loon 环境中自动完成：

1. 把 `iTunesMetadata.plist` 写入 IPA 根目录；
2. 把 `.sinf` 写入 `Payload/<App>.app/SC_Info/`；
3. 重新压缩并输出处理后的 IPA。

独立面板拿到的是 Apple CDN 原始包。需要完整注入与重打包时，仍需使用 Scripting、快捷指令、电脑程序或其他具备文件系统和 ZIP 写入能力的宿主。

## 故障排查

- **面板打不开**：确认插件已启用、Loon 正在运行，并检查 `ipa-tool.local` 的 Host 和 Rule 是否被其他配置覆盖。
- **登录需要验证码**：先用密码登录一次，收到提示后输入 6 位双重认证码再次提交。
- **2034 / 2042**：会话已过期；重新登录，或在可信设备上开启 `remember_password`。
- **9610**：当前 Apple ID 没有该应用许可；免费应用可尝试“获取免费许可”。
- **版本名称显示 `????`**：第三方映射源没有记录，但 External Version ID 仍可用于请求。
- **速度忽快忽慢**：脚本已经直跳 Apple CDN；实际速度仍受 Apple 节点、Wi-Fi/蜂窝网络、代理策略、系统后台状态和 CDN 临时链接影响。
- **原版 Scripting 无法调用**：确认插件参数 `compat_mode` 已开启，并已安装 `apple-api.com`、`xiaobai.app` 的 MitM 证书信任。

## 文件

- `IPA-Tool-Enhanced.lpx`：Loon 插件入口。
- `IPAToolEnhanced.js`：轻量启动器；首次运行下载核心分片并保存到 `$persistentStore`，后续从本地缓存启动。
- `IPAToolEnhanced-Standalone.js`：完整单文件源码备份，仅包含在本回答提供的 ZIP 中；在线插件不直接调用。
- `.parts/`：启动器首次运行所需的 LZ 压缩核心分片。
- `CHANGELOG.md`：版本变更记录。
- `SHA256SUMS.txt`：文件完整性校验。

## 使用声明

仅用于你本人 Apple ID 已合法取得许可的应用。请遵守 Apple 服务条款、当地法律和应用开发者的授权范围。
