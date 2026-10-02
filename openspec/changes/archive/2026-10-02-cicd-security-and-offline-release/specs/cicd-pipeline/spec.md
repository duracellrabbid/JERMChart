## Purpose
Automated continuous integration pipeline running on GitHub Actions to enforce repository quality, complexity, coverage, and security gates on every push and pull request without reliance on local git hooks.

## ADDED Requirements

### Requirement: GitHub Actions Unified CI Workflow
The system MUST provide a single unified GitHub Actions workflow file (`.github/workflows/ci.yml`) that executes on every push and pull request targeting the `main` or `master` branches, running in an Ubuntu Linux environment on Node.js 22.

#### Scenario: Workflow triggers on push to main
- **WHEN** commits are pushed to `main` or `master`
- **THEN** the CI workflow automatically checks out the repository, sets up Node.js 22 with npm dependency caching, runs a clean install via `npm ci`, and executes the verification pipeline.

#### Scenario: Workflow triggers on pull request
- **WHEN** a pull request is opened or updated targeting `main` or `master`
- **THEN** the CI workflow runs all quality and security gates against the pull request branch.

### Requirement: Enforce Pre-Commit Quality Gate in CI
The CI workflow MUST execute `npm run verify:pre-commit` to strictly validate code style, cognitive complexity, ReDoS safety, and 100% test coverage before allowing merges.

#### Scenario: Cognitive complexity or regex lint failure blocks CI
- **WHEN** any source function exceeds cognitive complexity 15 or introduces non-linear regex backtracking
- **THEN** `eslint src` fails and the CI job terminates with a non-zero exit status, failing the status check.

#### Scenario: Test coverage below 100% blocks CI
- **WHEN** any test fails or statement, branch, function, or line coverage falls below 100%
- **THEN** `vitest run --coverage` fails and the CI job terminates with a non-zero exit status.

### Requirement: Enforce Pre-Push Verification Gate in CI
The CI workflow MUST execute `npm run verify:pre-push` to guarantee clean production compilation and vulnerability compliance.

#### Scenario: Production build failure blocks CI
- **WHEN** TypeScript type errors exist or Vite bundling fails
- **THEN** `npm run build` fails and the CI job terminates with a non-zero exit status.

#### Scenario: Moderate or high security vulnerability blocks CI
- **WHEN** `npm audit --audit-level=moderate` detects dependencies with moderate or higher CVE vulnerabilities
- **THEN** the security audit step fails and the CI job terminates with a non-zero exit status.
