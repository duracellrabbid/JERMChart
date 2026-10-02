## Purpose
Automated continuous delivery workflow on GitHub Actions to package, verify, and publish draft Windows desktop releases (`nsis` and `portable`) with cryptographic checksums.

## ADDED Requirements

### Requirement: Windows Build Matrix and Packaging
The system MUST provide a GitHub Actions workflow (`.github/workflows/release.yml`) running on `windows-latest` that compiles and packages the desktop application into Windows x64 NSIS installer and portable executables via `electron-builder`.

#### Scenario: Workflow builds Windows desktop executables
- **WHEN** the release workflow runs on `windows-latest`
- **THEN** it executes `npm run verify:pre-commit`, `npm run verify:pre-push`, and `npm run electron:build`, generating `.exe` distribution artifacts in the `release/` directory.

### Requirement: Cryptographic Checksum Generation
The release workflow MUST compute SHA-256 hashes for all generated release executables and store them in a standardized `SHA256SUMS.txt` manifest.

#### Scenario: Checksum generation on build completion
- **WHEN** Windows executables are built
- **THEN** the workflow computes SHA-256 hashes for each `.exe` file and outputs them in `release/SHA256SUMS.txt`.

### Requirement: GitHub Draft Release Creation
The release workflow MUST automatically create a GitHub Release marked explicitly as a Draft (`draft: true`), attaching the Windows executables and checksum manifest.

#### Scenario: Tag push triggers draft release
- **WHEN** a semantic version tag (e.g., `v1.0.0`) is pushed to GitHub
- **THEN** the workflow creates a draft release containing the Windows installer, portable binary, and SHA-256 manifest without publishing to end users.

#### Scenario: Manual dispatch triggers draft release
- **WHEN** a maintainer triggers the workflow via `workflow_dispatch`
- **THEN** the workflow generates and attaches the draft release artifacts.
