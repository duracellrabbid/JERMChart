# Contributing to JERMChart

Thank you for your interest in contributing to JERMChart! This project is open source under the [MIT License](LICENSE).

We welcome bug reports, feature requests, documentation improvements, and code contributions.

---

## 1. Code of Conduct

All contributors and participants are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Please treat all collaborators with respect and professionalism.

---

## 2. Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18+ or 20+ recommended)
- `npm` (packaged with Node.js)

### Initial Setup
```bash
git clone https://github.com/duracellrabbid/JERMChart.git
cd JERMChart
npm install
```

### Running the Web Application
```bash
npm run dev
```
Navigate to `http://localhost:5173` to test live changes.

### Running the Desktop (Electron) Application
```bash
npm run electron:dev
```

---

## 3. Engineering & Architectural Standards

All contributions must follow our repository mandates:

1. **100% Test Coverage**:
   - The project strictly enforces **100% test coverage** across Statements, Branches, Functions, and Lines.
   - Run the coverage suite before submitting:
     ```bash
     npm run test:coverage
     ```
2. **Dedicated Test Isolation**:
   - All tests must reside strictly within `src/**/__tests__/` directories.
   - Production packaging (`tsconfig.json`, `vite.config.ts`, `electron-builder.json`) excludes `__tests__` directories to prevent test leaks into release binaries.
3. **Cognitive Complexity (< 15)**:
   - Keep cognitive complexity scores below 15 for all functions and React components.
   - Extract nested conditionals, decompose heavy state handlers, and use pure helper functions.
4. **Linear & ReDoS-Free Regular Expressions**:
   - All regular expressions must run in guaranteed linear $\mathcal{O}(n)$ time.
   - Prefer native `String` methods (`includes()`, `startsWith()`, `slice()`) over regex whenever practical.
5. **Data Privacy First**:
   - The application is strictly 100% client-side. Do not introduce network calls or telemetry that send client structure or entity data to external servers.

---

## 4. Submitting a Pull Request

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your modifications, adhering to the coding standards and adding unit/component tests in `src/**/__tests__/`.
3. Verify test suite and production build pass cleanly:
   ```bash
   npm run test:coverage
   npm run build
   ```
4. Commit your changes with clear, descriptive commit messages.
5. Push to your fork and submit a Pull Request against the `main` branch.

---

## 5. Licensing of Contributions

By contributing to this project, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
