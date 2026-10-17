## 1. Edge & Excel Parsing Integrity

- [x] 1.1 Update `parseExcelWorkbook` in `src/utils/excelParser.ts` to disambiguate edge IDs using an index suffix (`rel-${parentEntry.entity.id}-${entity.id}-${relationships.length}`)
- [x] 1.2 Add tests in `src/__tests__/utils/excelParser.test.ts` verifying multiple share classes between the same parent and subsidiary receive unique IDs and render without collisions

## 2. Desktop Security Hardening

- [x] 2.1 Update `setWindowOpenHandler` in `electron/main.cjs` to validate `http:` and `https:` URL protocols before calling `shell.openExternal`
- [x] 2.2 Update unit tests in `src/__tests__/electron/main.test.ts` to verify non-web protocols (`file:`, `javascript:`, custom schemes) are blocked from `shell.openExternal`

## 3. Canvas & Layout Graph Protection

- [x] 3.1 Guard `onConnect` in `src/components/canvas/StructureCanvas.tsx` to verify both source and target match known entity IDs and disallow satellite node IDs (`sat-*`)
- [x] 3.2 Filter out orphan relationships referencing nonexistent entity IDs in `calculateSortedLayout` within `src/utils/layoutEngine.ts`
- [x] 3.3 Add tests in `src/__tests__/components/canvas/StructureCanvas.test.tsx` and `src/__tests__/utils/layoutEngine.test.ts` covering invalid connection rejection and orphan relationship pruning

## 4. Resource & Export Hardening

- [x] 4.1 Implement blob object URL revocation on image re-selection and component unmount in `src/components/import/PhotoImportModal.tsx`
- [x] 4.2 Add fallback title handling in `exportToPdf` within `src/utils/exportService.ts` for empty or missing chart titles
- [x] 4.3 Add unit tests in `src/__tests__/components/import/PhotoImportModal.test.tsx` and `src/__tests__/utils/exportService.test.ts` verifying preview cleanup and empty title PDF generation

## 5. Dependency Pruning & Codebase Cleanup

- [x] 5.1 Remove unused `"openai"` dependency from `package.json` and sync package lockfile
- [x] 5.2 Delete dead `src/utils/urlUtils.ts`, its test suite `src/__tests__/utils/urlUtils.test.ts`, and remove its re-export in `src/services/ai/chartVisionService.ts`
- [x] 5.3 Run `rtk npm run verify:pre-commit` and `rtk npm run verify:pre-push` to guarantee zero lint violations and 100% test coverage
