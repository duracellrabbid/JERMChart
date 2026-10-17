## Why

A comprehensive codebase audit identified eight edge-case bugs, security vulnerabilities, resource leaks, and cleanup opportunities across Excel parsing, canvas interaction, desktop process isolation, and export generation. Resolving these defects now prevents data corruption in multi-class shareholding charts, guards the desktop application against arbitrary protocol launches, stops memory leakage during photo OCR, and prunes unused dependencies.

## What Changes

- **Excel Multi-Share Class Edge Disambiguation**: Ensure entities with multiple parent holdings from the same parent entity receive unique relationship IDs, preventing React Flow dropped edges and duplicate key warnings.
- **Desktop External Protocol Validation**: Restrict `shell.openExternal` in Electron's `setWindowOpenHandler` strictly to `http:` and `https:` schemes, preventing execution of local file URLs or custom OS handlers.
- **Canvas Connection Guard**: Validate that both source and target in `onConnect` belong to recognized entities in the structure store, disallowing accidental ownership relationships involving satellite role pill nodes.
- **Photo Import Resource Management**: Properly revoke blob object URLs (`URL.revokeObjectURL`) when selecting new diagram photos or unmounting the import modal, eliminating browser memory leakage.
- **PDF Export Fallback**: Provide a reliable fallback chart title when generating A4 PDFs to prevent jsPDF runtime crashes on empty or untitled charts.
- **Unused Dependency Pruning**: Remove `"openai"` from `package.json` production dependencies, since vision OCR operates exclusively via `@google/genai`.
- **Dead Code Cleanup**: Remove unused `src/utils/urlUtils.ts` and its re-export in `chartVisionService.ts`.
- **Layout Graph Sanitization**: Filter out relationships referencing nonexistent entity IDs before submitting the graph to `@dagrejs/dagre`.

## Capabilities

### New Capabilities
- `structure-chart-integrity`: Enforces unique edge identifiers for multi-class holdings, rejects invalid canvas handle connections to satellite nodes, and sanitizes layout inputs against orphan references.
- `client-desktop-hardening`: Enforces safe protocol boundaries for desktop external navigation, guarantees proper object URL lifecycle cleanup for photo imports, and hardens document export against missing metadata.

### Modified Capabilities
<!-- None -->

## Impact

- Affected files: `src/utils/excelParser.ts`, `electron/main.cjs`, `src/components/canvas/StructureCanvas.tsx`, `src/components/import/PhotoImportModal.tsx`, `src/utils/exportService.ts`, `src/utils/layoutEngine.ts`, `src/services/ai/chartVisionService.ts`, `package.json`, and associated test suites.
- Dependencies: Uninstalls unused `openai` package; reduces bundle weight and attack surface.
- APIs: Zero breaking changes to public interfaces or data schemas.
