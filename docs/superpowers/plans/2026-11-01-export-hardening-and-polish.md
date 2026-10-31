# Export Hardening and Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the 4 quality, safety, and lean fixes identified in review: retain staged nodes during JSON exports, enforce an upper bound on PBKDF2 iterations to prevent CPU freeze attacks, add autocomplete attributes to password fields, and streamline the encrypted download helper signature.

**Architecture:** Refine `cryptoService.ts` with strict KDF iteration bounds (`1` to `1,000,000`), simplify `downloadEncryptedJsonBackup` in `exportService.ts` to take `filename?: string` instead of a full chart object, wire `stagedNodes` through `ExportModal.tsx`, and add proper `autoComplete` attributes to `PasswordPromptModal.tsx`.

**Tech Stack:** TypeScript 5.9, React 19, Zustand 5, Web Crypto API (`window.crypto.subtle`), Vitest 5, Tailwind CSS.

## Global Constraints

- Cognitive complexity must be strictly below 15 for every function (Rule 4).
- All regular expressions must run in linear time with no catastrophic backtracking (Rule 5).
- All tests must reside inside `src/**/__tests__/` (Rule 6).
- 100% test coverage threshold required by `npm run test:coverage`.
- Shell commands must be prefixed with `rtk` (Rule 2).
- USER INSTRUCTION: Keep all changes uncommitted in the working tree for user review.

---

### Task 1: Enforce Safe Bounds on KDF Iterations in `cryptoService.ts`

**Files:**
- Modify: `src/utils/cryptoService.ts:37-47,140-146`
- Test: `src/__tests__/utils/cryptoService.test.ts`

**Interfaces:**
- Consumes:
  - `EncryptedChartEnvelope` from `src/utils/cryptoService.ts`
- Produces:
  - Enforced iteration boundary `1 <= iterations <= 1,000,000` in `isEncryptedEnvelope` and `decryptChart`.

- [ ] **Step 1: Write the failing tests**

Add tests to `src/__tests__/utils/cryptoService.test.ts`:
```typescript
it('rejects envelope if iterations is missing, zero, negative, or exceeds 1,000,000', async () => {
  const validEncrypted = await encryptChart(mockChart, 'SecretPass123!');
  const envelope = JSON.parse(validEncrypted);

  // Exceeding maximum iterations (DoS protection)
  const excessiveEnvelope = {
    ...envelope,
    kdf: { ...envelope.kdf, iterations: 10_000_000 },
  };
  await expect(
    decryptChart(JSON.stringify(excessiveEnvelope), 'SecretPass123!')
  ).rejects.toThrow('Invalid encrypted file format');

  // Zero iterations
  const zeroEnvelope = {
    ...envelope,
    kdf: { ...envelope.kdf, iterations: 0 },
  };
  await expect(
    decryptChart(JSON.stringify(zeroEnvelope), 'SecretPass123!')
  ).rejects.toThrow('Invalid encrypted file format');

  // Negative iterations
  const negativeEnvelope = {
    ...envelope,
    kdf: { ...envelope.kdf, iterations: -5 },
  };
  await expect(
    decryptChart(JSON.stringify(negativeEnvelope), 'SecretPass123!')
  ).rejects.toThrow('Invalid encrypted file format');

  // Non-number iterations
  const stringIterEnvelope = {
    ...envelope,
    kdf: { ...envelope.kdf, iterations: '100000' },
  };
  await expect(
    decryptChart(JSON.stringify(stringIterEnvelope), 'SecretPass123!')
  ).rejects.toThrow('Invalid encrypted file format');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npm test src/__tests__/utils/cryptoService.test.ts`  
Expected: FAIL (excessive iterations does not throw 'Invalid encrypted file format')

- [ ] **Step 3: Implement minimal code**

