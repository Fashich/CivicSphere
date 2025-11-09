export function safePush<T>(arr: T[] | undefined | null, item: T): T[] {
  if (!Array.isArray(arr)) return [item];
  try {
    arr.push(item);
    return arr;
  } catch (e) {
    return [...arr, item];
  }
}

export function safeReplaceArray<T>(arr: any): T[] {
  if (!Array.isArray(arr)) return [];
  return arr as T[];
}
