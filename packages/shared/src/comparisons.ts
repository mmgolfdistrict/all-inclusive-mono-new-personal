export const isEqual = (obj1: object, obj2: object, ignoreKey?: string): boolean => {
  const keys = Object.keys(obj1);
  for (const key of keys) {
    if (ignoreKey && key === ignoreKey) {
      continue;
    }
    // @ts-ignore
    if (obj1[key] !== obj2[key]) return false;
  }
  return true;
};