In `src/utils/cryptoService.ts`:
1. Define iteration limits:
```typescript
export const MIN_KDF_ITERATIONS = 1;
export const MAX_KDF_ITERATIONS = 1_000_000;
```
2. In `isEncryptedEnvelope`:
```typescript
export function isEncryptedEnvelope(data: unknown): data is EncryptedChartEnvelope {
  if (!data || typeof data !== 'object') return false;
  const env = data as Partial<EncryptedChartEnvelope>;
  return (
    env.format === 'jermchart-encrypted' &&
    typeof env.version === 'number' &&
    typeof env.kdf?.iterations === 'number' &&
    env.kdf.iterations >= MIN_KDF_ITERATIONS &&
    env.kdf.iterations <= MAX_KDF_ITERATIONS &&
    typeof env.kdf?.salt === 'string' &&
    typeof env.cipher?.iv === 'string' &&
    typeof env.cipher?.data === 'string'
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npm test src/__tests__/utils/cryptoService.test.ts`  
Expected: PASS

---

### Task 2: Simplify `downloadEncryptedJsonBackup` Signature in `exportService.ts`

**Files:**
- Modify: `src/utils/exportService.ts:47-59`
- Modify: `src/components/export/ExportModal.tsx:121`
- Test: `src/__tests__/utils/exportService.test.ts`
- Test: `src/__tests__/components/export/ExportModal.test.tsx`

**Interfaces:**
- Produces:
  ```typescript
  export function downloadEncryptedJsonBackup(encryptedJson: string, filename?: string): void;
  ```

- [ ] **Step 1: Write the failing tests**

Update `src/__tests__/utils/exportService.test.ts`:
```typescript
it('triggers file download with encrypted payload and deferred revocation', () => {
  vi.useFakeTimers();
  const mockCipherJson = JSON.stringify({ format: 'jermchart-encrypted', cipher: { data: 'xyz' } });
  downloadEncryptedJsonBackup(mockCipherJson, 'MyCustomTrust');

  expect(createObjectURLSpy).toHaveBeenCalled();
  expect(clickSpy).toHaveBeenCalled();
  expect(revokeObjectURLSpy).not.toHaveBeenCalled();

  vi.advanceTimersByTime(1000);
  expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
  vi.useRealTimers();
});

it('falls back to default title "Trust" when filename is missing or undefined', () => {
  downloadEncryptedJsonBackup('{"encrypted":true}');
  expect(createObjectURLSpy).toHaveBeenCalled();

  downloadEncryptedJsonBackup('{"encrypted":true}', '');
  expect(createObjectURLSpy).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npm test src/__tests__/utils/exportService.test.ts`  
Expected: FAIL (signature mismatch)

- [ ] **Step 3: Implement minimal code**

In `src/utils/exportService.ts`:
```typescript
export function downloadEncryptedJsonBackup(encryptedJson: string, filename?: string): void {
  const blob = new Blob([encryptedJson], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeTitle = sanitizeDownloadFilename(filename, 'Trust');
  link.download = `${safeTitle}_Structure.json`;
  link.href = url;
  link.click();
  revokeObjectURLDeferred(url);
}
```

