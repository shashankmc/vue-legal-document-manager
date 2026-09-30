// D.4 #38: text is escaped before it goes into the DOM. Vue's text
// interpolation already escapes, so the component uses that wherever possible.
// For the full-document tab the host supplies rendered HTML (from `marked`);
// this is a small allowlist sanitiser so a package with no HTTP dependency can
// still neutralise scripts and event handlers.

const ALLOWED_TAGS = new Set([
  'a', 'b', 'blockquote', 'br', 'code', 'del', 'div', 'em', 'h1', 'h2', 'h3',
  'h4', 'h5', 'h6', 'hr', 'i', 'li', 'ol', 'p', 'pre', 's', 'span', 'strong',
  'sub', 'sup', 'table', 'tbody', 'td', 'th', 'thead', 'tr', 'u', 'ul',
])

const ALLOWED_ATTRS = new Set(['href', 'title', 'colspan', 'rowspan'])

/**
 * Remove anything that could execute: `<script>`, event handler attributes,
 * `javascript:` URLs and any tag outside the allowlist. Not a full HTML
 * parser, but enough for trusted-ish markdown rendered by `marked`.
 *
 * Prefer passing already-sanitised HTML; this is a safety net, not a licence
 * to feed arbitrary user HTML.
 */
export function sanitizeHtml(html: string): string {
  // Drop script/style/iframe blocks entirely, including their contents.
  let out = html.replace(/<(script|style|iframe|object|embed)[\s\S]*?<\/\1\s*>/gi, '')
  out = out.replace(/<(script|style|iframe|object|embed)[^>]*\/?>/gi, '')

  // Walk each remaining tag and strip it unless allowed.
  out = out.replace(/<\/?([a-zA-Z][a-zA-Z0-9-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g, (match, tag, attrs) => {
    const name = String(tag).toLowerCase()
    const closing = match.startsWith('</')
    if (!ALLOWED_TAGS.has(name)) return ''
    if (closing) return `</${name}>`
    const safeAttrs = (String(attrs).match(/([a-zA-Z-]+)\s*=\s*("[^"]*"|'[^']*')/g) ?? [])
      .filter((a) => ALLOWED_ATTRS.has(a.split('=')[0].trim().toLowerCase()))
      .filter((a) => !/^href\s*=\s*["']?\s*javascript:/i.test(a))
      .join(' ')
    return `<${name}${safeAttrs ? ' ' + safeAttrs : ''}>`
  })

  return out
}
