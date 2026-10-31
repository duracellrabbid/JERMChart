# Export Feature Flags and Encrypted JSON Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement compile-time feature flags to soft-remove PDF and PowerPoint export buttons, and implement symmetric AES-GCM-256 / PBKDF2 encryption for JSON chart backups with password protection and backward compatibility.

**Architecture:** A lightweight configuration module `src/config/featureFlags.ts` holds hard-coded flags (`enablePdfExport`, `enablePptxExport`, `enableJsonEncryption`). A cryptographic service `src/utils/cryptoService.ts` implements PBKDF2 key derivation and AES-GCM authenticated encryption/decryption using native `window.crypto.subtle` (zero new dependencies). A reusable `PasswordPromptModal.tsx` prompts for passwords during export and import, wired cleanly into `ExportModal.tsx`.

**Tech Stack:** TypeScript 5.9, React 19, Zustand 5, Web Crypto API (`window.crypto.subtle`), Vitest 5, Tailwind CSS.

## Global Constraints

- Cognitive complexity must be strictly below 15 for every function (Rule 4).
- All regular expressions must run in linear time with no catastrophic backtracking (Rule 5).
- All unit, component, and integration tests must reside inside `src/**/__tests__/` (Rule 6).
- 100% test coverage threshold required by `npm run test:coverage`.
- Shell commands must be prefixed with `rtk` (Rule 2).
- Zero new third-party dependencies required; leverage native browser/Chromium Web Crypto API.

---

### Task 1: Feature Flags Configuration Module

**Files:**
- Create: `src/config/featureFlags.ts`
- Test: `src/__tests__/config/featureFlags.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  export interface FeatureFlags {
    readonly enablePdfExport: boolean;
    readonly enablePptxExport: boolean;
    readonly enableJsonEncryption: boolean;
  }
  export const FEATURE_FLAGS: FeatureFlags;
  ```

- [ ] **Step 1: Write the failing test**

```typescript
// src/__tests__/config/featureFlags.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npm test src/__tests__/config/featureFlags.test.ts`  
Expected: FAIL (module `../../config/featureFlags` not found)

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/config/featureFlags.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npm test src/__tests__/config/featureFlags.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
rtk git add src/config/featureFlags.ts src/__tests__/config/featureFlags.test.ts
rtk git commit -m "feat(config): add feature flags module for exports and encryption"
```

---

### Task 2: Cryptographic Service (`src/utils/cryptoService.ts`)

**Files:**
- Create: `src/utils/cryptoService.ts`
- Test: `src/__tests__/utils/cryptoService.test.ts`

**Interfaces:**
- Consumes:
  - `TrustStructureChart` from `../types/structure`
- Produces:
  ```typescript
  export interface EncryptedChartEnvelope {
    format: 'jermchart-encrypted';
    version: number;
    kdf: {
      algorithm: 'PBKDF2';
      hash: 'SHA-256';
      iterations: number;
      salt: string; // Base64
    };
    cipher: {
      algorithm: 'AES-GCM';
      iv: string; // Base64
      data: string; // Base64
    };
  }

  export function isEncryptedEnvelope(data: unknown): data is EncryptedChartEnvelope;
  export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string;
  export function base64ToArrayBuffer(base64: string): ArrayBuffer;
  export async function deriveKeyFromPassword(password: string, salt: Uint8Array, iterations = 100000): Promise<CryptoKey>;
  export async function encryptChart(chart: TrustStructureChart, password: string): Promise<string>;
  export async function decryptChart(encryptedJson: string, password: string): Promise<TrustStructureChart>;
  ```

- [ ] **Step 1: Write the failing tests**

```typescript
// src/__tests__/utils/cryptoService.test.ts
import { describe, it, expect } from 'vitest';
import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  isEncryptedEnvelope,
  encryptChart,
  decryptChart,
  EncryptedChartEnvelope,
} from '../../utils/cryptoService';
import { TrustStructureChart } from '../../types/structure';

const mockChart: TrustStructureChart = {
  metadata: {
    chartTitle: 'Alpha Family Trust',
    clientReference: 'REF-001',
    effectiveDate: '2026-10-31',
    confidentialityNotice: 'CONFIDENTIAL',
  },
  entities: [
    {
      id: 'entity-1',
      name: 'Alpha Holdings Ltd',
      type: 'company',
      jurisdiction: 'Singapore',
      associatedParties: [],
    },
  ],
  relationships: [],
};

