import { vitest } from "vitest";

// A light-weight query builder mock for Drizzle that supports method chaining
// and resolves data only on execute(). This avoids exposing a thenable object
// during the chain (which breaks calls like .orderBy(...)).
export const createDrizzleMock = (values: unknown[]) => {
  const mock = vitest.fn();

  // Helper to build a chainable proxy whose execute() resolves to `result`
  const buildChainProxy = (result: unknown): any => {
    const handler: ProxyHandler<any> = {
      get(_target, prop) {
        // Special-case execute() to return a real Promise
        if (prop === "execute") {
          return () => Promise.resolve(result);
        }

        // Special-case transaction() to invoke the callback with a tx object
        if (prop === "transaction") {
          return async (cb: (tx: any) => Promise<void> | void) => {
            const tx = buildChainProxy(undefined);
            // provide minimal insert/update API on tx
            tx.insert = () => buildChainProxy(undefined);
            tx.update = () => buildChainProxy(undefined);
            tx.select = () => buildChainProxy(result);
            tx.where = () => buildChainProxy(undefined);
            tx.values = () => buildChainProxy(undefined);
            tx.set = () => buildChainProxy(undefined);
            tx.leftJoin = () => buildChainProxy(undefined);
            tx.orderBy = () => buildChainProxy(undefined);
            tx.catch = () => buildChainProxy(undefined);
            tx.rollback = vitest.fn();
            await cb(tx);
          };
        }

        // For catch() on execute() chains, just no-op and return self
        if (prop === "catch") {
          return () => buildChainProxy(result);
        }

        // Provide common query builder methods dynamically; each returns self
        return () => buildChainProxy(result);
      },
    };
    return new Proxy({}, handler);
  };

  for (const value of values) {
    mock.mockReturnValueOnce(buildChainProxy(value));
  }

  return mock;
};
