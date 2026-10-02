export function toEmbeddedDriveFolderUrl(value = '') {
  try {
    const url = new URL(String(value).trim());
    if (!/(^|\.)drive\.google\.com$/i.test(url.hostname)) return '';
    const folderId = url.searchParams.get('id') || url.pathname.match(/\/folders\/([^/]+)/)?.[1];
    if (!folderId) return '';
    const resourceKey = url.searchParams.get('resourcekey');
    const params = new URLSearchParams({ id: folderId });
    if (resourceKey) params.set('resourcekey', resourceKey);
    return `https://drive.google.com/embeddedfolderview?${params.toString()}#list`;
  } catch {
    return '';
  }
}
