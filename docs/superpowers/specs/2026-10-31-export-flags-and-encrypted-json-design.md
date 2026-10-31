# Design Document: Export Feature Flags and Encrypted JSON Import/Export

**Date:** 2026-10-31  
**Status:** Approved  
**Topic:** Export Modularization, Soft Removal of PDF/PPTX, and Symmetric Encryption for JSON Backups  

---

## 1. Executive Summary & Goals

### 1.1 Context
In the current JERMChart desktop and web application:
1. Exporting to PowerPoint (`.pptx`) does not maintain the original dynamic aspect ratio of the chart canvas.
2. Exporting to PDF (`.pdf`) is less utilized given that high-resolution (2.5x DPI) raster PNG and infinite-scale vector SVG exports are already provided and can be directly embedded into client presentations or reports.
3. Chart structure backups saved to JSON are currently stored as plaintext JSON (`{ metadata, entities, relationships }`). Because corporate trust structures contain sensitive fiduciary, ownership, and director details, users require symmetric key encryption on JSON backups.

### 1.2 Goals
- **Soft Removal via Feature Flags**: Provide hard-coded compile/build flags (`enablePdfExport`, `enablePptxExport`) defaulting to `false`, hiding PDF and PPTX buttons in the UI while retaining their underlying generator functions in the codebase.
- **Symmetric Cryptography for JSON Backups**:
  - Secure JSON exports using **AES-GCM 256-bit** authenticated encryption with keys derived via **PBKDF2 (SHA-256, 100,000 iterations)**.
  - Zero external npm dependencies: utilize the native **Web Crypto API** (`window.crypto.subtle`).
  - Provide a self-describing encrypted envelope format in `.json`.
- **Strict Encryption Flow (Alternative A)**: When the encryption feature flag is enabled, saving a JSON chart requires entering and confirming a password. Decrypting upon import requires the same password.
- **Backwards Compatibility**: The import process must automatically detect and support legacy cleartext JSON chart files without requiring a password.
- **Hard-coded Feature Flag Control**: A dedicated flag `enableJsonEncryption` defaults to `true`. When set to `false`, JSON export reverts to plaintext.

---

## 2. Architecture & File Structure

```
src/
├── config/
│   └── featureFlags.ts             # Hard-coded feature flags for PDF, PPTX, and Encryption
├── utils/
│   ├── cryptoService.ts            # Web Crypto API wrappers (AES-GCM, PBKDF2, Base64)
│   └── exportService.ts            # JSON backup & export orchestration (updated)
├── components/
│   ├── common/
│   │   └── PasswordPromptModal.tsx # Reusable modal for password entry (export vs import)
│   └── export/
│       └── ExportModal.tsx         # Updated export dialog gating PDF/PPTX and handling encrypted JSON
└── __tests__/
    ├── utils/
    │   └── cryptoService.test.ts   # Comprehensive crypto unit tests
    └── components/
        ├── common/
        │   └── PasswordPromptModal.test.tsx
        └── export/
            └── ExportModal.test.tsx
```

---

## 3. Feature Flags Specification (`src/config/featureFlags.ts`)

```typescript
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

---

## 4. Cryptographic Specification (`src/utils/cryptoService.ts`)

### 4.1 Algorithms & Parameters
- **KDF**: PBKDF2
  - Hash: `SHA-256`
  - Salt: 16 bytes generated via `crypto.getRandomValues(new Uint8Array(16))`
  - Iteration Count: `100,000`
- **Cipher**: AES-GCM
  - Key Length: 256 bits
  - Initialization Vector (IV): 12 bytes generated via `crypto.getRandomValues(new Uint8Array(12))`
  - Tag Length: 128 bits (standard AES-GCM authentication tag)
- **Data Encoding**: Text encoded to UTF-8 (`TextEncoder`), binary encrypted data and parameters encoded to Base64 strings.

### 4.2 Encrypted JSON Schema
```json
{
  "format": "jermchart-encrypted",
  "version": 1,
  "kdf": {
    "algorithm": "PBKDF2",
    "hash": "SHA-256",
    "iterations": 100000,
    "salt": "<base64-salt>"
  },
  "cipher": {
    "algorithm": "AES-GCM",
    "iv": "<base64-iv>",
    "data": "<base64-ciphertext>"
  }
}
```

### 4.3 Type Definitions & Helper Functions
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
export async function encryptChart(chart: TrustStructureChart, password: string): Promise<string>;
export async function decryptChart(encryptedJson: string, password: string): Promise<TrustStructureChart>;
```

