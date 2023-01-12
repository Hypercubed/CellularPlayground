export function makeGridWith<T>(
  width: number,
  height: number,
  c: T | ((x: number, y: number) => T)
) {
  return Array.from({ length: height }, (_, y) => {
    return Array.from({ length: width }, (_, x) => {
      return typeof c === 'function' ? (c as any)(x, y) : c;
    });
  });
}
