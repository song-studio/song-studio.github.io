# NOVA9 轨迹链接公开可访问性复核任务书

## 项目目录
`/Users/song/Desktop/Codex/song-studio.github.io/song-studio.github.io-work/`

## 先读取
- `data/inbox/2026-05-24/nova8-track-verification/route_track_verification_v8.json`
- `data/inbox/2026-05-24/nova8-track-verification/route_track_upgrade_patch_v8.json`
- `data/processed/outdoor_routes_v7.json`

## 输出目录
`data/inbox/2026-05-24/nova9-link-access/`

## 背景
Codex 自动检查发现：
- Oasistrek 麦理浩径页面可访问。
- 8264 首页可访问，但首页不能作为具体轨迹证据。
- 两步路链接在脚本校验中全部返回 HTTP 468，无法证明公开可访问。
- 用户反馈：有些轨迹点开是私有的，打不开。

所以本轮不要再泛泛找资料，只做“链接是否公开可打开”的人工复核。

## 任务目标
逐条人工打开 Nova8 里所有 `public_track_url` 和 `source_urls`，判断它们是否能作为生产页面中的外部轨迹链接。

## 每条路线输出字段
- `route_id`
- `name_zh`
- `checked_urls`: 数组，每个 URL 一个对象：
  - `url`
  - `url_type`: `specific_track` / `search_page` / `official_route_page` / `platform_homepage` / `article` / `invalid`
  - `access_status`: `public_open` / `login_required` / `private_or_deleted` / `blocked` / `not_specific` / `dead`
  - `can_show_to_user`: true / false
  - `why`: 中文说明，必须具体
- `best_public_url`: 最适合展示给用户的公开链接，没有就 null
- `best_public_url_label`: 例如“两步路搜索：乌孙古道”“官方路线页：麦理浩径”
- `final_track_grade`: `real_track` / `source_track` / `key_points` / `unverified`
- `final_can_navigate`: true / false
- `user_warning_zh`: 给页面展示的警示语
- `needs_remove_or_downgrade`: true / false
- `downgrade_reason`: 如果需要降级，说明原因

## 重要判定规则
1. 平台首页不能作为证据，例如 `https://www.8264.com/` 只能算 `platform_homepage`，`can_show_to_user=false`。
2. 搜索页可以作为“查找入口”，但不能证明有真实轨迹。搜索页只能支持 `source_track` 或 `key_points`，不能支持 `real_track`。
3. 需要登录才能打开的轨迹，不能作为公开链接展示。
4. 私有、删除、打不开的轨迹，必须标 `private_or_deleted` 或 `dead`。
5. 两步路具体轨迹如果打开后提示私有、登录、无权限，不能展示。
6. 年保玉则、鳌太这类禁行/关闭路线，不要给可导航轨迹，即使网上有旧轨迹，也要标 `final_can_navigate=false`。
7. 道路骑行/摩旅路线可以使用官方道路/OSM/高德路线作为参考，但必须说明“不是户外 GPX”。
8. 宁可降级，不要误导。

## 必须输出 3 个文件
1. `track_link_access_v9.json`
   - 主审计文件，包含 30 条路线。

2. `track_link_upgrade_patch_v9.json`
   - 只包含可安全合并到生产数据的字段，按 `route_id` 分组。
   - 不要包含打不开、私有、首页、无证据链接。

3. `nova9_link_qa.md`
   - 自检报告：哪些链接可公开展示，哪些必须删除，哪些路线必须降级。

## 完成后回复
“Nova9 链接公开性复核完成”。
