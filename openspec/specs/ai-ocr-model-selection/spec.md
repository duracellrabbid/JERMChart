# ai-ocr-model-selection Specification

## Purpose
Provide a user-friendly, curated model selection interface for AI-driven structure chart OCR, supporting the latest active vision models across Google Gemini and OpenAI, backed by the official OpenAI client SDK.
## Requirements
### Requirement: Curated Vision Model Catalog
The system MUST provide a centralized catalog of verified vision-capable models for each supported AI provider (`gemini` and `openai`), mapping exact API identifiers to human-readable labels, descriptions, and recommended default flags.

#### Scenario: Listing Gemini models
- **WHEN** the user selects Google Gemini as the AI provider
- **THEN** the system offers `gemini-3.8-flash` (Recommended - Fastest & Latest), `gemini-3.7-flash`, `gemini-3.5-flash`, and `gemini-3.1-pro-preview` in the model catalog.

#### Scenario: Listing OpenAI models
- **WHEN** the user selects OpenAI as the AI provider
- **THEN** the system offers `gpt-5.2` (Recommended - High Accuracy), `gpt-5.2-pro` (Deep Reasoning), `gpt-5.4` (Advanced Thinking), and `gpt-5.6` (Latest Frontier) in the model catalog.

### Requirement: User-Friendly Model Dropdown in Settings
The Settings modal MUST replace the freeform model text box with a `<select>` dropdown displaying human-friendly names. It MUST dynamically update when the provider changes and persist the selected model identifier.

#### Scenario: Switching provider updates model dropdown
- **WHEN** the user switches the provider from Google Gemini to OpenAI
- **THEN** the model dropdown options immediately refresh to the OpenAI model list, defaulting to `gpt-5.2`.

#### Scenario: Switching provider back to Gemini
- **WHEN** the user switches the provider from OpenAI to Google Gemini
- **THEN** the model dropdown options refresh to the Gemini model list, defaulting to `gemini-3.8-flash`.

### Requirement: Custom Model Identifier Input
The system MUST support a "Custom Model..." option in the dropdown to allow advanced users to specify unlisted or internal enterprise deployment model identifiers.

#### Scenario: Selecting Custom Model
- **WHEN** the user selects the "Custom Model..." option in the model dropdown
- **THEN** an additional text input appears permitting the user to enter a custom model string.

#### Scenario: Saving a Custom Model
- **WHEN** the user saves settings with a custom model string entered
- **THEN** the custom model string is saved to the client configuration and used for vision OCR requests.

### Requirement: Official OpenAI Client SDK Integration
The system MUST execute OpenAI vision OCR requests and connection verification pings using the official `openai` SDK (`OpenAI` client instance) with `dangerouslyAllowBrowser: true` and optional custom `baseURL`.

#### Scenario: Performing OCR via OpenAI SDK
- **WHEN** a chart photo is analyzed using an OpenAI configuration
- **THEN** the service calls `openai.chat.completions.create` with the selected model, system instruction, base64 image data URL, and `{ type: 'json_object' }` response format.

#### Scenario: Testing OpenAI connection via SDK
- **WHEN** the user clicks "Test Connection" in Settings with OpenAI selected
- **THEN** the system executes a lightweight completion check using the `openai` SDK and displays a friendly success message or parsed API error message.

