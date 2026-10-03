## MODIFIED Requirements

### Requirement: Windows Build Matrix and Packaging
The system MUST provide a GitHub Actions workflow (`.github/workflows/release.yml`) running on `windows-latest` that compiles and packages the desktop application into Windows x64 NSIS installer and portable executables via `electron-builder` v27 while maintaining zero moderate or higher security vulnerabilities.

#### Scenario: Workflow builds Windows desktop executables
- **WHEN** the release workflow runs on `windows-latest`
- **THEN** it executes `npm run verify:pre-commit`, `npm run verify:pre-push`, and `npm run electron:build`, generating `.exe` distribution artifacts in the `release/` directory.

#### Scenario: Security audit zero-vulnerability verification
- **WHEN** `npm run verify:pre-push` is executed during CI validation or pre-release verification
- **THEN** `npm run audit:security` passes with zero moderate, high, or critical vulnerabilities.
