# IPA 工具箱增强版 · Loon

兼容原版 Loon 助手：

- `https://apple-api.com`：Apple ID 登录、搜索、版本、许可和下载信息 API。
- `https://xiaobai.app`：为 Scripting 本地下载文件生成 OTA 安装清单。

增强版还提供独立的 Loon 控制面板，可查询应用、查看历史版本、获取 Apple CDN 原始下载地址、导出 metadata 与 sinf。

## 一键安装

https://www.nsloon.com/openloon/import?plugin=https%3A%2F%2Fraw.githubusercontent.com%2FGUIEROOR%2Fchatgpt%2Fmain%2FLoon%2FIPA-Tool-Local%2FIPA-Tool-Enhanced.lpx

插件地址：

https://raw.githubusercontent.com/GUIEROOR/chatgpt/main/Loon/IPA-Tool-Local/IPA-Tool-Enhanced.lpx

## 打开面板

安装或更新插件后，启用插件与 MitM，保持 Loon VPN 运行，然后在 Safari 打开：

https://apple-api.com/ipa-tool

也可以在 Loon 的脚本页面手动运行“打开 IPA 工具箱面板”，再点击通知。

## 2.0.4 商店地区修复

- App Store Search 的 country 参数必须是国家或地区代码，中文商店应使用 `cn`，而不是语言代码 `zh`。
- 旧版把设置中的 `zh` 原样发送给 iTunes Search，因此返回 HTTP 400。
- 2.0.4 会自动将 `zh`、`zh-CN`、`中国`、`中国大陆`、`china` 转为 `cn`。
- 同时支持香港 `hk`、澳门 `mo`、台湾 `tw`、美国 `us`、日本 `jp`、韩国 `kr`、新加坡 `sg` 等代码。
- 已保存为 `zh` 的旧设置会在打开面板时自动迁移为 `cn`，搜索框也会同步显示 `cn`。

## 2.0.3 双重认证修复

- Apple 私有登录接口可能使用 `MZFinance.BadLogin.Configurator_message` 表示需要继续双重认证。
- 旧版没有识别这个内部消息键，因此只显示“登录失败”，验证码框不会出现。
- 2.0.3 会将该响应识别为登录验证挑战，立即显示并聚焦 6 位验证码输入框。
- 若输入验证码后仍返回同一消息，会提示验证码可能过期、错误，或账号密码不正确。
- 如果手机完全没有收到 Apple 验证码，请先确认 Apple ID、密码以及受信任设备状态，不要连续反复尝试。

## 2.0.2 登录流程

- Apple ID 输入框支持邮箱和手机号，不再使用 Safari 的邮箱格式校验。
- 中国大陆手机号可以直接填写 `+86138...`。
- 从通讯录复制的 `+86 138-0013-8000`、括号、空格、短横线和全角 `＋` 会自动规范化。
- 首次只显示 Apple ID 和密码。
- Apple 返回双重认证要求后，页面才显示 6 位验证码输入框并自动聚焦。
- 验证码阶段会保留当前账号与密码，输入验证码后再次提交；成功后才清空密码。

## 面板打不开时

1. 在 Loon 插件页面点“更新资源”；若仍是旧界面，删除插件后重新一键安装。
2. 确认插件、Loon VPN 和 MitM 均已开启。
3. 确认 Loon 证书已经安装，并在 iOS“关于本机 → 证书信任设置”中完全信任。
4. 检查 MitM hostname 中包含 `apple-api.com`。
5. 彻底关闭 Safari 旧标签页，再重新打开 `https://apple-api.com/ipa-tool`。

> `http://ipa-tool.local/` 已弃用。`.local` 可能被 iOS mDNS 或 Loon 的 `bypass-tun` 绕过。

## 主要改进

- 响应式网页、深色模式、iPhone/iPad 适配。
- 历史版本索引先加载，下载详情按需查询，减少卡顿。
- 多账号、收藏、搜索记录、下载记录和版本缓存。
- 状态备份恢复、指数退避重试、HTTP/2 到 HTTP/1.1 回退。
- Timbrd 与 Bilin 版本源并发查询、去重合并。
- 下载以 302 直跳 Apple CDN，IPA 大文件不经过 JavaScript 中转。
- 密码默认不落盘；仅显式开启 `remember_password` 时保存。
- 保持原版 `/auth/*`、`/apps/*` 与 `xiaobai.app` 安装器兼容。

## 密码和隐私

默认不会持久化 Apple ID 密码，只保存 Apple 返回的 Cookie、DSID、passwordToken 和 StoreFront。若开启 `remember_password`，密码会以普通字符串保存在 Loon `$persistentStore`，仅建议在可信设备上使用。

## Loon 能力限制

Loon 没有通用文件目录、流式写文件、ZIP 编辑与重打包 API，因此不能纯靠 Loon 自动把 `iTunesMetadata.plist` 和 `.sinf` 注入 IPA。面板提供 Apple CDN 原始包和对应元数据导出；需要完整注入时仍需 Scripting、快捷指令或电脑程序。

仅用于你本人 Apple ID 已合法取得许可的应用。
