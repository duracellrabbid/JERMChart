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
