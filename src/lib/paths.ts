export function withBase(path: string, base: string = '/') {
  if (/^https?:\/\//.test(path)) return path;
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}
export const path = (value: string) =>
  withBase(value, import.meta.env.BASE_URL);
