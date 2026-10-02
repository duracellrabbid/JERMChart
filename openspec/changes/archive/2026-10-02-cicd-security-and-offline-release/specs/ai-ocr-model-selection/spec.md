# ai-ocr-model-selection Spec Delta

## REMOVED Requirements

### Requirement: Official OpenAI Client SDK Integration
The system MUST execute OpenAI vision OCR requests and connection verification pings using the official `openai` SDK (`OpenAI` client instance) with `dangerouslyAllowBrowser: true` and optional custom `baseURL`.

**Reason**: Deprecate OpenAI integration and custom network endpoints to minimize egress attack surface, simplifying network defense down to a single Google Gemini domain.

## MODIFIED Requirements

### Requirement: Curated Vision Model Catalog
The system MUST provide a centralized catalog of verified vision-capable models exclusively for the `gemini` AI provider, mapping exact API identifiers to human-readable labels, descriptions, and recommended default flags.

#### Scenario: Listing Gemini models
- **WHEN** the user opens AI model selection in Settings
- **THEN** the system offers `gemini-3.8-flash` (Recommended - Fastest & Latest), `gemini-3.7-flash`, `gemini-3.5-flash`, and `gemini-3.1-pro-preview` in the model catalog.

#### Scenario: Listing OpenAI models
- **WHEN** the user inspects available AI providers
- **THEN** OpenAI models are deprecated and omitted from active selection to maintain zero-egress perimeter control.

### Requirement: User-Friendly Model Dropdown in Settings
The Settings modal MUST display a curated model `<select>` dropdown populated exclusively with Gemini vision models and an optional Custom Model identifier, with provider switching disabled.

#### Scenario: Switching provider updates model dropdown
- **WHEN** the user opens AI settings
- **THEN** provider selection is locked to Google Gemini and the model dropdown displays active Gemini vision options.

#### Scenario: Switching provider back to Gemini
- **WHEN** the user views the model options
- **THEN** the dropdown defaults to `gemini-3.8-flash` without requiring provider toggling.

## ADDED Requirements

### Requirement: Fiduciary Data Privacy and Enterprise Tier Compliance Notice
The Settings modal and AI Vision OCR modal MUST display a persistent fiduciary compliance and privacy disclaimer notifying users of Google AI Studio terms and establishing customer responsibility for utilizing enterprise/paid keys.

#### Scenario: Displaying privacy notice in Settings
- **WHEN** the user views the AI Configuration section in Settings
- **THEN** a visible warning notice advises that while JERMChart is 100% offline, Vision OCR transmits chart images to Google Gemini, and users must ensure their API key belongs to a paid/enterprise Google Cloud project with training logging disabled.
