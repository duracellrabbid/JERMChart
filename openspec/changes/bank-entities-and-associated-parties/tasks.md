## 1. Type System and Store Overhaul

- [x] 1.1 Update `src/types/structure.ts` to include `'Bank'` in `EntityType`, declare `AssociatedParty`, and replace `directors` with `associatedParties` on `EntityNodeData`
- [x] 1.2 Update store mutations and actions in `src/store/useStructureStore.ts` for managing associated parties (`addAssociatedParty`, `removeAssociatedParty`)
- [x] 1.3 Update sample structure data in `src/data/sampleStructure.ts` with Bank entities and associated roles matching `samples/sample.jpg`
- [x] 1.4 Write unit tests in `src/__tests__/store/useStructureStore.test.ts` for new entity types and party mutations

## 2. Bank Entity and Streamlined Shapes

- [x] 2.1 Create `BankCircleCard` component in `src/components/nodes/EntityCardNode.tsx` with circular styling (diameter 180px) and multi-directional handles
- [x] 2.2 Streamline `TrustTriangleCard` and `SubsidiarySquareCard` by removing internal director rows and overflow badges
- [x] 2.3 Implement `SatelliteRoleCard` component in `src/components/nodes/EntityCardNode.tsx` for external hybrid role presentation
- [x] 2.4 Update `src/utils/entityStyle.ts` with styling, colors, and icons for Bank and associated roles
- [x] 2.5 Write unit tests in `src/__tests__/components/nodes/EntityCardNode.test.tsx` and `src/__tests__/utils/entityStyle.test.ts`

## 3. Two-Phase Layout Engine & Equal Left/Right Placement

- [x] 3.1 Update dimensions calculation in `src/utils/layoutEngine.ts` to support Bank entities
- [x] 3.2 Implement two-phase layout in `calculateSortedLayout`: Dagre hierarchical layout for core entities, followed by hybrid satellite role card grouping
- [x] 3.3 Implement balanced 50/50 Left/Right placement distributing $\lceil N/2 \rceil$ satellite cards to the Left and $\lfloor N/2 \rfloor$ to the Right of each entity
- [x] 3.4 Generate directed association edges linking satellite card handles into parent entity handles
- [x] 3.5 Write unit tests in `src/__tests__/utils/layoutEngine.test.ts` verifying equal distribution and Bank layout

## 4. Ecosystem & Import/Export/AI Updates

- [x] 4.1 Update `src/utils/excelExporter.ts` and `src/utils/excelParser.ts` for Bank entity types and Associated Parties with role columns
- [x] 4.2 Update `src/services/ai/chartVisionService.ts` system prompt and parsing to identify Bank nodes and external associated roles
- [x] 4.3 Update `src/components/sidebar/EntityDetailsTab.tsx` and generalize `DirectorsDirectoryTab.tsx` for multi-role fiduciary tracking
- [x] 4.4 Write/update unit tests in `src/__tests__/utils/excelParser.test.ts`, `src/__tests__/utils/excelExporter.test.ts`, and sidebar tests

## 5. Version Bump and Quality Gate Verification

- [x] 5.1 Update version in `package.json` to `1.1.0`
- [x] 5.2 Execute pre-commit quality gate (`rtk npm run verify:pre-commit`) and confirm 100% test coverage and zero lint errors
- [x] 5.3 Execute pre-push quality gate (`rtk npm run verify:pre-push`) to validate production build and zero audit vulnerabilities
