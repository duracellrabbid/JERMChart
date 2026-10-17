## Purpose

Enforces security sandboxing boundaries in Electron desktop navigation, deterministic memory reclamation for photo OCR previews, and resilient fallback handling during document export.

## ADDED Requirements

### Requirement: Desktop External Navigation Protocol Validation
The Electron main process window handler SHALL restrict external URL execution strictly to standard web schemes (`http:` and `https:`).

#### Scenario: User clicks external link with standard web scheme
- **WHEN** a window open event is triggered with a URL starting with `https://` or `http://`
- **THEN** Electron SHALL open the URL in the system default web browser via `shell.openExternal` and deny standard in-app window creation.

#### Scenario: Link contains non-web scheme
- **WHEN** a window open event is triggered with a URL using `file:`, `javascript:`, `data:`, or any custom protocol scheme
- **THEN** Electron SHALL reject the request, SHALL NOT call `shell.openExternal`, and SHALL deny standard in-app window creation.

### Requirement: Photo Import Object URL Lifecycle Management
The photo import dialog SHALL revoke previously allocated blob object URLs whenever a new image is selected, and upon modal unmount.

#### Scenario: User replaces selected diagram photo
- **WHEN** a user selects a second photo after a preview URL has already been generated
- **THEN** `URL.revokeObjectURL` SHALL be invoked on the previous preview URL before generating and storing the new preview URL.

#### Scenario: User closes the photo import modal
- **WHEN** the photo import modal is unmounted while an active preview URL exists
- **THEN** `URL.revokeObjectURL` SHALL be invoked on the active preview URL.

### Requirement: PDF Export Metadata Fallback
The PDF export service SHALL provide a default fallback title when `metadata.chartTitle` is blank or undefined, preventing runtime errors during PDF generation.

#### Scenario: Exporting untitled chart to PDF
- **WHEN** `exportToPdf` is invoked with an empty or undefined `metadata.chartTitle`
- **THEN** the generated PDF header SHALL display `'Trust Structure Chart'` without throwing exceptions.
