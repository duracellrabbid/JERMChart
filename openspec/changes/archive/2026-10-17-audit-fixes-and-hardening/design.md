## Context

The JERMChart repository operates 100% locally with zero server backend. State is managed centrally in Zustand (`useStructureStore`), visualized via `@xyflow/react` and `@dagrejs/dagre`, and packaged for desktop using Electron. See `proposal.md` for motivation. All changes must respect AGENTS.md rules: cognitive complexity strictly < 15, linear ReDoS-free string operations, 100% test coverage maintained, and tests isolated in `__tests__/`.

## Goals / Non-Goals

**Goals:**
- Eliminate ID collisions in Excel import for multiple share classes while preserving exact relationship ordering.
- Harden Electron desktop window handler against arbitrary protocol execution.
- Prevent invalid relationship states in canvas `onConnect` and layout engine.
- Reclaim memory on photo uploads in `PhotoImportModal`.
- Remove dead code (`urlUtils.ts`) and unused production dependencies (`openai`).
- Ensure all functions remain strictly under 15 cognitive complexity.

**Non-Goals:**
- Modifying the underlying data models (`EntityNodeData`, `OwnershipEdgeData`).
- Changing Dagre layout coordinates or visual themes.
- Altering AI OCR prompt or Google Gemini integration.

## Decisions

### Decision 1: Disambiguate Excel Relationship IDs with Index Suffix
- **Approach**: In `src/utils/excelParser.ts`, when iterating over `parentNames`, generate relationship IDs as:
  `id: 'rel-' + parentEntry.entity.id + '-' + entity.id + '-' + relationships.length`
- **Rationale**: Guarantees uniqueness across all imported edges even when the same parent and child share multiple lines.
- **Alternatives considered**:
  - `crypto.randomUUID()`: Non-deterministic in tests and adds overhead.
  - Suffix with `shareClass`: Fails if multiple rows specify the same share class or empty strings.

### Decision 2: Guard `setWindowOpenHandler` with Strict Protocol Regex / Prefix
- **Approach**: In `electron/main.cjs`, parse the URL with `new URL(url)` or verify `url.startsWith('https://') || url.startsWith('http://')` before calling `shell.openExternal`.
- **Rationale**: Standard Electron security best practice. Denies `file:`, `javascript:`, and arbitrary OS custom schemes.
- **Alternatives considered**:
  - Using `ALLOWED_PROTOCOLS` set: `ALLOWED_PROTOCOLS` in `main.cjs` includes `file:` and `blob:` which should NOT be opened externally in the system browser.

### Decision 3: Filter Valid Entity IDs in `onConnect` and `calculateSortedLayout`
- **Approach**:
  - In `StructureCanvas.tsx`: Ensure `connection.source` and `connection.target` exist in `entities` array, filtering out any satellite pill IDs (`sat-*`).
  - In `layoutEngine.ts`: Check `entityMap.has(rel.source) && entityMap.has(rel.target)` before adding edges to Dagre and the returned layout edges.
- **Rationale**: Defensive coding at both the user interaction layer and the algorithmic layout engine.
- **Alternatives considered**:
  - Setting handles on satellite nodes to `isConnectable={false}`: React Flow custom handles may still emit connections if dragged onto; validation in `onConnect` provides guaranteed store protection.

### Decision 4: Lifecycle Cleanup via React `useEffect` for Preview URLs
- **Approach**: In `PhotoImportModal.tsx`, track `previewUrl` with cleanup. When updating `previewUrl`, call `URL.revokeObjectURL(prevUrl)`. Add an unmount cleanup effect:
  ```ts
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);
  ```
- **Rationale**: Prevents unbounded memory growth when users select multiple high-resolution photos.

### Decision 5: Dependency & Dead Code Elimination
- **Approach**: Run `npm uninstall openai`. Delete `src/utils/urlUtils.ts` and `src/__tests__/utils/urlUtils.test.ts`. Remove `export { trimTrailingSlashes } from ...` in `chartVisionService.ts` and its test block in `chartVisionService.test.ts`.
- **Rationale**: Zero code imports `openai`. URL utilities were left over from legacy endpoint joining and are never invoked in production.

## Risks / Trade-offs

- **[Risk] Test breakage on removed `urlUtils` exports** → Update `chartVisionService.test.ts` and `urlUtils.test.ts` to remove obsolete tests while maintaining 100% coverage on existing features.
- **[Risk] Existing Excel edge ID assertions in tests** → Update test fixtures in `excelParser.test.ts` to expect the indexed edge ID format.
- **[Risk] Cognitive complexity regression** → Use guard clauses and helper functions to keep all touched functions < 15.