In `src/components/export/ExportModal.tsx`:
Update call site:
```typescript
downloadEncryptedJsonBackup(encryptedJson, metadata.chartTitle);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `rtk npm test src/__tests__/utils/exportService.test.ts src/__tests__/components/export/ExportModal.test.tsx`  
Expected: PASS

---

### Task 3: Retain `stagedNodes` in JSON Backup & Restore in `ExportModal.tsx`

**Files:**
- Modify: `src/components/export/ExportModal.tsx:28,109,117-122`
- Test: `src/__tests__/components/export/ExportModal.test.tsx`

**Interfaces:**
- Consumes:
  - `stagedNodes` from `useStructureStore`

- [ ] **Step 1: Write the failing tests**

In `src/__tests__/components/export/ExportModal.test.tsx`:
Add a test verifying that `stagedNodes` in the store are preserved and passed to `downloadJsonBackup` and `encryptChart`:
```typescript
it('preserves stagedNodes from store during JSON export (both cleartext and encrypted)', async () => {
  useStructureStore.setState({
    stagedNodes: [
      {
        id: 'staged-1',
        kind: 'person',
        name: 'Jane Doe',
        position: { x: 50, y: 50 },
      },
    ],
  });

  // Test cleartext export preserves stagedNodes
  mockFeatureFlags.enableJsonEncryption = false;
  const { unmount } = render(<ExportModal onClose={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: /Save JSON File/i }));
  expect(exportService.downloadJsonBackup).toHaveBeenCalledWith(
    expect.objectContaining({
      stagedNodes: [
        expect.objectContaining({ id: 'staged-1', name: 'Jane Doe' }),
      ],
    })
  );
  unmount();

  // Test encrypted export preserves stagedNodes
  mockFeatureFlags.enableJsonEncryption = true;
  render(<ExportModal onClose={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: /Save JSON File/i }));
  fireEvent.change(screen.getByLabelText(/^Password/i), { target: { value: 'Secret123' } });
  fireEvent.change(screen.getByLabelText(/^Confirm Password/i), { target: { value: 'Secret123' } });
  fireEvent.click(screen.getByRole('button', { name: /Encrypt & Download/i }));

  await waitFor(() => {
    expect(cryptoService.encryptChart).toHaveBeenCalledWith(
      expect.objectContaining({
        stagedNodes: [
          expect.objectContaining({ id: 'staged-1', name: 'Jane Doe' }),
        ],
      }),
      'Secret123'
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npm test src/__tests__/components/export/ExportModal.test.tsx`  
Expected: FAIL (`stagedNodes` not found in `downloadJsonBackup` or `encryptChart` call arguments)

- [ ] **Step 3: Implement minimal code**

In `src/components/export/ExportModal.tsx`:
1. Retrieve `stagedNodes`:
```typescript
const stagedNodes = useStructureStore((state) => state.stagedNodes);
```
2. In `handleDownloadBackup`:
```typescript
downloadJsonBackup({ metadata, entities, relationships, stagedNodes });
```
3. In `handleExportPasswordSubmit`:
```typescript
const encryptedJson = await encryptChart(
  { metadata, entities, relationships, stagedNodes },
  password
);
downloadEncryptedJsonBackup(encryptedJson, metadata.chartTitle);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npm test src/__tests__/components/export/ExportModal.test.tsx`  
Expected: PASS

---

### Task 4: Add `autoComplete` Attributes in `PasswordPromptModal.tsx`

**Files:**
- Modify: `src/components/common/PasswordPromptModal.tsx:120-128,148-156`
- Test: `src/__tests__/components/common/PasswordPromptModal.test.tsx`

**Interfaces:**
- Produces:
  - `autoComplete={isExport ? 'new-password' : 'current-password'}` on primary password field
  - `autoComplete="new-password"` on confirm password field

- [ ] **Step 1: Write the failing tests**

In `src/__tests__/components/common/PasswordPromptModal.test.tsx`:
```typescript
it('sets appropriate autocomplete attributes for password managers and browser hints', () => {
  const { unmount } = render(
    <PasswordPromptModal isOpen={true} mode="export" onSubmit={vi.fn()} onClose={vi.fn()} />
  );
  expect(screen.getByLabelText(/^Password/i)).toHaveAttribute('autocomplete', 'new-password');
  expect(screen.getByLabelText(/^Confirm Password/i)).toHaveAttribute('autocomplete', 'new-password');
  unmount();

  render(
    <PasswordPromptModal isOpen={true} mode="import" onSubmit={vi.fn()} onClose={vi.fn()} />
  );
  expect(screen.getByLabelText(/^Password/i)).toHaveAttribute('autocomplete', 'current-password');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npm test src/__tests__/components/common/PasswordPromptModal.test.tsx`  
Expected: FAIL (missing `autocomplete` attribute)

- [ ] **Step 3: Implement minimal code**

In `src/components/common/PasswordPromptModal.tsx`:
1. On primary password input:
```tsx
autoComplete={isExport ? 'new-password' : 'current-password'}
```
2. On confirm password input:
```tsx
autoComplete="new-password"
```

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npm test src/__tests__/components/common/PasswordPromptModal.test.tsx`  
Expected: PASS

---

### Task 5: Full Verification Gate

**Files:**
- Entire codebase (`src/`)

**Steps:**
- [ ] **Step 1: Check Cognitive Complexity and Lint Rules**

Run: `rtk npm run lint`  
Expected: PASS (0 errors, 0 warnings)

- [ ] **Step 2: Run Test Suite with 100% Coverage**

Run: `rtk npm run verify:pre-commit`  
Expected: PASS (all 40 test files pass, 100% statement, branch, function, and line coverage)

- [ ] **Step 3: Run Production Compilation Build**

Run: `rtk npm run build`  
Expected: PASS (TypeScript compilation & Vite production bundle created cleanly)
