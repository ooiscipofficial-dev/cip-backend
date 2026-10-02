export function toPadletEmbedUrl(value = '') {
  const raw = String(value).trim();
  if (!raw) return '';
  try {
    const url = new URL(raw);
    if (!/(^|\.)padlet\.com$/i.test(url.hostname)) return raw;
    if (url.pathname.startsWith('/embed/')) return url.toString();
    const board = url.pathname.split('/').filter(Boolean).at(-1);
    if (!board) return raw;
    const embedId = board.includes('-') ? board.split('-').at(-1) : board;
    return `https://padlet.com/embed/${embedId}`;
  } catch {
    return raw;
  }
}
