/**
 * Host half of the Matrix rain + frosted-glass theme bundle.
 *
 * Everything this plugin does is browser-side presentation: theme token layers,
 * the frame-wide digital-rain surface, and its settings card. No Host service,
 * tool, or session state is involved, so the Host half stays an intentional
 * no-op — the row exists to carry the bundle, its display metadata, and the
 * Client half declared in `package.json` (`dsh.client`).
 */
export function apply() {}
