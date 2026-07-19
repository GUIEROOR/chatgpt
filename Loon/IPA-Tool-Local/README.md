# IPA 工具箱增强版 · Loon

兼容原版 Loon 助手：

- `https://apple-api.com`：Apple ID 登录、搜索、版本、许可和下载信息 API。
- `https://xiaobai.app`：为 Scripting 本地下载文件生成 OTA 安装清单。

增强版还提供独立的 Loon 控制面板，可查询应用、查看历史版本、获取 Apple CDN 原始下载地址、导出 metadata 与 sinf。

## 一键安装

https://www.nsloon.com/openloon/import?plugin=https%3A%2F%2Fraw.githubusercontent.com%2FGUIEROOR%2Fchatgpt%2Fmain%2FLoon%2FIPA-Tool-Local%2FIPA-Tool-Enhanced.lpx

插件地址：

https://raw.githubusercontent.com/GUIEROOR/chatgpt/main/Loon/IPA-Tool-Local/IPA-Tool-Enhanced.lpx

安装或更新后，保持 Loon、插件和 MitM 开启，再用 Safari 打开：

https://apple-api.com/ipa-tool

## 2.0.5：5002、下载与历史版本修复

Apple 在 2026 年 6 月调整了 `volumeStoreDownloadProduct` 的校验。部分应用在下载请求缺少设备序列号时会返回：

`5002 · An unknown error has occurred`

2.0.5 做了以下修复：

- 下载请求加入 `serialNumber=0`。
- 补齐 `X-Token`、`X-Dsid`、`iCloud-DSID` 和 `X-Apple-Store-Front`。
- 登录时保存 Apple 返回的 Pod，并优先使用 `p<Pod>-buy.itunes.apple.com`。
- 对旧会话没有 Pod 的情况，自动尝试 Pod、`p25-buy` 与 `buy.itunes.apple.com` 节点。
- 遇到 5002 时依次尝试节点切换、免费许可恢复和短暂退避重试。
- `5002` 出现在获取许可接口时按“已经拥有许可”处理，不再误报失败。
- 历史版本索引与 Apple 下载详情解耦：Apple 官方详情暂时失败时，只要 Timbrd 或 Bilin 仍可用，历史版本列表仍会显示。
- 只有点击某个版本的“查看下载详情”时才请求 Apple 包信息，减少卡顿和无效请求。

### 更新后仍出现 5002

1. 在 Loon 插件页确认说明显示 `2.0.5`。
2. 关闭 Safari 旧标签页，再打开 `https://apple-api.com/ipa-tool`。
3. 点一次“刷新 Cookie”；若没有保存密码，则重新登录。
4. 确认应用在当前账号所属商店地区存在，且免费应用已取得许可。
5. 下架、付费、地区不一致或账号没有许可的应用，Apple 仍可能拒绝提供下载信息。

## 2.0.4：商店地区修复

- `zh` 是语言代码，中文 App Store 应使用 `cn`。
- `zh`、`zh-CN`、`中国`、`中国大陆`、`china` 会自动转换为 `cn`。
- 支持 `hk`、`mo`、`tw`、`us`、`jp`、`kr`、`sg` 等地区代码。

## 2.0.3：双重认证修复

- 将 `MZFinance.BadLogin.Configurator_message` 识别为 Apple 双重认证挑战。
- 验证码框仅在 Apple 要求后显示并自动聚焦。

## 2.0.2：手机号 Apple ID

- Apple ID 支持邮箱和 `+86` 手机号。
- 自动规范化手机号中的空格、括号、短横线和全角 `＋`。

## 本地持久化方式

2.0.5 的轻量启动器首次运行时并发下载 20 个原始核心分片，拼接校验后保存到 Loon `$persistentStore`。后续打开面板直接使用本地缓存。旧 `.parts/` 压缩文件仅为历史版本兼容保留。

## 密码和隐私

默认不会持久化 Apple ID 密码，只保存 Apple 返回的 Cookie、DSID、passwordToken、StoreFront 和 Pod。若开启 `remember_password`，密码会以普通字符串保存在 Loon `$persistentStore`，仅建议在可信设备上使用。

## Loon 能力限制

Loon 没有通用文件目录、流式写文件、ZIP 编辑与重打包 API，因此不能纯靠 Loon 自动把 `iTunesMetadata.plist` 和 `.sinf` 注入 IPA。面板提供 Apple CDN 原始包和对应元数据导出；需要完整注入时仍需 Scripting、快捷指令或电脑程序。

## 验证

发布前已完成 JavaScript 语法检查、首次核心加载与持久化缓存测试、登录 Pod 保存测试、5002 自动恢复测试、下载请求头与 `serialNumber=0` 校验，以及 Apple 官方详情失败时的历史版本回退测试。尚未替代真实 Apple ID 在所有地区和应用上的实机验证。

仅用于你本人 Apple ID 已合法取得许可的应用。
