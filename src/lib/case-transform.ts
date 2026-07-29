export function toCamelCase(str: string): string {
  return str.replace(/([-_][a-z0-9])/gi, ($1) => {
    return $1.toUpperCase().replace("-", "").replace("_", "");
  });
}

export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function keysToCamel<T = unknown>(obj: unknown): T {
  if (Array.isArray(obj)) {
    return obj.map((v) => keysToCamel(v)) as unknown as T;
  } else if (obj !== null && obj !== undefined && obj.constructor === Object) {
    const record = obj as Record<string, unknown>;
    return Object.keys(record).reduce(
      (result, key) => ({
        ...result,
        [toCamelCase(key)]: keysToCamel(record[key]),
      }),
      {}
    ) as unknown as T;
  }
  return obj as T;
}

export function keysToSnake<T = unknown>(obj: unknown): T {
  if (Array.isArray(obj)) {
    return obj.map((v) => keysToSnake(v)) as unknown as T;
  } else if (obj !== null && obj !== undefined && obj.constructor === Object) {
    const record = obj as Record<string, unknown>;
    return Object.keys(record).reduce(
      (result, key) => ({
        ...result,
        [toSnakeCase(key)]: keysToSnake(record[key]),
      }),
      {}
    ) as unknown as T;
  }
  return obj as T;
}
