# Changelog

## 2.0.5 - 2026-07-19

- 修复 Apple 2026 年下载接口变更导致的 `5002 · An unknown error has occurred`。
- `volumeStoreDownloadProduct` 请求加入 `serialNumber=0`。
- 下载和许可请求补齐 `X-Token`、DSID、StoreFront 与 `application/x-apple-plist`。
- 登录会话新增 Pod 持久化，并使用 Pod 对应的 `p<Pod>-buy.itunes.apple.com`。
- 旧会话缺少 Pod 时自动尝试 `p25-buy` 与通用 `buy.itunes.apple.com`。
- 5002 增加节点切换、许可恢复和退避重试；许可接口的 5002 按已拥有许可处理。
- 历史版本读取与 Apple 官方包信息解耦，官方请求失败时可回退 Timbrd/Bilin 数据。
- 启动器改为首次拼接 20 个原始核心分片并保存到 `$persistentStore`，移除运行时字符串热补丁，降低更新失配风险。
- 脚本 URL 增加 `v=2.0.5` 强制刷新 Loon 缓存。

## 2.0.4 - 2026-07-19

- 修复商店地区填写 `zh` 导致 iTunes Search 返回 HTTP 400。
- 增加地区代码标准化，旧设置自动迁移为 `cn`。

## 2.0.3 - 2026-07-19

- 将 `MZFinance.BadLogin.Configurator_message` 识别为 Apple 双重认证挑战。
- 修复验证码输入框不显示的问题。

## 2.0.2 - 2026-07-19

- 支持邮箱和手机号 Apple ID。
- 双重认证验证码仅在 Apple 要求后显示。

## 2.0.1 - 2026-07-19

- 面板入口迁移到 `https://apple-api.com/ipa-tool`。

## 2.0.0 - 2026-07-19

- 首个完整 Loon 本地持久化控制面板版本。
