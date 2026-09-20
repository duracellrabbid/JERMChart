import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('main entrypoint', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    vi.resetModules();
  });

  it('renders App into root container without errors', async () => {
    const mockRender = vi.fn();
    const mockCreateRoot = vi.fn().mockReturnValue({ render: mockRender });

    vi.doMock('react-dom/client', () => ({
      default: {
        createRoot: mockCreateRoot,
      },
      createRoot: mockCreateRoot,
    }));

    await import('../main');

    expect(mockCreateRoot).toHaveBeenCalledWith(document.getElementById('root'));
    expect(mockRender).toHaveBeenCalled();
  });
});
