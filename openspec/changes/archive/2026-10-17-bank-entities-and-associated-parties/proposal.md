## Why

In complex corporate trust and wealth management structures, fiduciary administrators and trust officers regularly model banking relationships (e.g. depository accounts, corporate bank accounts, and financing banks) as distinct circular entities under operating or holding companies. Furthermore, real-world fiduciary governance involves diverse roles beyond directors—such as Settlors, Protectors, Enforcers, Asset Contributors, Authorised Signatories, and Fund Managers.

Currently, JERMChart only supports a fixed set of rectangular or triangular entities, restricts people to directors rendered directly inside entity cards, and lacks support for external role cards. Presenting associated parties as separate satellite shapes beside the organization (as demonstrated in hand-drawn fiduciary diagrams) dramatically clarifies governance lines and declutters entity cards.

## What Changes

- **BREAKING**: Replaced the `directors: Director[]` field on `EntityNodeData` with generalized `associatedParties: AssociatedParty[]`, removing internal director rows from entity cards. Backward compatibility is deliberately not preserved.
- **New Entity Type: Bank (Circle)**: Added `Bank` to `EntityType`, rendered as a dedicated circular shape with banking metadata (institution name, branch/domicile, account/SWIFT ref, status) and directional handles.
- **Hybrid External Satellite Cards**: Associated parties are presented as standalone hybrid shapes placed beside the organization (role-grouped for multiple individuals of the same role, or individual cards for single individuals).
- **Equal Left/Right Auto-Tidy Distribution**: Layout engine distributes an organization's satellite role cards equally across its Left and Right sides (balanced $\lceil N/2 \rceil$ on the Left, $\lfloor N/2 \rfloor$ on the Right) with directed connector arrows pointing into the organization.
- **Ecosystem Updates**:
  - Excel Import & Export updated to handle `Associated Parties` with arbitrary fiduciary roles and `Bank` entity types.
  - Vision OCR service updated to recognize circular Bank nodes and external associated party boxes.
  - Directory Tab in sidebar generalized from Directors Directory to Associated Parties Directory with multi-role filtering.
  - Version bump in `package.json` to `1.1.0`.

## Capabilities

### New Capabilities
- `bank-entity`: Introduces the `Bank` entity type rendered as a circular node with dedicated banking metadata, top/bottom/left/right connection handles, and full layout engine integration.
- `associated-parties`: Introduces generalized `AssociatedParty` governance roles (Enforcer, Director, Settlor, Protector, Asset Contributor, Authorised Signatory, Fund Manager, and custom roles) displayed as hybrid external satellite cards distributed equally beside entities.

### Modified Capabilities
- `chart-director-cap`: Deprecates internal director row truncation in favor of external satellite party layout controls, reflecting the removal of people lists from inside entity cards.

## Impact

- **Types & Store**: `src/types/structure.ts` and `src/store/useStructureStore.ts` replace `directors` with `associatedParties` and add `'Bank'` to `EntityType`.
- **Canvas & Rendering**: `src/components/nodes/EntityCardNode.tsx` adds `BankCircleCard` and external satellite node generation; `TrustTriangleCard` and `SubsidiarySquareCard` internal director rows are removed.
- **Layout Engine**: `src/utils/layoutEngine.ts` implements two-phase layout (Dagre hierarchical positioning for core entities, followed by balanced Left/Right satellite positioning).
- **Import/Export/AI**: `src/utils/excelParser.ts`, `src/utils/excelExporter.ts`, and `src/services/ai/chartVisionService.ts` updated to the new data model.
- **Sidebar Inspector**: `src/components/sidebar/EntityDetailsTab.tsx` and `DirectorsDirectoryTab.tsx` updated for managing and searching all associated party roles.
- **Version**: `package.json` updated to `1.1.0`.
