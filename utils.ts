export function addArray(arr: number[], initial = 0): number {
  return arr.reduce((a, b) => a + b, initial);
}

export function throwIfError<T = true>(fn: Function, ...args: any[]): T {
  const result = fn(...args);
  if (result instanceof Error) {
    throw result;
  }
  return result as T;
}
