import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isHeicFile,
  calculateOptimalDimensions,
  convertHeicIfNeeded,
  resizeImageToJpegBase64,
  preprocessImageFile,
} from '../../utils/imagePreprocessing';
import heic2any from 'heic2any';

vi.mock('heic2any', () => ({
  default: vi.fn().mockImplementation(async ({ blob }) => {
    return new Blob(['mock-converted-jpeg'], { type: 'image/jpeg' });
  }),
}));

describe('imagePreprocessing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('identifies heic files by mime type or extension', () => {
    const heicBlob = new Blob([], { type: 'image/heic' });
    expect(isHeicFile(heicBlob, 'photo.heic')).toBe(true);

    const heifFile = new File([], 'chart.HEIF', { type: '' });
    expect(isHeicFile(heifFile)).toBe(true);

    const pngFile = new File([], 'chart.png', { type: 'image/png' });
    expect(isHeicFile(pngFile)).toBe(false);

    const jpegBlob = new Blob([], { type: 'image/jpeg' });
    expect(isHeicFile(jpegBlob)).toBe(false);
  });

  it('scales dimensions down when exceeding max dimension', () => {
    const res1 = calculateOptimalDimensions(4000, 2000, 2000);
    expect(res1).toEqual({ width: 2000, height: 1000 });

    const res2 = calculateOptimalDimensions(1500, 3000, 2000);
    expect(res2).toEqual({ width: 1000, height: 2000 });

    const res3 = calculateOptimalDimensions(800, 600, 2000);
    expect(res3).toEqual({ width: 800, height: 600 });
  });

  it('converts heic files using heic2any', async () => {
    const heicFile = new File(['fake-heic'], 'diagram.heic', { type: 'image/heic' });
    const result = await convertHeicIfNeeded(heicFile);
    expect(heic2any).toHaveBeenCalledWith(
      expect.objectContaining({
        blob: heicFile,
        toType: 'image/jpeg',
      })
    );
    expect(result.type).toBe('image/jpeg');
  });

  it('passes non-heic files directly through without conversion', async () => {
    const pngFile = new File(['fake-png'], 'diagram.png', { type: 'image/png' });
    const result = await convertHeicIfNeeded(pngFile);
    expect(heic2any).not.toHaveBeenCalled();
    expect(result).toBe(pngFile);
  });

  it('handles array returns from heic2any', async () => {
    vi.mocked(heic2any).mockResolvedValueOnce([
      new Blob(['first-page'], { type: 'image/jpeg' }),
    ]);
    const heicFile = new File(['fake-heic'], 'multi.heic', { type: 'image/heic' });
    const result = await convertHeicIfNeeded(heicFile);
    expect(result.type).toBe('image/jpeg');
  });

  it('resizes image to base64 jpeg using canvas', async () => {
    const mockDrawImage = vi.fn();
    const mockFillRect = vi.fn();
    const mockGetContext = vi.fn().mockReturnValue({
      fillStyle: '',
      fillRect: mockFillRect,
      drawImage: mockDrawImage,
    });
    const mockToDataURL = vi.fn().mockReturnValue('data:image/jpeg;base64,mockbase64jpeg');

    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName.toLowerCase() === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: mockGetContext,
          toDataURL: mockToDataURL,
        } as any;
      }
      return originalCreateElement(tagName);
    });

    const originalImage = global.Image;
    (global as any).Image = class MockImage {
      width = 2400;
      height = 1200;
      onload: any = null;
      onerror: any = null;
      set src(_val: string) {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 10);
      }
    };

    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-image');
    window.URL.revokeObjectURL = vi.fn();

    const blob = new Blob(['mock-data'], { type: 'image/jpeg' });
    const output = await resizeImageToJpegBase64(blob, 2048);

    expect(output.base64Data).toBe('mockbase64jpeg');
    expect(output.mimeType).toBe('image/jpeg');
    expect(output.previewUrl).toBe('data:image/jpeg;base64,mockbase64jpeg');

    global.Image = originalImage;
    vi.restoreAllMocks();
  });

  it('preprocesses image file end-to-end', async () => {
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName.toLowerCase() === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: vi.fn().mockReturnValue({
            fillStyle: '',
            fillRect: vi.fn(),
            drawImage: vi.fn(),
          }),
          toDataURL: vi.fn().mockReturnValue('data:image/jpeg;base64,preprocessed'),
        } as any;
      }
      return originalCreateElement(tagName);
    });

    const originalImage = global.Image;
    (global as any).Image = class MockImage {
      width = 800;
      height = 600;
      onload: any = null;
      onerror: any = null;
      set src(_val: string) {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 10);
      }
    };

    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-img');
    window.URL.revokeObjectURL = vi.fn();

    const file = new File(['png-data'], 'scan.png', { type: 'image/png' });
    const res = await preprocessImageFile(file);
    expect(res.base64Data).toBe('preprocessed');

    global.Image = originalImage;
    vi.restoreAllMocks();
  });

  it('rejects when canvas 2d context cannot be acquired', async () => {
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName.toLowerCase() === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: vi.fn().mockReturnValue(null),
        } as any;
      }
      return originalCreateElement(tagName);
    });

    const originalImage = global.Image;
    (global as any).Image = class MockImage {
      width = 800;
      height = 600;
      onload: any = null;
      onerror: any = null;
      set src(_val: string) {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 5);
      }
    };

    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:null-ctx');
    window.URL.revokeObjectURL = vi.fn();

    const blob = new Blob(['data'], { type: 'image/jpeg' });
    await expect(resizeImageToJpegBase64(blob)).rejects.toThrow('Failed to get canvas 2d context');

    global.Image = originalImage;
    vi.restoreAllMocks();
  });

  it('rejects when image fails to decode (onerror triggered)', async () => {
    const originalImage = global.Image;
    (global as any).Image = class MockImage {
      onload: any = null;
      onerror: any = null;
      set src(_val: string) {
        setTimeout(() => {
          if (this.onerror) this.onerror();
        }, 5);
      }
    };

    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:broken-image');
    const revokeSpy = vi.fn();
    window.URL.revokeObjectURL = revokeSpy;

    const blob = new Blob(['broken-data'], { type: 'image/jpeg' });
    await expect(resizeImageToJpegBase64(blob)).rejects.toThrow('Could not decode image');
    expect(revokeSpy).toHaveBeenCalledWith('blob:broken-image');

    global.Image = originalImage;
    vi.restoreAllMocks();
  });
});
