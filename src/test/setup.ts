import '@testing-library/jest-dom';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock;

class WorkerMock {
  url: string;
  onmessage: any = null;
  onerror: any = null;
  constructor(stringUrl: string) {
    this.url = stringUrl;
  }
  postMessage() {}
  terminate() {}
  addEventListener() {}
  removeEventListener() {}
}

(global as any).Worker = WorkerMock;

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  configurable: true,
  writable: true,
});

if (typeof URL.createObjectURL === 'undefined' || URL.createObjectURL) {
  URL.createObjectURL = (blob: any) => `blob:mock-${blob?.name || 'file'}`;
  URL.revokeObjectURL = () => {};
}