describe('cryptoService', () => {
  it('correctly encodes and decodes base64 buffers', () => {
    const bytes = new Uint8Array([1, 2, 3, 255, 0, 128]);
    const b64 = arrayBufferToBase64(bytes);
    const decoded = new Uint8Array(base64ToArrayBuffer(b64));
    expect(decoded).toEqual(bytes);
  });

  it('validates encrypted chart envelope structure', () => {
    expect(isEncryptedEnvelope(null)).toBe(false);
    expect(isEncryptedEnvelope({})).toBe(false);
    expect(isEncryptedEnvelope({ format: 'other' })).toBe(false);

    const validEnvelope: EncryptedChartEnvelope = {
      format: 'jermchart-encrypted',
      version: 1,
      kdf: {
        algorithm: 'PBKDF2',
        hash: 'SHA-256',
        iterations: 100000,
        salt: 'c2FsdA==',
      },
      cipher: {
        algorithm: 'AES-GCM',
        iv: 'aXY=',
        data: 'ZGF0YQ==',
      },
    };
    expect(isEncryptedEnvelope(validEnvelope)).toBe(true);
  });

  it('encrypts and successfully decrypts a chart with the correct password', async () => {
    const password = 'SuperSecretPassword123!';
    const encryptedString = await encryptChart(mockChart, password);

    const parsedEnvelope = JSON.parse(encryptedString);
    expect(isEncryptedEnvelope(parsedEnvelope)).toBe(true);
    expect(parsedEnvelope.format).toBe('jermchart-encrypted');

    const decryptedChart = await decryptChart(encryptedString, password);
    expect(decryptedChart).toEqual(mockChart);
  });

  it('throws an error when decrypting with an incorrect password', async () => {
    const password = 'CorrectPassword123!';
    const wrongPassword = 'WrongPassword456!';
    const encryptedString = await encryptChart(mockChart, password);

    await expect(decryptChart(encryptedString, wrongPassword)).rejects.toThrow(
      'Invalid password or corrupted file'
    );
  });

  it('throws an error when decrypting malformed or tampered payload', async () => {
    const password = 'Password123!';
    const encryptedString = await encryptChart(mockChart, password);
    const envelope = JSON.parse(encryptedString);

    // Tamper with ciphertext
    envelope.cipher.data = arrayBufferToBase64(new Uint8Array([9, 9, 9, 9]));
    const tamperedString = JSON.stringify(envelope);

    await expect(decryptChart(tamperedString, password)).rejects.toThrow(
      'Invalid password or corrupted file'
    );
  });

  it('throws when payload is not a valid encrypted envelope', async () => {
    await expect(decryptChart('{"foo": "bar"}', 'test')).rejects.toThrow(
      'Invalid encrypted file format'
    );
  });

  it('throws when password is empty', async () => {
    await expect(encryptChart(mockChart, '')).rejects.toThrow('Password cannot be empty');
    await expect(decryptChart('{}', '')).rejects.toThrow('Password cannot be empty');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npm test src/__tests__/utils/cryptoService.test.ts`  
Expected: FAIL (module not found)

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/utils/cryptoService.ts
import { TrustStructureChart } from '../types/structure';

export interface EncryptedChartEnvelope {
  format: 'jermchart-encrypted';
  version: number;
  kdf: {
    algorithm: 'PBKDF2';
    hash: 'SHA-256';
    iterations: number;
    salt: string; // Base64
  };
  cipher: {
    algorithm: 'AES-GCM';
    iv: string; // Base64
    data: string; // Base64
  };
}

export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function isEncryptedEnvelope(data: unknown): data is EncryptedChartEnvelope {
  if (!data || typeof data !== 'object') return false;
  const env = data as Partial<EncryptedChartEnvelope>;
  return (
    env.format === 'jermchart-encrypted' &&
    typeof env.version === 'number' &&
    typeof env.kdf?.salt === 'string' &&
    typeof env.cipher?.iv === 'string' &&
    typeof env.cipher?.data === 'string'
  );
}

export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array,
  iterations = 100000
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptChart(
  chart: TrustStructureChart,
  password: string
): Promise<string> {
  if (!password || password.trim() === '') {
    throw new Error('Password cannot be empty');
  }

  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const iterations = 100000;

  const key = await deriveKeyFromPassword(password, salt, iterations);
  const enc = new TextEncoder();
  const plaintextBytes = enc.encode(JSON.stringify(chart));

  const cipherBytes = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    plaintextBytes
  );

  const envelope: EncryptedChartEnvelope = {
    format: 'jermchart-encrypted',
    version: 1,
    kdf: {
      algorithm: 'PBKDF2',
      hash: 'SHA-256',
      iterations,
      salt: arrayBufferToBase64(salt),
    },
    cipher: {
      algorithm: 'AES-GCM',
      iv: arrayBufferToBase64(iv),
      data: arrayBufferToBase64(cipherBytes),
    },
  };

  return JSON.stringify(envelope, null, 2);
}

export async function decryptChart(
  encryptedJson: string,
  password: string
): Promise<TrustStructureChart> {
  if (!password || password.trim() === '') {
    throw new Error('Password cannot be empty');
  }

  let envelope: unknown;
  try {
    envelope = JSON.parse(encryptedJson);
  } catch {
    throw new Error('Invalid encrypted file format');
  }

  if (!isEncryptedEnvelope(envelope)) {
    throw new Error('Invalid encrypted file format');
  }

  try {
    const salt = new Uint8Array(base64ToArrayBuffer(envelope.kdf.salt));
    const iv = new Uint8Array(base64ToArrayBuffer(envelope.cipher.iv));
    const cipherBuffer = base64ToArrayBuffer(envelope.cipher.data);

    const key = await deriveKeyFromPassword(password, salt, envelope.kdf.iterations);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      cipherBuffer
    );

    const dec = new TextDecoder();
    const jsonString = dec.decode(decryptedBuffer);
    const chart = JSON.parse(jsonString) as TrustStructureChart;

    if (!chart || !Array.isArray(chart.entities) || !Array.isArray(chart.relationships)) {
      throw new Error('Decrypted content is not a valid chart');
    }

    return chart;
  } catch (err) {
    if (err instanceof Error && err.message === 'Decrypted content is not a valid chart') {
      throw err;
    }
    throw new Error('Invalid password or corrupted file');
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npm test src/__tests__/utils/cryptoService.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
rtk git add src/utils/cryptoService.ts src/__tests__/utils/cryptoService.test.ts
rtk git commit -m "feat(crypto): implement Web Crypto AES-GCM and PBKDF2 encryption/decryption"
```

---

### Task 3: PasswordPromptModal Component

**Files:**
- Create: `src/components/common/PasswordPromptModal.tsx`
- Test: `src/__tests__/components/common/PasswordPromptModal.test.tsx`

**Interfaces:**
- Consumes:
  - `Lock`, `Eye`, `EyeOff`, `ShieldCheck`, `AlertCircle`, `X` from `lucide-react`
- Produces:
  ```typescript
  export interface PasswordPromptModalProps {
    isOpen: boolean;
    mode: 'export' | 'import';
    errorMessage?: string | null;
    isLoading?: boolean;
    onSubmit: (password: string) => void;
    onClose: () => void;
  }

  export const PasswordPromptModal: React.FC<PasswordPromptModalProps>;
  ```

- [ ] **Step 1: Write the failing tests**

```tsx
// src/__tests__/components/common/PasswordPromptModal.test.tsx
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PasswordPromptModal } from '../../components/common/PasswordPromptModal';

describe('PasswordPromptModal', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <PasswordPromptModal
        isOpen={false}
        mode="export"
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders in export mode with password and confirmation inputs', () => {
    const handleSubmit = vi.fn();
    const handleClose = vi.fn();

    render(
      <PasswordPromptModal
        isOpen={true}
        mode="export"
        onSubmit={handleSubmit}
        onClose={handleClose}
      />
    );

    expect(screen.getByText('Encrypt Chart Backup')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Confirm Password/i)).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /encrypt & download/i });
    expect(submitBtn).toBeDisabled();

    const passwordInput = screen.getByLabelText(/^Password/i);
    const confirmInput = screen.getByLabelText(/^Confirm Password/i);

    fireEvent.change(passwordInput, { target: { value: 'Secret123' } });
    fireEvent.change(confirmInput, { target: { value: 'Mismatch123' } });

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    expect(submitBtn).toBeDisabled();

    fireEvent.change(confirmInput, { target: { value: 'Secret123' } });
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);
    expect(handleSubmit).toHaveBeenCalledWith('Secret123');
  });

  it('renders in import mode with single password input and error message', () => {
    const handleSubmit = vi.fn();
    const handleClose = vi.fn();

    render(
      <PasswordPromptModal
        isOpen={true}
        mode="import"
        errorMessage="Incorrect password or corrupted file"
        onSubmit={handleSubmit}
        onClose={handleClose}
      />
    );

    expect(screen.getByText('Decrypt Chart Backup')).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Confirm Password/i)).toBeNull();
    expect(screen.getByText('Incorrect password or corrupted file')).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /decrypt & load/i });
    expect(submitBtn).toBeDisabled();

    const passwordInput = screen.getByLabelText(/^Password/i);
    fireEvent.change(passwordInput, { target: { value: 'Secret123' } });
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);
    expect(handleSubmit).toHaveBeenCalledWith('Secret123');
  });

  it('toggles password visibility when eye button is clicked', () => {
    render(
      <PasswordPromptModal
        isOpen={true}
        mode="import"
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const passwordInput = screen.getByLabelText(/^Password/i) as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    const toggleBtn = screen.getByLabelText(/toggle password visibility/i);
    fireEvent.click(toggleBtn);
    expect(passwordInput.type).toBe('text');

    fireEvent.click(toggleBtn);
    expect(passwordInput.type).toBe('password');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npm test src/__tests__/components/common/PasswordPromptModal.test.tsx`  
Expected: FAIL (component not found)

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/components/common/PasswordPromptModal.tsx
import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle, X } from 'lucide-react';

export interface PasswordPromptModalProps {
  isOpen: boolean;
  mode: 'export' | 'import';
  errorMessage?: string | null;
  isLoading?: boolean;
  onSubmit: (password: string) => void;
  onClose: () => void;
}

export const PasswordPromptModal: React.FC<PasswordPromptModalProps> = ({
  isOpen,
  mode,
  errorMessage,
  isLoading = false,
  onSubmit,
  onClose,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const isExport = mode === 'export';
  const passwordsMatch = !isExport || password === confirmPassword;
  const canSubmit = password.trim().length > 0 && passwordsMatch && !isLoading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) {
      onSubmit(password);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="password-prompt-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-sky-400" />
            <h2 id="password-prompt-title" className="text-sm font-semibold">
              {isExport ? 'Encrypt Chart Backup' : 'Decrypt Chart Backup'}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            disabled={isLoading}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            {isExport
              ? 'Enter a password to encrypt this structure chart. You will need this password to import the chart later.'
              : 'This chart is password-protected. Enter the password used during export to decrypt.'}
          </p>

          {errorMessage && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-md flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="prompt-password-input"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="prompt-password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                disabled={isLoading}
                autoFocus
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md pr-9 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
                tabIndex={-1}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isExport && (
            <div>
              <label
                htmlFor="prompt-confirm-password-input"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Confirm Password
              </label>
              <input
                id="prompt-confirm-password-input"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password..."
                disabled={isLoading}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
              />
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-[11px] text-rose-600 mt-1">Passwords do not match.</p>
              )}
            </div>
          )}

          {/* Footer actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 rounded hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-md shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {isLoading
                ? 'Processing...'
                : isExport
                ? 'Encrypt & Download'
                : 'Decrypt & Load'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npm test src/__tests__/components/common/PasswordPromptModal.test.tsx`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
rtk git add src/components/common/PasswordPromptModal.tsx src/__tests__/components/common/PasswordPromptModal.test.tsx
rtk git commit -m "feat(ui): add PasswordPromptModal component for encrypted chart operations"
```

---

### Task 4: Integrate Feature Flags and Encrypted Backup into ExportModal

**Files:**
- Modify: `src/utils/exportService.ts`
- Modify: `src/components/export/ExportModal.tsx`
- Test: `src/__tests__/utils/exportService.test.ts`
- Test: `src/__tests__/components/export/ExportModal.test.tsx`

**Interfaces:**
- Consumes:
  - `FEATURE_FLAGS` from `../../config/featureFlags`
  - `encryptChart`, `decryptChart`, `isEncryptedEnvelope` from `../../utils/cryptoService`
  - `PasswordPromptModal` from `../common/PasswordPromptModal`
- Produces:
  - `downloadEncryptedJsonBackup(chart: TrustStructureChart, encryptedJson: string): void` in `src/utils/exportService.ts`
  - Fully gated PDF/PPTX buttons in `ExportModal.tsx`
  - Encrypted export and dual-mode (encrypted vs legacy cleartext) import

- [ ] **Step 1: Write the failing tests in `src/__tests__/components/export/ExportModal.test.tsx` and `src/__tests__/utils/exportService.test.ts`**

Update `src/__tests__/utils/exportService.test.ts` to test `downloadEncryptedJsonBackup`:
```typescript
it('downloads encrypted json backup with safe title and revoked object url', () => {
  const chart: TrustStructureChart = {
    metadata: { chartTitle: 'Secure Trust' },
    entities: [],
    relationships: [],
  };
  downloadEncryptedJsonBackup(chart, '{"format":"jermchart-encrypted"}');
  expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
});
```

Update `src/__tests__/components/export/ExportModal.test.tsx` to add test cases:
1. "hides PDF and PPTX options when feature flags are disabled"
2. "opens password prompt modal when saving JSON with encryption enabled"
3. "downloads cleartext JSON directly when encryption flag is disabled"
4. "loads legacy cleartext JSON without asking for password"
5. "opens password prompt modal when uploading encrypted JSON file and decrypts on valid password"

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npm test src/__tests__/components/export/ExportModal.test.tsx`  
Expected: FAIL

- [ ] **Step 3: Modify `src/utils/exportService.ts` and `src/components/export/ExportModal.tsx`**

1. In `src/utils/exportService.ts`, add:
```typescript
export function downloadEncryptedJsonBackup(chart: TrustStructureChart, encryptedJson: string): void {
  const blob = new Blob([encryptedJson], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeTitle = sanitizeDownloadFilename(chart.metadata?.chartTitle, 'Trust');
  link.download = `${safeTitle}_Structure.json`;
  link.href = url;
  link.click();
  revokeObjectURLDeferred(url);
}
```

2. In `src/components/export/ExportModal.tsx`:
- Import `FEATURE_FLAGS` from `../../config/featureFlags`.
- Import `PasswordPromptModal` from `../common/PasswordPromptModal`.
- Import `encryptChart`, `decryptChart`, `isEncryptedEnvelope` from `../../utils/cryptoService`.
- Import `downloadEncryptedJsonBackup` from `../../utils/exportService`.
- Gate PDF button with `{FEATURE_FLAGS.enablePdfExport && ( ... )}`.
- Gate PPTX button with `{FEATURE_FLAGS.enablePptxExport && ( ... )}`.
- Handle JSON export:
  - If `FEATURE_FLAGS.enableJsonEncryption`: open `PasswordPromptModal` in `export` mode.
  - On submit with password: call `encryptChart({ metadata, entities, relationships }, password)`, call `downloadEncryptedJsonBackup`, close modal, set success message.
  - If not enabled: call `downloadJsonBackup({ metadata, entities, relationships })`.
- Handle JSON import:
  - On file read: inspect content.
  - Parse JSON. If `isEncryptedEnvelope(parsed)`: store content in state, open `PasswordPromptModal` in `import` mode.
  - On submit with password: call `decryptChart(content, password)`. If successful: `loadStructure(chart)`, close modal, show success message. If error: pass error message to `PasswordPromptModal`.
  - Else if `parseJsonBackup(content)`: load directly into store as legacy backup.

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npm test src/__tests__/components/export/ExportModal.test.tsx src/__tests__/utils/exportService.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
rtk git add src/utils/exportService.ts src/components/export/ExportModal.tsx src/__tests__/components/export/ExportModal.test.tsx src/__tests__/utils/exportService.test.ts
rtk git commit -m "feat(export): gate pdf/pptx behind feature flags and add encrypted json backup flow"
```

---

### Task 5: Full Verification & Pre-Commit/Pre-Push Quality Gate

**Files:**
- Entire codebase (`src/`)

**Steps:**
- [ ] **Step 1: Check Cognitive Complexity (< 15) and ESLint rules**

Run: `rtk npm run lint`  
Expected: PASS (zero lint warnings/errors)

- [ ] **Step 2: Run Full Test Suite with Coverage**

Run: `rtk npm run test:coverage`  
Expected: PASS (all tests pass, 100% statement, branch, function, and line coverage)

- [ ] **Step 3: Run Full Production Build & Audit**

Run: `rtk npm run verify:pre-push`  
Expected: PASS (Vite builds successfully and security audit passes with 0 vulnerabilities)

- [ ] **Step 4: Commit any test adjustments or coverage additions**

```bash
rtk git add .
rtk git commit -m "chore: ensure 100% test coverage and lint verification across export features"
```
