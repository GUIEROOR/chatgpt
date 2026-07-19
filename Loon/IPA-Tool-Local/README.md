# IPA 工具箱增强版 · Loon

兼容原版 Loon 助手的两个入口：

- `https://apple-api.com`：Apple ID 登录、搜索、版本、许可和下载信息 API。
- `https://xiaobai.app`：为 Scripting 本地下载文件生成 OTA 安装清单。

增强版同时提供独立的 Loon 控制面板，可查询应用、查看历史版本、获取 Apple CDN 原始下载地址、导出 metadata 与 sinf。

## 一键安装

https://www.nsloon.com/openloon/import?plugin=https%3A%2F%2Fraw.githubusercontent.com%2FGUIEROOR%2Fchatgpt%2Fmain%2FLoon%2FIPA-Tool-Local%2FIPA-Tool-Enhanced.lpx

插件地址：

https://raw.githubusercontent.com/GUIEROOR/chatgpt/main/Loon/IPA-Tool-Local/IPA-Tool-Enhanced.lpx

## 打开面板

安装或更新插件后，启用插件与 MitM，保持 Loon VPN 运行，然后在 Safari 打开：

https://apple-api.com/ipa-tool

也可以在 Loon 的脚本页面手动运行“打开 IPA 工具箱面板”，再点击通知。

> 2.0.1 已弃用 `http://ipa-tool.local/`。Loon 常见配置会把 `*.local` 加入 `bypass-tun`，iOS 也把 `.local` 用作 mDNS，因此请求可能完全绕过 Loon。新入口复用原版已 MitM 的 `apple-api.com`。

## 面板打不开时

1. 在 Loon 插件页面先删除旧版“IPA 工具箱增强版”，再用上面的一键安装链接重新安装。
2. 确认插件已启用。
3. 确认 Loon VPN 已开启，不要使用全局直连模式。
4. 确认 MitM 已开启，Loon 证书已安装并在 iOS“关于本机 → 证书信任设置”中完全信任。
5. 检查 MitM hostname 中存在 `apple-api.com`。
6. Safari 关闭旧标签页后重新打开 `https://apple-api.com/ipa-tool`。
7. 仍无法打开时，在 Loon 的请求记录中搜索 `apple-api.com/ipa-tool`：若没有记录，说明流量没进入 Loon；若有记录但脚本未命中，更新插件资源或重装插件。

## 主要改进

- 移动端响应式网页、深色模式、iPhone/iPad 适配。
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

## 文件

- `IPA-Tool-Enhanced.lpx`：插件入口。
- `IPAToolEnhanced.js`：轻量启动器与 2.0.1 路由热修复。
- `.parts/`：首次运行下载的压缩核心分片。
- `CHANGELOG.md`：版本记录。

仅用于你本人 Apple ID 已合法取得许可的应用。
