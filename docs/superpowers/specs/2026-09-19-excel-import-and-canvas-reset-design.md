# Design Specification: Excel Import & Canvas Reset Features

**Date:** 2026-09-19  
**Status:** Approved  
**Target Platform:** 100% Client-Side Web & Desktop App (React + Vite + TypeScript)

---

## 1. Executive Summary

This feature extends the Trust Management Structure Chart application with two key capabilities requested by trust officers:
1. **Canvas Reset Controls**: Giving users the explicit choice to either reset to a clean, empty canvas (to start manually keying in a new client structure from scratch) or load/reset to the sample "Aurelius Dynasty Trust" template.
2. **Single-Sheet Excel Import & Template Generator**: Allowing trust officers to maintain or prepare their structure charts in Microsoft Excel (`.xlsx` or `.csv`), download a pre-formatted template with guidance and dropdown validations, upload the filled sheet to preview and validate the structure, and instantly render the auto-sorted interactive chart.

---

## 2. Technical Architecture & Dependencies

- **Parsing Library**: `xlsx` (SheetJS) added as a client-side dependency for in-browser workbook parsing and generation (0 bytes sent over network; completely private and offline-capable).
- **Format Support**: Standard Excel (`.xlsx`), legacy Excel (`.xls`), and Comma-Separated Values (`.csv`).
- **State Store**: Extended `useStructureStore` with a dedicated `clearCanvas()` action.

---

## 3. Excel Template & Column Specification

### 3.1 Standard Columns

The parser expects a single sheet with the following standard columns (case-insensitive and tolerant of whitespace):

| Column Header | Accepted Aliases | Required? | Type | Notes / Examples |
| :--- | :--- | :---: | :--- | :--- |
| **`Entity Name`** | `Entity`, `Company Name`, `Name`, `Trust Name` | **Yes** | String | Unique identifier name for the entity (e.g. `The Aurelius Dynasty Trust`). |
| **`Parent Entity`** | `Parent`, `Owner`, `Parent Company`, `Immediate Parent` | No | String | Name of the immediate parent owner. Leave blank for root entities / trusts. |
| **`Ownership %`** | `Ownership`, `Percentage`, `Shares %`, `Holding %` | No | Number | E.g. `100`, `75`, `50.5`. Defaults to `100%` if a parent is specified. |
| **`Entity Type`** | `Type`, `Legal Type`, `Structure Type` | No | String | `Trust`, `Holding Company`, `Operating Company`, `LLC`, `Foundation`, `Partnership`, `Individual`. Defaults to `Holding Company`. |
| **`Jurisdiction`** | `Country`, `Domicile`, `Incorporation` | No | String | E.g. `Cayman Islands`, `BVI`, `Jersey`, `Singapore`, `Delaware, USA`. |
| **`Status`** | `Entity Status`, `State` | No | String | `Active`, `Dormant`, `In Liquidation`, `Nominee`. Defaults to `Active`. |
| **`Directors`** | `Board`, `Officers`, `Trustees` | No | String | Delimited by `,`, `;`, or newline. Supports `(Corp)` and `(Res)` tags. |
| **`Registration No`**| `Reg No`, `Company No`, `Registration Number` | No | String | Registry ID (e.g. `BVI-BC-1849201`). |
| **`Tax ID`** | `TIN`, `EIN`, `Tax Number` | No | String | Regulatory tax identifier. |
| **`UBOs / Beneficiaries`** | `UBO`, `Beneficiaries`, `Settlor` | No | String | Semicolon or comma-separated names. |
| **`Share Class`** | `Class`, `Shares Class`, `Share Type` | No | String | E.g. `Ordinary Shares`, `Class A Voting`. Defaults to `"Ordinary Shares"`. |
| **`Notes`** | `Remarks`, `Comments`, `Description` | No | String | Fiduciary notes or governing law. |

### 3.2 Director String Syntax & Parsing Rules
Individual directors in the `Directors` column are split by `;`, `,`, or newlines:
- **Corporate flag**: `isCorporate = true` if the segment contains `(Corp)`, `(Corporate)`, `[Corp]`, or `[Corporate]`.
- **Resident flag**: `isResident = true` if the segment contains `(Res)`, `(Resident)`, `[Res]`, or `[Resident]`.
- Tag expressions are stripped from the director's clean display name.
- Example: `"Apex Trust Corp (Corp, Res); Julian Vance; David Tan (Res)"` generates:
  - `{ name: "Apex Trust Corp", isCorporate: true, isResident: true }`
  - `{ name: "Julian Vance", isCorporate: false, isResident: false }`
  - `{ name: "David Tan", isCorporate: false, isResident: true }`

---

## 4. UI & Workflow

### 4.1 Reset / New Canvas Dropdown (`AppHeader`)
The single "Reset" button in the top header is upgraded to a dropdown menu:
1. **Clear Canvas (Start Blank)**:
   - Sets entities and relationships to empty arrays `[]`.
   - Clears selection and highlighted director.
   - Sets chart title to `"New Trust Structure"`.
   - Prompts with a confirmation dialog if entities currently exist to prevent accidental data loss.
2. **Load Sample (Aurelius Dynasty Trust)**:
   - Re-loads the standard 5-entity demonstration template.
   - Prompts with confirmation if modified.

### 4.2 Excel Import Modal (`ExcelImportModal`)
Accessible via a new **"Import Excel"** button in the header toolbar:
1. **Download Template Action**:
   - Generates and downloads `Trust_Structure_Template.xlsx` containing:
     - Formatted header row with styling.
     - Data validation lists for `Entity Type` and `Status`.
     - 4 realistic sample rows illustrating Trust $\to$ HoldCo $\to$ OpCo with directors and ownership percentages.
2. **File Upload Dropzone**:
   - Accepts drag-and-drop or file selection of `.xlsx`, `.xls`, and `.csv`.
3. **Validation & Preview Grid**:
   - Previews parsed entity count, total director count, and detected parent-subsidiary links.
   - Displays warning badges for missing parents or unlinked references without blocking the import (unlinked entities are imported as independent root nodes).
4. **Apply to Canvas**:
   - Hydrates the store with the validated entities and relationships.
   - Automatically triggers the layout engine with active sibling sorting criteria.
   - Closes modal with success confirmation.

---

## 5. Verification & Testing Plan

- **`excelParser.test.ts`**:
  - Validates column header normalization with case/alias variations.
  - Validates director string tokenization, tag extraction (`(Corp)`, `(Res)`), and name cleanup.
  - Validates relationship graph construction from `Parent Entity` and `Ownership %` rows.
  - Validates multi-parent row merging.
- **`ExcelImportModal.test.tsx`**:
  - Tests template file generation.
  - Tests file upload parsing and error preview display.
  - Tests applying parsed data to the Zustand store.
- **`AppHeader.test.tsx`**:
  - Tests dropdown toggle for "Clear Canvas" and "Load Sample".
  - Tests canvas wipe confirmation and store clearing.
- **End-to-End Build & Test**:
  - Run full test suite (`npm test`) and production build (`npm run build`).
