## Context

JERMChart currently models corporate structures where entities can only be Trusts, Companies, LLCs, Partnerships, Foundations, or Individuals. Board members were hardcoded as `directors: Director[]` and embedded directly inside entity cards.

As seen in real-world trust structures (e.g. `samples/sample.jpg`), entities need to connect to Banks (circular shapes), and fiduciary roles include Settlors, Protectors, Enforcers, Asset Contributors, Authorised Signatories, and Fund Managers. These parties must be placed outside the entity shapes, flanking them on both sides.

## Goals / Non-Goals

**Goals:**
- Introduce `'Bank'` entity type rendered as a circular node (diameter 180px) with custom styling and handles.
- Replace `directors: Director[]` with `associatedParties: AssociatedParty[]`, supporting arbitrary roles.
- Remove internal director rows from `TrustTriangleCard` and `SubsidiarySquareCard` for clean, compact cards.
- Implement hybrid satellite role cards: grouping multiple individuals under the same role into one role card, and rendering single individuals as dedicated cards.
- Update the layout engine to perform a two-phase layout: Dagre top-down layout on the core corporate hierarchy, followed by balanced 50/50 Left/Right placement of satellite cards beside each entity.
- Update Excel import/export, Vision OCR, Sidebar Inspector, and sample data.
- Bump application version to `1.1.0`.

**Non-Goals:**
- Backward compatibility with legacy JSON structures containing `directors`. (The user explicitly mandated a clean break without backward compatibility).
- Complex physics-based force simulation. (We maintain deterministic Dagre + geometric offset calculations).

## Decisions

### Decision 1: Generalized Associated Parties Model
- **Choice**: In `src/types/structure.ts`, define:
  ```typescript
  export interface AssociatedParty {
    id: string;
    name: string;
    role: string;
    isCorporate?: boolean;
    isResident?: boolean;
    appointmentDate?: string;
  }
  ```
  On `EntityNodeData`, `directors: Director[]` is replaced by `associatedParties: AssociatedParty[]`.
- **Rationale**: Fiduciary structures require flexibility across jurisdiction-specific titles (e.g. "Protector", "Enforcer", "Settlor", "Asset Contributor", "Authorised Signatory", "Fund Manager").
- **Alternatives Considered**: Separate canvas nodes for people. Rejected because it would distort the corporate parent-child ownership tree in Dagre.

### Decision 2: Hybrid Satellite Card Granularity
- **Choice**:
  - If an entity has multiple parties with the same role (e.g., 2 Directors), group them into a single role card titled `"Directors"` listing the members.
  - If a party has a unique role on that entity (e.g., 1 Settlor, 1 Protector), render as a dedicated card showing the individual's name and role badge.
- **Rationale**: Exactly mirrors the fiduciary convention in `samples/sample.jpg` while minimizing canvas visual clutter.
- **Alternatives Considered**: 1 card per person regardless of role (too many cards for boards of 5+ directors) or strictly 1 card per role category (lacks per-person granularity for solo fiduciaries).

### Decision 3: Two-Phase Layout Engine & Equal Left/Right Distribution
- **Choice**:
  - **Phase 1**: Run Dagre with `rankdir: 'TB'` on core entities (`Trust`, `Company`, `Bank`) using ownership/holding relationships.
  - **Phase 2**: For each entity, collect its hybrid satellite cards. Distribute them equally:
    - $\lceil N / 2 \rceil$ cards positioned to the **Left** ($X_{\text{entity}} - W_{\text{sat}} - \text{GAP}$).
    - $\lfloor N / 2 \rfloor$ cards positioned to the **Right** ($X_{\text{entity}} + W_{\text{entity}} + \text{GAP}$).
    - Vertically centered/stacked beside the parent entity.
    - Generate association edges connecting satellite handles to the entity's left or right handles.
- **Rationale**: Dagre cannot natively handle horizontal side-car placement inside a `rankdir: 'TB'` tree without corrupting vertical ranks. Pure post-processing guarantees exact geometric alignment.

### Decision 4: Circular Bank Node
- **Choice**: Create `BankCircleCard` with diameter = 180px, `rounded-full` styling, Landmark icon, institution name, jurisdiction/branch, account/ref code, status dot, and top/bottom/left/right connection handles.
- **Rationale**: Distinguishes depository and financing nodes from corporate equity entities.

### Decision 5: Cognitive Complexity and Linear Parsing
- In compliance with Rule 4 & 5 (AGENTS.md):
  - Helper functions in `layoutEngine.ts` and `excelParser.ts` decompose iteration and distribution logic into pure helper functions with cognitive complexity strictly < 15.
  - String parsing for roles and names uses native string methods (`indexOf`, `slice`, `trim`, `split`) or linear regex without nested quantifiers.

## Risks / Trade-offs

- **[Risk]**: Left/right satellite cards from neighboring entities could overlap if horizontal node spacing is too narrow.
  - **Mitigation**: Increase Dagre `nodesep` dynamically or base it on satellite card presence (e.g., increase `nodesep` from 60 to 180 when entities have satellite cards).
- **[Risk]**: Excel import of legacy spreadsheets without role columns.
  - **Mitigation**: Excel parser defaults unclassified party names to role `'Director'`.
