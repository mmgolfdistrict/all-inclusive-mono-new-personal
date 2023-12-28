import { vitest } from "vitest";

export const createDrizzleMock = (values: unknown[]) => {
  const mock = vitest.fn();
  for (const value of values) {
    const proxy: object = new Proxy(
      {},
      {
        get(target, prop) {
          if (prop === "then") {
            return (resolve: (val: unknown) => void) => resolve(value);
          }
          return () => proxy;
        },
      }
    );
    mock.mockReturnValueOnce(proxy);
  }
  return mock;
};
