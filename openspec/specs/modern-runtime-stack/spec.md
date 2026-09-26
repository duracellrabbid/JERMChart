# modern-runtime-stack Specification

## Purpose
Defines verifiable requirements and operational contracts for executing JERMChart upon modern major runtime dependencies—including React 19, Dagre 3, Lucide React 1.x, Vite 8, and Tailwind CSS 4—while guaranteeing strict layout determinism, zero visual regressions, zero security vulnerabilities, and complete offline fiduciary privacy.
## Requirements
### Requirement: React 19 Component & Hook Lifecycle Execution
The fiduciary application SHALL mount and execute all UI components, dialogs, canvas nodes, and inspector panels on React 19 and React DOM 19 without hydration issues, deprecated lifecycle errors, or testing harness failures.

#### Scenario: Application mount and interaction
- **WHEN** the user launches JERMChart in the desktop runtime or web browser
- **THEN** `ReactDOM.createRoot` renders the root `<App />` container without console warnings or runtime exceptions
- **AND** all Zustand store subscriptions, undo/redo state transitions, and modal dialogs respond reactively.

#### Scenario: Testing harness execution
- **WHEN** the test suite is executed using `@testing-library/react` v16 and `jsdom` v30
- **THEN** all component integration tests and user event simulations execute cleanly with zero `act(...)` or DOM environment warnings.

### Requirement: Dagre 3 Hierarchical Graph Computations
The layout engine SHALL utilize `@dagrejs/dagre` v3.1.1 to calculate hierarchical positions for all corporate and fiduciary entities while strictly maintaining identical graph coordinates and sibling sorting behaviors.

#### Scenario: Sibling sorting and layout calculation
- **WHEN** `calculateSortedLayout` is invoked with entity nodes and ownership relationships under alphabetical, ownership percentage, or jurisdiction criteria
- **THEN** `@dagrejs/dagre` successfully initializes `dagre.graphlib.Graph`, assigns node dimensions, and executes `dagre.layout`
- **AND** computed node coordinates (x, y) accurately reflect hierarchical levels and sibling ordering with zero layout NaN or overlap regressions.

#### Scenario: Multi-parent cycles and edge cases
- **WHEN** entities contain multi-parent ownership structures, circular references, or orphan nodes
- **THEN** the layout engine resolves positions deterministically without infinite loops, stack overflow, or silent graph corruption.

### Requirement: Tailwind CSS 4 Styling & Theme Integrity
The application styling pipeline SHALL compile using Tailwind CSS v4 and `@tailwindcss/vite`, preserving all custom corporate fiduciary color tokens and layout utilities.

#### Scenario: Fiduciary color palette availability
- **WHEN** UI components apply class names containing `trust-` tokens (`trust-50`, `trust-100`, `trust-500`, `trust-600`, `trust-700`, `trust-gold`, `trust-navy`, `trust-teal`)
- **THEN** Tailwind CSS v4 resolves the underlying CSS theme variables defined in `@theme` and renders the precise hex color values on entity cards, badges, and headers.

#### Scenario: Build pipeline simplification
- **WHEN** the production bundle is compiled via `vite build`
- **THEN** styles are processed through `@tailwindcss/vite` without invoking external `postcss.config.js` or `autoprefixer`.

### Requirement: Toolchain Quality Gates & Runtime Compatibility
The development toolchain SHALL validate code quality, type safety, test coverage, and security posture across modern dependencies.

#### Scenario: Pre-commit quality verification
- **WHEN** `npm run verify:pre-commit` is executed
- **THEN** ESLint validates zero lint errors with cognitive complexity strictly below 15 (Rule 4) and linear ReDoS-free regex (Rule 5)
- **AND** Vitest 5 executes the complete test suite enforcing 100% code coverage across statements, branches, functions, and lines.

#### Scenario: Security audit and Electron desktop runtime isolation
- **WHEN** `npm run verify:pre-push` is executed
- **THEN** `npm run audit:security` reports zero moderate, high, or critical vulnerabilities
- **AND** TypeScript compilation passes cleanly using TypeScript 5.9 and `@types/node` 22 definitions matching Electron 44's Node 22 environment.

