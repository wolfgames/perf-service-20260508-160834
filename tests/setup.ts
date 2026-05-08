/**
 * Global test setup — polyfills for Node.js test environment.
 *
 * @adobe/data's blob-store does a top-level import that calls
 * globalThis.caches.open() (Web Cache API). Provide a no-op stub
 * so the unhandled rejection doesn't pollute test output.
 */

// Polyfill Web Cache API (no-op) for @adobe/data blob-store in Node
if (!globalThis.caches) {
  const noop = async () => {};
  const fakeCache = {
    match: noop,
    put: noop,
    delete: noop,
    keys: async () => [],
    add: noop,
    addAll: noop,
  };
  (globalThis as unknown as Record<string, unknown>).caches = {
    open: async () => fakeCache,
    match: noop,
    has: async () => false,
    delete: noop,
    keys: async () => [],
  };
}
