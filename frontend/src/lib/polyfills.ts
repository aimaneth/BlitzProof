// Polyfills for browser-only APIs during SSR
if (typeof window === 'undefined') {
  // Server-side polyfills
  global.indexedDB = undefined as any;
  global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0,
  } as any;
  global.sessionStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0,
  } as any;
} 