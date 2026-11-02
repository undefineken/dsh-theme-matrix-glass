# dsh-theme-matrix-glass

A DeepSeek Harness (dsh) theme plugin: Matrix-style **binary digital rain** (`0` and `1` only) plus a **frosted-glass** token layer. Digits spawn only while a task is running; when the task stops, spawning stops, the digits already on screen keep falling until they leave the bottom, and the canvas is cleared.

DeepSeek Harness（dsh）主题插件：黑客帝国式 **二进制数字雨**（字形只有 `0` 和 `1`）＋ **磨砂玻璃** token 层。只有任务运行时才生成数字；任务停止后停止生成，已在屏幕上的数字继续下落到离开画面底部，然后画布清空。

## What it does / 功能

| Behaviour | Detail |
|---|---|
| Binary rain gated by activity | Columns of `0`/`1` spawn only while a session reports `running: true`. Source: the session snapshot each surface receives (`byId[sessionId].running`, `current` session preferred). |
| Falls out, then blank | Stopping the gate stops spawning; live columns keep falling until `y - tail·lineHeight` passes the bottom edge, then the canvas is cleared (`clearRect`) and the `requestAnimationFrame` loop is cancelled. An idle screen costs nothing. |
| Low digit opacity | Default `0.10`, adjustable `0.02–0.28`. Only the head glyph of a column is brighter (global alpha capped at 1.0); tail glyphs fade as `pow(1 - i/tail, 1.7)`. |
| Frosted glass via theme tokens | A layer written through `theme.overrideTokens()` on the alias surface tokens (`bg-layer-1`, `bg-layer-2`, `bg-overlay`, `specific-sidebar-fill`), the border tokens, brand and label tokens. Translucent surfaces + green hairline borders. The documented `--dsw-menu-backdrop-filter` token is also set so menus blur; if a dsh line has no such token the call is skipped and the rest still applies. |
| Registered theme id | `theme.register({ id: 'matrix-glass', colorScheme: 'dark', … })`. The plugin never calls `setTheme()`: the layer sits on top of whatever light / dark / system appearance is already active. |
| Live configuration surface | A configuration card on this bundle's Plugin Manager page (`plugins.bundle.config` seat). Values persist in `localStorage` under `dsh-theme-matrix-glass:v1`. |

## Where it renders / 渲染位置

- Rain canvas: `shell.overlay` — the frame-wide, click-through layer (`inset: 0`). The canvas uses `position: fixed; inset: 0; z-index: -1; pointer-events: none`, with `mix-blend-mode: screen` in dark mode and `multiply` in light mode, so low-alpha digits do not dim body text.
- Settings card: `plugins.bundle.config`, keyed by the package name; renders `null` for the `summary` view.

## Settings / 可调项

| Control | Range | Default |
|---|---|---|
| 二进制数字雨 (rain) | on / off | on |
| 数字不透明度 (digit opacity) | 0.02 – 0.28 | 0.10 |
| 下落速度 (fall speed) | 40 – 400 px/s | 160 |
| 数字列密度 (column density) | 15 % – 100 % | 50 % |
| 字形大小 (glyph size) | 10 – 24 px | 15 px |
| 数字辉光 (glyph glow) | on / off | on |
| 运行判定范围 (activity source) | 仅当前会话 / 任意会话 | 仅当前会话 |
| 磨砂玻璃面板 (glass layer) | on / off | on |
| 面板不透明度 (panel opacity) | 0.45 – 0.92 | 0.68 |
| Matrix 深色调 (deep dark palette) | on / off | on |
| 试跑 6 秒 (test run) | button | — |
| 恢复默认 (reset) | button | — |

The card also carries a live state line: running → digits are falling / idle → all digits left the screen.

## Install / 安装

Plugin market: **设置 → 插件 → 插件市场 → 主题（Themes）**, then install `dsh-theme-matrix-glass`.

From a repository:

```sh
dsh plugin --profile desktop add github:undefineken/dsh-theme-matrix-glass
```

From npm, once published:

```sh
dsh plugin --profile desktop add dsh-theme-matrix-glass
```

From a local checkout: point the Plugin Manager installer at the folder holding this `package.json`. After installing, reload the page so the browser half loads.

## Uninstall / 卸载

设置 → 插件 → 本插件 → 关闭或卸载。The stylesheet, both token layers, the slot registrations, the animation loop and every listener are registered inside `ctx.effect`, so unloading removes all of them. The plugin never rewrites your appearance preference, so the UI returns to the previous light / dark choice.

## Repo layout / 目录

| Path | Purpose |
|---|---|
| `package.json` | declares `dsh.bundle.patch` (what makes it installable) and the `dsh.client` web half |
| `cordis.patch.yml` | one `insert` row mounting the Host entry and the Client half |
| `index.js` | Host half: intentionally empty — every behaviour is browser-side |
| `client.js` | rain engine, activity gate, token layers, configuration card, locale dictionary |
| `locale/zh.json`, `locale/en.json` | package metadata shown in the plugin list |
| `icon.svg` | card icon inside the Harness plugin manager |
| `assets/icon-market.png` | 192×192 raster tile for market storefronts (the entry `icon:` field) |
| `tools/make-market-icon.py` | regenerates that PNG (Pillow) |

## Notes / 说明

- Animation is throttled to ~30 fps, pauses while the tab is hidden, and reduces column count and fall speed under `prefers-reduced-motion`.
- Glyphs come from a small integer hash (`hash32(col.id, i, floor(now/220)) & 1`), so a column flickers between `0` and `1` the way the reference effect does, without a random allocation per frame.
- No shell access, no network requests, no tool registration, no writes to session data.

## 维护说明（给后续接手的人）

- Client 半区硬注入只有 `slots` 与 `locale`；`theme`、`sessions` 一律 `ctx.get()` 可选读取——注入表里写了运行时不提供的服务，`apply` 会整条不执行。
- 数字不透明度与面板不透明度是两个独立旋钮：前者影响阅读（默认 0.10），后者影响玻璃质感（默认 0.68，低于 0.45 正文对比度开始变差）。
- token 层用 `overrideTokens(source, …)` 叠加而不是改写主题本体：`source` 固定为包名，重复调用即替换同一层；卸载时 disposer 生效。
- 想改图标：`python tools/make-market-icon.py`（市场条目只接受 GitHub 托管的 **位图**，SVG 会被拒）。

## License

MIT
