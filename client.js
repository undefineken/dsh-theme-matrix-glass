/**
 * Client half of `dsh-theme-matrix-glass`.
 *
 * What it contributes to the Harness Web GUI:
 *
 * 1. A frame-wide digital-rain surface (`shell.overlay`, click-through): binary
 *    digits — only `0` and `1` — falling in columns. Digits are spawned only
 *    while a task is running; the moment the task stops spawning stops, every
 *    remaining column keeps falling until it leaves the bottom of the screen,
 *    and the canvas is cleared and its animation loop parked. Idle screen = blank.
 * 2. A frosted-glass token layer over the active theme, written through
 *    `ctx.theme.overrideTokens` (the sanctioned layer API: translucent surfaces,
 *    green hairline borders), so the app keeps its own light/dark behaviour.
 * 3. A registered theme id (`matrix-glass`) so the palette is selectable, and a
 *    configuration card on this bundle's Plugin Manager page where every value,
 *    including the digit opacity, is adjustable live.
 *
 * Everything is registered inside `ctx.effect` so unload removes the stylesheet,
 * the token layers, the animation loop, the listeners, and the slot entries.
 */
window.__ModuleLoader__.load({
  id: 'dsh-theme-matrix-glass',
  factory(require) {
    'use strict';

    const React = require('react');
    const h = React.createElement;

    const PKG = 'dsh-theme-matrix-glass';
    const NS = 'settings.matrix-glass';
    const THEME_ID = 'matrix-glass';
    const MENU_LAYER_ID = PKG + ':menu';
    const LS_KEY = 'dsh-theme-matrix-glass:v1';

    /** Tunables. Digit opacity defaults low on purpose: reading stays primary. */
    const DEFAULTS = {
      rain: true,
      opacity: 0.1,
      speed: 160,
      density: 0.5,
      fontSize: 15,
      glow: true,
      gate: 'current',
      glass: true,
      panelAlpha: 0.68,
      deepDark: true,
    };

    const DICT = {
      zh: {
        title: 'Matrix 数字雨 · 磨砂玻璃',
        intro: '任务运行时 0/1 数字一列列落下；任务停止后停止生成，已有数字继续落出屏幕，画面归空。',
        rain: '二进制数字雨',
        rainNote: '开关数字雨本身；关闭后画面立即归空。',
        opacity: '数字不透明度',
        opacityNote: '默认 0.10。保持低透明度，不影响正常 UI 阅读。',
        speed: '下落速度',
        density: '数字列密度',
        fontSize: '字形大小',
        glow: '数字辉光',
        gate: '运行判定范围',
        gateCurrent: '仅当前会话',
        gateAny: '任意会话',
        glass: '磨砂玻璃面板',
        panelAlpha: '面板不透明度',
        panelAlphaNote: '越低越透明。0.45 以下会开始影响正文对比度。',
        deepDark: 'Matrix 深色调',
        deepDarkNote: '仅作用于深色模式：近黑绿背景与绿色描边。',
        testRun: '试跑 6 秒',
        reset: '恢复默认',
        stateRunning: '运行中：数字正在下落',
        stateIdle: '空闲：数字已落尽，画面空白',
        statusNote: '状态来自会话运行态，无需手动切换。',
      },
      en: {
        title: 'Matrix Rain · Frosted Glass',
        intro: 'Digits spawn only while a task runs. When it stops, spawning stops, the remaining columns fall off screen, and the canvas clears.',
        rain: 'Binary digital rain',
        rainNote: 'Turns the rain itself off; the screen clears at once.',
        opacity: 'Digit opacity',
        opacityNote: 'Default 0.10. Keep it low so the UI stays readable.',
        speed: 'Fall speed',
        density: 'Column density',
        fontSize: 'Glyph size',
        glow: 'Glyph glow',
        gate: 'Activity source',
        gateCurrent: 'Current session',
        gateAny: 'Any session',
        glass: 'Frosted-glass panels',
        panelAlpha: 'Panel opacity',
        panelAlphaNote: 'Lower is more transparent. Below 0.45 body text contrast starts to suffer.',
        deepDark: 'Matrix deep palette',
        deepDarkNote: 'Dark mode only: near-black green base with green hairlines.',
        testRun: 'Test run 6s',
        reset: 'Reset defaults',
        stateRunning: 'Running: digits are falling',
        stateIdle: 'Idle: all digits left the screen',
        statusNote: 'Driven by session run state; no manual switch needed.',
      },
    };

    const CSS = `
.mg-layer { position: fixed; inset: 0; z-index: -1; pointer-events: none; mix-blend-mode: multiply; }
body[data-ds-dark-theme] .mg-layer { mix-blend-mode: screen; }
.mg-canvas { display: block; width: 100%; height: 100%; }

.mg-card { display: flex; flex-direction: column; gap: 12px; padding: 16px; border-radius: 14px;
  background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-border-l1);
  backdrop-filter: blur(14px) saturate(1.2); }
.mg-head { display: flex; flex-direction: column; gap: 4px; }
.mg-title { color: var(--dsw-alias-label-primary); font-size: 14px; font-weight: 600; }
.mg-intro { color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 1.5; }
.mg-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.mg-rowText { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.mg-label { color: var(--dsw-alias-label-primary); font-size: 13px; }
.mg-note { color: var(--dsw-alias-label-secondary); font-size: 11px; line-height: 1.45; }
.mg-value { color: var(--dsw-alias-label-secondary); font-size: 12px; min-width: 62px; text-align: right;
  font-variant-numeric: tabular-nums; }
.mg-control { display: flex; align-items: center; gap: 8px; flex: none; }
.mg-card input[type="range"] { width: 168px; accent-color: var(--dsw-alias-brand-primary); }
.mg-switch { position: relative; width: 40px; height: 22px; border-radius: 11px; cursor: pointer;
  border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-2); }
.mg-switch[aria-checked="true"] { background: var(--dsw-alias-brand-primary); }
.mg-switch-thumb { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%;
  background: var(--dsw-alias-switch-thumb, #ffffff); transition: transform 0.16s ease; }
.mg-switch[aria-checked="true"] .mg-switch-thumb { transform: translateX(18px); }
.mg-select { padding: 4px 8px; border-radius: 8px; font-size: 12px;
  color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-layer-2);
  border: 1px solid var(--dsw-alias-border-l1); }
.mg-btn { padding: 6px 10px; border-radius: 8px; font-size: 12px; cursor: pointer;
  color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-layer-2);
  border: 1px solid var(--dsw-alias-border-l1); }
.mg-btn:hover { border-color: var(--dsw-alias-border-l2); }
.mg-actions { display: flex; gap: 8px; }
.mg-state { display: flex; align-items: center; gap: 8px; color: var(--dsw-alias-label-secondary); font-size: 12px; }
.mg-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--dsw-alias-state-idle-primary); }
.mg-dot[data-busy="true"] { background: var(--dsw-alias-state-success-primary); }
`;

    // ------------------------------------------------------------------ store

    function readSaved() {
      try {
        const raw = window.localStorage.getItem(LS_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
      } catch {
        return {};
      }
    }

    function createSettingsStore() {
      let value = { ...DEFAULTS, ...sanitise(readSaved()) };
      const listeners = new Set();
      const emit = () => {
        for (const fn of listeners) {
          try {
            fn();
          } catch {
            /* a listener of another surface must not break this one */
          }
        }
      };
      return {
        get: () => value,
        set(patch) {
          value = { ...value, ...sanitise(patch) };
          try {
            window.localStorage.setItem(LS_KEY, JSON.stringify(value));
          } catch {
            /* storage unavailable: the session keeps the values in memory */
          }
          emit();
        },
        reset() {
          value = { ...DEFAULTS };
          try {
            window.localStorage.removeItem(LS_KEY);
          } catch {
            /* ignore */
          }
          emit();
        },
        subscribe(fn) {
          listeners.add(fn);
          return () => listeners.delete(fn);
        },
      };
    }

    function numberWithin(raw, fallback, min, max) {
      const n = typeof raw === 'number' ? raw : Number(raw);
      if (!Number.isFinite(n)) return fallback;
      return Math.min(max, Math.max(min, n));
    }

    function sanitise(raw) {
      const source = raw && typeof raw === 'object' ? raw : {};
      const out = {};
      if (typeof source.rain === 'boolean') out.rain = source.rain;
      if (typeof source.glow === 'boolean') out.glow = source.glow;
      if (typeof source.glass === 'boolean') out.glass = source.glass;
      if (typeof source.deepDark === 'boolean') out.deepDark = source.deepDark;
      if (source.gate === 'current' || source.gate === 'any') out.gate = source.gate;
      if ('opacity' in source) out.opacity = numberWithin(source.opacity, DEFAULTS.opacity, 0.02, 0.28);
      if ('speed' in source) out.speed = numberWithin(source.speed, DEFAULTS.speed, 40, 400);
      if ('density' in source) out.density = numberWithin(source.density, DEFAULTS.density, 0.15, 1);
      if ('fontSize' in source) out.fontSize = Math.round(numberWithin(source.fontSize, DEFAULTS.fontSize, 10, 24));
      if ('panelAlpha' in source) out.panelAlpha = numberWithin(source.panelAlpha, DEFAULTS.panelAlpha, 0.45, 0.92);
      return out;
    }

    // ------------------------------------------------------- digital rain engine

    function hash32(a, b, c) {
      let x = (a * 374761393 + b * 668265263 + c * 2654435761) >>> 0;
      x = (x ^ (x >>> 15)) >>> 0;
      x = (x * 2246822519) >>> 0;
      x = (x ^ (x >>> 13)) >>> 0;
      x = (x * 3266489917) >>> 0;
      return (x ^ (x >>> 16)) >>> 0;
    }

    function createRainEngine(store) {
      let canvas;
      let paint;
      let width = 0;
      let height = 0;
      let dpr = 1;
      let columns = [];
      let raf = 0;
      let last = 0;
      let acc = 0;
      let spawnAcc = 0;
      let busy = false;
      let forcedUntil = 0;
      let nextId = 1;

      const busyListeners = new Set();
      const reducedMotion = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
      const MIN_FRAME_MS = 1000 / 30;

      function notifyBusy() {
        for (const fn of busyListeners) {
          try {
            fn();
          } catch {
            /* ignore */
          }
        }
      }

      function raining() {
        if (!store.get().rain) return false;
        return busy || forcedUntil > performance.now();
      }

      function lineHeight(cfg) {
        return cfg.fontSize * 1.3;
      }

      function columnWidth(cfg) {
        return cfg.fontSize * 1.45;
      }

      function targetCount(cfg) {
        if (!width) return 0;
        const slots = Math.max(4, Math.floor(width / columnWidth(cfg)));
        const calm = reducedMotion && reducedMotion.matches ? 0.45 : 1;
        return Math.max(1, Math.round(slots * cfg.density * calm));
      }

      function newColumn(x, startY, cfg) {
        const salt = nextId;
        const tail = 8 + (hash32(salt, x | 0, 7) % 11);
        const calm = reducedMotion && reducedMotion.matches ? 0.55 : 1;
        const speedJitter = 0.6 + (hash32(salt, tail, 13) % 90) / 100;
        return {
          id: nextId++,
          slot: Math.floor(x / columnWidth(cfg)),
          x,
          y: startY,
          v: cfg.speed * speedJitter * calm,
          tail,
          line: lineHeight(cfg),
        };
      }

      function freeSlot(cfg) {
        const slots = Math.max(1, Math.floor(width / columnWidth(cfg)));
        const taken = new Set();
        for (const col of columns) taken.add(col.slot);
        const open = [];
        for (let i = 0; i < slots; i++) if (!taken.has(i)) open.push(i);
        if (!open.length) return -1;
        const slot = open[hash32(nextId, slots, open.length) % open.length];
        return slot * columnWidth(cfg) + (hash32(slot, nextId, 3) % 4);
      }

      function spawnStep(dtMs) {
        if (!raining()) return;
        const cfg = store.get();
        const target = targetCount(cfg);
        if (columns.length >= target) {
          spawnAcc = 0;
          return;
        }
        const meanLifeSec = Math.max(0.8, (height * 1.4) / Math.max(40, cfg.speed));
        const perSecond = Math.max(0.4, target / meanLifeSec);
        spawnAcc += dtMs;
        let guard = 0;
        while (spawnAcc >= 1000 / perSecond && columns.length < target && guard < 12) {
          spawnAcc -= 1000 / perSecond;
          guard += 1;
          const x = freeSlot(cfg);
          if (x < 0) {
            spawnAcc = 0;
            break;
          }
          columns.push(newColumn(x, -Math.random() * 220 - 12, cfg));
        }
      }

      function clear() {
        if (!paint || !width) return;
        paint.setTransform(dpr, 0, 0, dpr, 0, 0);
        paint.clearRect(0, 0, width, height);
      }

      function stop() {
        if (raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      }

      function start() {
        if (raf || !paint) return;
        last = performance.now();
        acc = 0;
        raf = requestAnimationFrame(frame);
      }

      function frame(now) {
        raf = requestAnimationFrame(frame);
        let dt = now - last;
        last = now;
        if (dt > 240) dt = 240;
        acc += dt;
        if (acc < MIN_FRAME_MS) return;
        const step = acc;
        acc = 0;
        const cfg = store.get();
        if (!width || !height) return;

        spawnStep(step);

        paint.setTransform(dpr, 0, 0, dpr, 0, 0);
        paint.clearRect(0, 0, width, height);
        paint.textBaseline = 'top';
        paint.font = cfg.fontSize + 'px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

        const hue = 140;
        const glyphTick = Math.floor(now / 220);
        for (const col of columns) {
          col.y += (col.v * step) / 1000;
          for (let i = 0; i < col.tail; i++) {
            const y = col.y - i * col.line;
            if (y > height + col.line || y < -col.line) continue;
            const fade = i === 0 ? 1 : Math.pow(1 - i / col.tail, 1.7);
            const alpha = cfg.opacity * fade;
            if (alpha <= 0.004) continue;
            const head = i === 0;
            paint.globalAlpha = head ? Math.min(1, alpha * 2) : alpha;
            paint.fillStyle = head
              ? 'hsl(' + hue + ', 40%, 92%)'
              : 'hsl(' + hue + ', 92%, ' + (44 + fade * 16) + '%)';
            if (head && cfg.glow) {
              paint.shadowColor = 'hsla(' + hue + ', 95%, 62%, 0.7)';
              paint.shadowBlur = cfg.fontSize * 0.65;
            } else {
              paint.shadowBlur = 0;
            }
            paint.fillText(hash32(col.id, i, glyphTick) & 1 ? '1' : '0', col.x, y);
          }
          paint.shadowBlur = 0;
        }
        paint.globalAlpha = 1;

        columns = columns.filter((col) => col.y - col.tail * col.line <= height + col.line);

        if (!columns.length && !raining()) {
          clear();
          stop();
        }
      }

      function resize() {
        if (!canvas || !paint) return;
        dpr = Math.min(2, window.devicePixelRatio || 1);
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = Math.max(1, Math.round(width * dpr));
        canvas.height = Math.max(1, Math.round(height * dpr));
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        clear();
        if (raining()) start();
      }

      function attach(el) {
        canvas = el;
        paint = el && typeof el.getContext === 'function' ? el.getContext('2d') : null;
        resize();
        if (raining()) start();
        return () => {
          stop();
          paint = undefined;
          canvas = undefined;
        };
      }

      function setBusy(next) {
        const value = !!next;
        if (value === busy) return;
        busy = value;
        notifyBusy();
        if (value) {
          start();
        } else if (raf) {
          // Keep animating: the live columns must fall out of the screen, then the loop parks itself.
        }
      }

      function forceRun(ms) {
        forcedUntil = performance.now() + ms;
        start();
      }

      function syncFromStore() {
        const cfg = store.get();
        if (!cfg.rain) {
          forcedUntil = 0;
          columns = [];
          clear();
          stop();
        } else if (raining()) {
          start();
        }
      }

      const onResize = () => resize();
      const onVisibility = () => {
        if (document.hidden) stop();
        else if (raining()) start();
      };
      window.addEventListener('resize', onResize);
      document.addEventListener('visibilitychange', onVisibility);
      if (reducedMotion && typeof reducedMotion.addEventListener === 'function') {
        reducedMotion.addEventListener('change', onResize);
      }

      return {
        attach,
        setBusy,
        forceRun,
        syncFromStore,
        resize,
        isBusy: () => busy,
        busySnapshot: () => busy,
        busySubscribe(fn) {
          busyListeners.add(fn);
          return () => busyListeners.delete(fn);
        },
        dispose() {
          stop();
          window.removeEventListener('resize', onResize);
          document.removeEventListener('visibilitychange', onVisibility);
          if (reducedMotion && typeof reducedMotion.removeEventListener === 'function') {
            reducedMotion.removeEventListener('change', onResize);
          }
          busyListeners.clear();
          columns = [];
          paint = undefined;
          canvas = undefined;
        },
      };
    }

    // ------------------------------------------------ frosted-glass token layer

    function hsl(h, s, l) {
      return 'hsl(' + h + ', ' + s + '%, ' + l + '%)';
    }

    function hsla(h, s, l, a) {
      return 'hsla(' + h + ', ' + s + '%, ' + l + '%, ' + a + ')';
    }

    const HUE = 140;

    /**
     * Only tokens the Harness theme registry lists are written here, so a theme
     * upgrade degrades appearance at worst instead of breaking rendering.
     */
    function glassTokens(cfg) {
      const a = cfg.panelAlpha;
      const deep = cfg.deepDark;
      return {
        '--dsw-alias-bg-base': {
          light: 'hsl(150, 18%, 96%)',
          dark: deep ? hsl(HUE, 45, 3) : 'hsl(220, 14%, 8%)',
        },
        '--dsw-alias-bg-layer-1': {
          light: hsla(150, 24, 94, a),
          dark: hsla(HUE, 30, 12, a),
        },
        '--dsw-alias-bg-layer-2': {
          light: hsla(150, 26, 98, Math.min(0.95, a + 0.06)),
          dark: hsla(HUE, 28, 16, Math.min(0.95, a + 0.06)),
        },
        '--dsw-alias-bg-overlay': {
          light: hsla(150, 22, 99, Math.min(0.96, a + 0.18)),
          dark: hsla(HUE, 26, 10, Math.min(0.96, a + 0.18)),
        },
        '--dsw-alias-border-l1': {
          light: hsla(HUE, 60, 38, 0.2),
          dark: hsla(HUE, 70, 55, 0.18),
        },
        '--dsw-alias-border-l2': {
          light: hsla(HUE, 65, 32, 0.38),
          dark: hsla(HUE, 80, 60, 0.34),
        },
        '--dsw-alias-brand-primary': {
          light: 'hsl(' + HUE + ', 78%, 34%)',
          dark: 'hsl(' + HUE + ', 85%, 52%)',
        },
        '--dsw-alias-label-primary': {
          light: 'hsl(160, 20%, 12%)',
          dark: hsl(HUE, 25, 96),
        },
        '--dsw-alias-label-secondary': {
          light: hsla(160, 14, 30, 0.88),
          dark: hsla(HUE, 18, 76, 0.9),
        },
        '--dsw-alias-state-idle-primary': {
          light: hsla(HUE, 20, 45, 0.8),
          dark: hsla(HUE, 20, 45, 0.85),
        },
        '--dsw-alias-state-success-primary': {
          light: 'hsl(' + HUE + ', 72%, 34%)',
          dark: 'hsl(' + HUE + ', 80%, 62%)',
        },
        '--dsw-specific-sidebar-fill': {
          light: hsla(150, 20, 92, Math.max(0.55, a - 0.04)),
          dark: hsla(HUE, 40, deep ? 5 : 8, Math.max(0.55, a - 0.04)),
        },
      };
    }

    function themeDefinition(cfg) {
      const pairs = glassTokens(cfg);
      const tokens = {};
      for (const name of Object.keys(pairs)) {
        tokens[name] = pairs[name].dark;
      }
      return { id: THEME_ID, colorScheme: 'dark', tokens };
    }

    // ------------------------------------------------------------- activity gate

    function isBusySnapshot(snapshot, gate) {
      if (!snapshot) return false;
      const byId = snapshot.byId && typeof snapshot.byId === 'object' ? snapshot.byId : {};
      const current = snapshot.current;
      if (gate === 'current' && typeof current === 'string' && byId[current]) return !!byId[current].running;
      const ids = Array.isArray(snapshot.ids) ? snapshot.ids : Object.keys(byId);
      for (const id of ids) {
        const item = byId[id];
        if (item && item.running) return true;
      }
      return false;
    }

    function useExternalSessions(sessions) {
      const list = sessions && sessions.list;
      const subscribe = list && typeof list.subscribe === 'function' ? list.subscribe.bind(list) : () => () => {};
      const getSnapshot = list && typeof list.getSnapshot === 'function' ? list.getSnapshot.bind(list) : () => null;
      return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
    }

    function useSessionSnapshot(props) {
      const strategy = React.useRef(null);
      if (strategy.current === null) {
        strategy.current = typeof props.useSessions === 'function' ? 'slot' : 'service';
      }
      if (strategy.current === 'slot') return props.useSessions((snapshot) => snapshot);
      return useExternalSessions(props.sessions);
    }

    // ------------------------------------------------------------------ surfaces

    function RainSurface(props) {
      const engine = props.engine;
      const store = props.store;
      const canvasRef = React.useRef(null);
      const settings = React.useSyncExternalStore(store.subscribe, store.get, store.get);
      const snapshot = useSessionSnapshot(props);
      const busy = isBusySnapshot(snapshot, settings.gate);

      React.useEffect(() => engine.attach(canvasRef.current), [engine]);
      React.useEffect(() => engine.setBusy(busy), [engine, busy]);

      return h(
        'div',
        { className: 'mg-layer', 'aria-hidden': 'true' },
        h('canvas', { className: 'mg-canvas', ref: canvasRef }),
      );
    }

    function Switch(props) {
      const on = !!props.value;
      return h(
        'button',
        {
          className: 'mg-switch',
          type: 'button',
          role: 'switch',
          'aria-checked': on ? 'true' : 'false',
          'aria-label': props.label,
          onClick: () => props.onChange(!on),
        },
        h('span', { className: 'mg-switch-thumb' }),
      );
    }

    function Row(props) {
      return h(
        'div',
        { className: 'mg-row' },
        h(
          'div',
          { className: 'mg-rowText' },
          h('div', { className: 'mg-label' }, props.label),
          props.note ? h('div', { className: 'mg-note' }, props.note) : null,
        ),
        h('div', { className: 'mg-control' }, props.control),
      );
    }

    function ConfigCard(props) {
      // The Plugins page also projects a summary view; keep the card off it.
      if (props.view === 'summary') return null;

      const store = props.store;
      const engine = props.engine;
      const t = props.t;
      const cfg = React.useSyncExternalStore(store.subscribe, store.get, store.get);
      const busy = React.useSyncExternalStore(engine.busySubscribe, engine.busySnapshot, engine.busySnapshot);

      const percent = (value) => Math.round(value * 100) + '%';
      const px = (value) => value + ' px';
      const perSecond = (value) => value + ' px/s';

      return h(
        'div',
        { className: 'mg-card' },
        h(
          'div',
          { className: 'mg-head' },
          h('div', { className: 'mg-title' }, t('title')),
          h('div', { className: 'mg-intro' }, t('intro')),
        ),
        h(
          'div',
          { className: 'mg-state' },
          h('span', { className: 'mg-dot', 'data-busy': busy ? 'true' : 'false' }),
          h('span', null, busy ? t('stateRunning') : t('stateIdle')),
          h('span', { className: 'mg-note' }, t('statusNote')),
        ),
        Row({
          label: t('rain'),
          note: t('rainNote'),
          control: h(Switch, { value: cfg.rain, label: t('rain'), onChange: (next) => store.set({ rain: next }) }),
        }),
        Row({
          label: t('opacity'),
          note: t('opacityNote'),
          control: [
            h('span', { key: 'v', className: 'mg-value' }, percent(cfg.opacity)),
            h('input', {
              key: 'i',
              type: 'range',
              min: 0.02,
              max: 0.28,
              step: 0.01,
              value: cfg.opacity,
              'aria-label': t('opacity'),
              onChange: (event) => store.set({ opacity: Number(event.target.value) }),
            }),
          ],
        }),
        Row({
          label: t('speed'),
          control: [
            h('span', { key: 'v', className: 'mg-value' }, perSecond(cfg.speed)),
            h('input', {
              key: 'i',
              type: 'range',
              min: 40,
              max: 400,
              step: 10,
              value: cfg.speed,
              'aria-label': t('speed'),
              onChange: (event) => store.set({ speed: Number(event.target.value) }),
            }),
          ],
        }),
        Row({
          label: t('density'),
          control: [
            h('span', { key: 'v', className: 'mg-value' }, percent(cfg.density)),
            h('input', {
              key: 'i',
              type: 'range',
              min: 0.15,
              max: 1,
              step: 0.05,
              value: cfg.density,
              'aria-label': t('density'),
              onChange: (event) => store.set({ density: Number(event.target.value) }),
            }),
          ],
        }),
        Row({
          label: t('fontSize'),
          control: [
            h('span', { key: 'v', className: 'mg-value' }, px(cfg.fontSize)),
            h('input', {
              key: 'i',
              type: 'range',
              min: 10,
              max: 24,
              step: 1,
              value: cfg.fontSize,
              'aria-label': t('fontSize'),
              onChange: (event) => store.set({ fontSize: Number(event.target.value) }),
            }),
          ],
        }),
        Row({
          label: t('glow'),
          control: h(Switch, { value: cfg.glow, label: t('glow'), onChange: (next) => store.set({ glow: next }) }),
        }),
        Row({
          label: t('gate'),
          control: h(
            'select',
            {
              className: 'mg-select',
              value: cfg.gate,
              'aria-label': t('gate'),
              onChange: (event) => store.set({ gate: event.target.value }),
            },
            h('option', { value: 'current' }, t('gateCurrent')),
            h('option', { value: 'any' }, t('gateAny')),
          ),
        }),
        Row({
          label: t('glass'),
          control: h(Switch, { value: cfg.glass, label: t('glass'), onChange: (next) => store.set({ glass: next }) }),
        }),
        Row({
          label: t('panelAlpha'),
          note: t('panelAlphaNote'),
          control: [
            h('span', { key: 'v', className: 'mg-value' }, percent(cfg.panelAlpha)),
            h('input', {
              key: 'i',
              type: 'range',
              min: 0.45,
              max: 0.92,
              step: 0.01,
              value: cfg.panelAlpha,
              'aria-label': t('panelAlpha'),
              onChange: (event) => store.set({ panelAlpha: Number(event.target.value) }),
            }),
          ],
        }),
        Row({
          label: t('deepDark'),
          note: t('deepDarkNote'),
          control: h(Switch, { value: cfg.deepDark, label: t('deepDark'), onChange: (next) => store.set({ deepDark: next }) }),
        }),
        h(
          'div',
          { className: 'mg-actions' },
          h('button', { className: 'mg-btn', type: 'button', onClick: () => engine.forceRun(6000) }, t('testRun')),
          h('button', { className: 'mg-btn', type: 'button', onClick: () => store.reset() }, t('reset')),
        ),
      );
    }

    // ------------------------------------------------------------------ lifecycle

    const inject = ['slots', 'locale'];

    function apply(ctx) {
      const store = createSettingsStore();
      const engine = createRainEngine(store);
      const theme = ctx.get('theme');
      const sessions = ctx.get('sessions');

      ctx.effect(() => {
        if (typeof styles !== 'undefined' && styles && typeof styles.insert === 'function') {
          return styles.insert(CSS);
        }
        const tag = document.createElement('style');
        tag.textContent = CSS;
        document.head.appendChild(tag);
        return () => tag.remove();
      }, PKG + ': styles');

      // `ctx.effect` accepts a disposer factory; keep the engine teardown explicit.
      const disposeEngine = () => engine.dispose();

      ctx.effect(() => {
        engine.syncFromStore();
        return store.subscribe(() => engine.syncFromStore());
      }, PKG + ': store sync');

      if (theme) {
        ctx.effect(() => {
          try {
            return theme.register(themeDefinition(store.get()));
          } catch (error) {
            // A duplicate id (a second activation in the same page) must not take the rest of the plugin down.
            console.error(PKG + ': theme registration skipped:', error);
            return () => {};
          }
        }, PKG + ': theme definition');

        let disposeLayer;
        let disposeMenu;
        const push = () => {
          const cfg = store.get();
          if (disposeLayer) {
            disposeLayer();
            disposeLayer = undefined;
          }
          if (disposeMenu) {
            disposeMenu();
            disposeMenu = undefined;
          }
          if (!cfg.glass) return;
          try {
            disposeLayer = theme.overrideTokens(PKG, glassTokens(cfg));
          } catch (error) {
            console.error(PKG + ': glass token layer rejected:', error);
          }
          try {
            // Documented menu token: makes the frosted blur actually blur.
            disposeMenu = theme.overrideTokens(MENU_LAYER_ID, {
              '--dsw-menu-backdrop-filter': {
                light: 'blur(16px) saturate(1.25)',
                dark: 'blur(16px) saturate(1.25)',
              },
            });
          } catch {
            /* token absent on this line: the glass keeps its translucency only */
          }
        };
        push();
        ctx.effect(() => store.subscribe(push), PKG + ': glass token layer');
        ctx.effect(() => disposeEngine, PKG + ': rain engine');
      } else {
        ctx.effect(() => disposeEngine, PKG + ': rain engine');
      }

      ctx.effect(() => {
        if (!ctx.locale || typeof ctx.locale.register !== 'function') return () => {};
        return ctx.locale.register(NS, { zh: DICT.zh, en: DICT.en });
      }, PKG + ': locale');

      const t = ctx.locale && typeof ctx.locale.bind === 'function'
        ? ctx.locale.bind(NS)
        : (key) => (DICT.zh[key] || DICT.en[key] || key);

      ctx.effect(() => {
        const disposers = [];
        try {
          disposers.push(ctx.slots.inject('shell.overlay', () => ctx.slots.register({
            name: 'shell.overlay',
            id: 'matrix-glass.rain',
            order: -100,
            locale: NS,
            label: () => t('title'),
            inject: () => ({ engine, store, sessions }),
          }, RainSurface)));
        } catch (error) {
          console.error(PKG + ': shell.overlay registration failed:', error);
        }
        try {
          disposers.push(ctx.slots.inject('plugins.bundle.config', () => ctx.slots.register({
            name: 'plugins.bundle.config',
            key: PKG,
            locale: NS,
            inject: () => ({ engine, store, t }),
          }, ConfigCard)));
        } catch (error) {
          console.error(PKG + ': bundle configuration card registration failed:', error);
        }
        return () => {
          for (const dispose of disposers) {
            try {
              if (typeof dispose === 'function') dispose();
            } catch {
              /* one disposer failing must not skip the rest */
            }
          }
        };
      }, PKG + ': slots');
    }

    return { inject, apply };
  },
});
