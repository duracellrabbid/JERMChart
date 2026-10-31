import { describe, it, expect } from 'vitest';
import { FEATURE_FLAGS } from '../../config/featureFlags';

describe('FEATURE_FLAGS', () => {
  it('defines default values for PDF, PPTX, and JSON encryption', () => {
    expect(FEATURE_FLAGS).toBeDefined();
    expect(FEATURE_FLAGS.enablePdfExport).toBe(false);
    expect(FEATURE_FLAGS.enablePptxExport).toBe(false);
    expect(FEATURE_FLAGS.enableJsonEncryption).toBe(true);
  });
});
