# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

---

## Security Architecture & Privacy Guarantee

**JERMChart** is engineered with a strict **zero-telemetry, 100% client-side** security model:

- **Zero Cloud Data Storage**: All corporate entity structures, director details, and client matters remain entirely within the user's browser runtime or local desktop application memory.
- **No Ingestion Endpoints**: No data is transmitted to remote servers, databases, or third-party cloud analytics services.
- **Isolated Desktop Sandbox**: The Electron desktop configuration enforces `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, and strictly blocks unauthorized window opening (`setWindowOpenHandler` with deny action).

---

## Reporting a Vulnerability

If you discover a potential security vulnerability within this repository, please report it responsibly:

1. **Do not create a public GitHub issue.**
2. Send an email describing the issue, impact, and reproduction steps to the project maintainers.
3. Maintainers will acknowledge receipt within 48 hours and provide updates until a resolution is deployed.

Thank you for helping keep JERMChart secure for fiduciary professionals worldwide.
