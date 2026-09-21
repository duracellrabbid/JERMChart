import heic2any from 'heic2any';

export function isHeicFile(file: Blob, filename?: string): boolean {
  const name = filename || (file instanceof File ? file.name : '');
  const lowerName = name.toLowerCase();
  return (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    lowerName.endsWith('.heic') ||
    lowerName.endsWith('.heif')
  );
}

export function calculateOptimalDimensions(
  width: number,
  height: number,
  maxDim = 2048
): { width: number; height: number } {
  if (width <= maxDim && height <= maxDim) {
    return { width, height };
  }
  if (width > height) {
    return {
      width: maxDim,
      height: Math.round((height * maxDim) / width),
    };
  }
  return {
    width: Math.round((width * maxDim) / height),
    height: maxDim,
  };
}

export async function convertHeicIfNeeded(file: File): Promise<Blob> {
  if (!isHeicFile(file)) return file;
  const converted = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.88,
  });
  return Array.isArray(converted) ? converted[0] : converted;
}

export async function resizeImageToJpegBase64(
  blob: Blob,
  maxDim = 2048
): Promise<{ base64Data: string; mimeType: string; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const { width, height } = calculateOptimalDimensions(img.width, img.height, maxDim);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas 2d context'));
        return;
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      const base64Data = dataUrl.replace(/^data:image\/jpeg;base64,/, '');

      resolve({
        base64Data,
        mimeType: 'image/jpeg',
        previewUrl: dataUrl,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not decode image'));
    };

    img.src = objectUrl;
  });
}

export async function preprocessImageFile(
  file: File
): Promise<{ base64Data: string; mimeType: string; previewUrl: string }> {
  const normalizedBlob = await convertHeicIfNeeded(file);
  return resizeImageToJpegBase64(normalizedBlob, 2048);
}
