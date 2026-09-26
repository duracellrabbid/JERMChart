/**
 * Trims all trailing forward slashes from a URL or path in linear O(n) time
 * using string primitives to guarantee zero regex backtracking and ReDoS immunity.
 */
export function trimTrailingSlashes(url: string): string {
  const trimmed = String(url || '').trim();
  let end = trimmed.length;
  while (end > 0 && trimmed.charCodeAt(end - 1) === 47 /* '/' */) {
    end--;
  }
  return trimmed.slice(0, end);
}

/**
 * Trims all leading forward slashes from a path string in linear O(n) time
 * using string primitives to guarantee zero regex backtracking and ReDoS immunity.
 */
export function trimLeadingSlashes(path: string): string {
  const trimmed = String(path || '').trim();
  let start = 0;
  const len = trimmed.length;
  while (start < len && trimmed.charCodeAt(start) === 47 /* '/' */) {
    start++;
  }
  return trimmed.slice(start);
}

/**
 * Safely joins a base URL and endpoint path, guaranteeing exactly one
 * slash between them with linear O(n) performance.
 */
export function joinUrl(baseUrl: string, path: string): string {
  const cleanBase = trimTrailingSlashes(baseUrl);
  const cleanPath = trimLeadingSlashes(path);
  if (!cleanBase) return cleanPath ? `/${cleanPath}` : '';
  if (!cleanPath) return cleanBase;
  return `${cleanBase}/${cleanPath}`;
}