---

## 5. UI Components & User Interaction Flows

### 5.1 PasswordPromptModal (`src/components/common/PasswordPromptModal.tsx`)
A modal dialog with two operational modes:
- **`mode: 'export'`**:
  - Title: *"Encrypt Chart Backup"*
  - Description: *"Enter a password to encrypt this structure chart. You will need this password to import the chart later."*
  - Fields:
    - **Password** (input with toggle visibility button)
    - **Confirm Password** (input with toggle visibility button)
  - Validation: Password cannot be empty; Confirm Password must match Password.
  - Buttons: Cancel, Encrypt & Download.
- **`mode: 'import'`**:
  - Title: *"Decrypt Chart Backup"*
  - Description: *"This chart is password-protected. Enter the password used during export to decrypt."*
  - Fields:
    - **Password** (input with toggle visibility button)
  - Error Banner: Displayed inline if decryption fails (*"Incorrect password or corrupted file"*).
  - Buttons: Cancel, Decrypt & Load.

### 5.2 ExportModal Updates (`src/components/export/ExportModal.tsx`)
- **PDF & PPTX Gating**:
  - Check `FEATURE_FLAGS.enablePdfExport` before rendering the PDF button card.
  - Check `FEATURE_FLAGS.enablePptxExport` before rendering the PowerPoint button card.
- **JSON Export Handler (`handleDownloadBackup`)**:
  - If `FEATURE_FLAGS.enableJsonEncryption` is `false`: Call `downloadJsonBackup(chart)` directly.
  - If `FEATURE_FLAGS.enableJsonEncryption` is `true`: Open `PasswordPromptModal` in `export` mode.
- **JSON Import Handler (`handleUploadBackup`)**:
  - Read uploaded `.json` text.
  - Attempt to parse as JSON.
  - If `isEncryptedEnvelope(parsed)`:
    - Open `PasswordPromptModal` in `import` mode, passing the encrypted content string.
  - Else if `parseJsonBackup(parsed)`:
    - Load legacy cleartext chart directly into the Zustand store.
  - Else:
    - Show invalid backup file error.

---

## 6. Error Handling & Edge Cases

| Scenario | Behavior |
| :--- | :--- |
| **Incorrect Decryption Password** | AES-GCM fails authentication. Decryption helper catches error and throws `Error('Invalid password or corrupted file')`. Modal displays an error badge and stays open for retry. |
| **Corrupted / Truncated Ciphertext** | Base64 decode or AES-GCM authentication fails; handled gracefully with user-friendly error notice. |
| **Empty Password on Export** | Form validation disables submit button until password is typed. |
| **Password Mismatch on Export** | Form displays inline warning: *"Passwords do not match"*. |
| **Tampered / Malformed Legacy JSON** | Checked via `parseJsonBackup`; invalid structure triggers standard error modal without crashing. |
| **Feature Flag Disabled** | PDF / PPTX buttons completely absent from DOM; JSON export downloads cleartext directly without opening password modal. |

---

## 7. Testing & Quality Requirements

- **Rule 4 Compliance**: Cognitive complexity strictly below 15 for all functions in `cryptoService.ts`, `PasswordPromptModal.tsx`, and `ExportModal.tsx`.
- **Rule 5 Compliance**: Linear, safe regular expressions for filename sanitization and string utilities.
- **Rule 6 Compliance**: All tests located exclusively under `src/__tests__/`.
- **Test Matrix**:
  1. `src/__tests__/utils/cryptoService.test.ts`:
     - Successful encryption and decryption roundtrip.
     - Tampered ciphertext rejection (authenticity tag failure).
     - Wrong password rejection.
     - Detection of encrypted vs plaintext payloads.
     - Base64 encoding/decoding corner cases.
  2. `src/__tests__/components/common/PasswordPromptModal.test.tsx`:
     - Renders export mode with confirmation field and validation.
     - Renders import mode with single password field.
     - Toggles password visibility.
     - Displays decryption error message on failure.
  3. `src/__tests__/components/export/ExportModal.test.tsx`:
     - Verifies PDF and PPTX buttons do not render when flags are `false`.
     - Verifies encrypted export workflow when `enableJsonEncryption` is `true`.
     - Verifies cleartext export workflow when `enableJsonEncryption` is `false`.
     - Verifies legacy cleartext file import without password prompt.
     - Verifies encrypted file import prompts for password and loads on success.
