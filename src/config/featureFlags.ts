export interface FeatureFlags {
  readonly enablePdfExport: boolean;
  readonly enablePptxExport: boolean;
  readonly enableJsonEncryption: boolean;
}

export const FEATURE_FLAGS: FeatureFlags = {
  enablePdfExport: false,
  enablePptxExport: false,
  enableJsonEncryption: true,
};
