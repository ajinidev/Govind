/** Drop empty params and build "/tasks?x=1&y=2". Shared by the HTTP client and the debug display. */
export function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== false),
  );
}

export function buildPath(path, params) {
  const qs = new URLSearchParams(cleanParams(params)).toString();
  return qs ? `${path}?${qs}` : path;
}
