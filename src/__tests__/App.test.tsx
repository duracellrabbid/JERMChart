import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../App';
import { useStructureStore } from '../store/useStructureStore';
import * as aiConfig from '../services/ai/aiConfig';

describe('App Integration', () => {
  beforeEach(() => {
    act(() => {
      useStructureStore.getState().resetToSample();
      aiConfig.clearAIConfig();
    });
  });

  it('renders application header, sidebar inspector, and structure canvas', () => {
    render(<App />);

    // Header elements
    expect(screen.getByText(/The Aurelius Dynasty Trust Structure/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export Chart/i })).toBeInTheDocument();

    // Sidebar Inspector tabs
    expect(screen.getByRole('button', { name: /Tree/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Details/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Directors/i })).toBeInTheDocument();

    // Canvas container
    expect(document.querySelector('#trust-structure-canvas')).toBeInTheDocument();
  });

  it('opens and closes export modal when export chart button is clicked and closed', () => {
    render(<App />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Click Export Chart button
    const exportBtn = screen.getByRole('button', { name: /Export Chart/i });
    fireEvent.click(exportBtn);

    // Modal is opened
    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
    expect(screen.getByText(/Export Structure Chart/i)).toBeInTheDocument();

    // Click Close button
    const closeBtn = screen.getByRole('button', { name: /Close/i });
    fireEvent.click(closeBtn);

    // Modal is closed
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens and closes excel import modal via Import dropdown', () => {
    render(<App />);

    expect(screen.queryByRole('heading', { name: /Import Structure from Excel/i })).not.toBeInTheDocument();

    // Click Import dropdown trigger
    const importDropdown = screen.getByRole('button', { name: /^Import$/i });
    fireEvent.click(importDropdown);

    // Click Import Excel (.xlsx) option
    const excelOption = screen.getByRole('button', { name: /Import Excel \(\.xlsx\)/i });
    fireEvent.click(excelOption);

    // Modal is opened
    expect(screen.getByRole('heading', { name: /Import Structure from Excel/i })).toBeInTheDocument();

    // Click Cancel button
    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    // Modal is closed
    expect(screen.queryByRole('heading', { name: /Import Structure from Excel/i })).not.toBeInTheDocument();
  });

  it('opens photo import modal and navigates to settings via Configure API Key', () => {
    render(<App />);

    const importDropdown = screen.getByRole('button', { name: /^Import$/i });
    fireEvent.click(importDropdown);

    const photoOption = screen.getByRole('button', { name: /Import from Photo/i });
    fireEvent.click(photoOption);

    expect(screen.getByText(/Import from Photo \/ Hand-drawn Chart/i)).toBeInTheDocument();

    const configureBtn = screen.getByRole('button', { name: /Configure API Key/i });
    fireEvent.click(configureBtn);

    // Photo import modal is closed, Settings modal is opened
    expect(screen.queryByText(/Import from Photo \/ Hand-drawn Chart/i)).not.toBeInTheDocument();
    expect(screen.getByText(/AI Provider & API Keys/i)).toBeInTheDocument();
  });

  it('opens and closes settings modal via Settings button', () => {
    render(<App />);

    const settingsBtn = screen.getByRole('button', { name: /AI Settings/i });
    fireEvent.click(settingsBtn);

    expect(screen.getByText(/AI Provider & API Keys/i)).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    expect(screen.queryByText(/AI Provider & API Keys/i)).not.toBeInTheDocument();
  });

  it('handles Ctrl+Z and Ctrl+Y keyboard shortcuts to undo and redo mutations', () => {
    render(<App />);

    const initialCount = useStructureStore.getState().entities.length;

    // Mutate state
    act(() => {
      useStructureStore.getState().addEntity({
        name: 'Shortcut Target',
        type: 'Holding Company',
        jurisdiction: 'Jersey',
        status: 'Active',
        associatedParties: [],
      });
    });

    expect(useStructureStore.getState().entities.length).toBe(initialCount + 1);

    // Press Ctrl+Z
    fireEvent.keyDown(document, { key: 'z', ctrlKey: true });
    expect(useStructureStore.getState().entities.length).toBe(initialCount);

    // Press Ctrl+Shift+Z (Redo)
    fireEvent.keyDown(document, { key: 'z', ctrlKey: true, shiftKey: true });
    expect(useStructureStore.getState().entities.length).toBe(initialCount + 1);

    // Press Ctrl+Z then Ctrl+Y (Redo)
    fireEvent.keyDown(document, { key: 'z', ctrlKey: true });
    expect(useStructureStore.getState().entities.length).toBe(initialCount);

    fireEvent.keyDown(document, { key: 'y', ctrlKey: true });
    expect(useStructureStore.getState().entities.length).toBe(initialCount + 1);

    // Press Meta+Z (Mac Cmd+Z)
    fireEvent.keyDown(document, { key: 'z', metaKey: true });
    expect(useStructureStore.getState().entities.length).toBe(initialCount);

    // Press Meta+Y (Mac Cmd+Y)
    fireEvent.keyDown(document, { key: 'y', metaKey: true });
    expect(useStructureStore.getState().entities.length).toBe(initialCount + 1);

    // Shortcuts should be ignored if typing inside an input element
    const input = document.createElement('input');
    document.body.appendChild(input);
    fireEvent.keyDown(input, { key: 'z', ctrlKey: true });
    expect(useStructureStore.getState().entities.length).toBe(initialCount + 1);
    document.body.removeChild(input);

    // Shortcuts should be ignored if typing inside a textarea
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    fireEvent.keyDown(textarea, { key: 'z', ctrlKey: true });
    expect(useStructureStore.getState().entities.length).toBe(initialCount + 1);
    document.body.removeChild(textarea);

    // Shortcuts should be ignored if typing inside contentEditable
    const editableDiv = document.createElement('div');
    Object.defineProperty(editableDiv, 'isContentEditable', { value: true, configurable: true });
    document.body.appendChild(editableDiv);
    fireEvent.keyDown(editableDiv, { key: 'z', ctrlKey: true });
    expect(useStructureStore.getState().entities.length).toBe(initialCount + 1);
    document.body.removeChild(editableDiv);

    // Shortcuts should be ignored if element has contenteditable attribute
    const attrEditableDiv = document.createElement('div');
    attrEditableDiv.setAttribute('contenteditable', 'true');
    document.body.appendChild(attrEditableDiv);
    fireEvent.keyDown(attrEditableDiv, { key: 'z', ctrlKey: true });
    expect(useStructureStore.getState().entities.length).toBe(initialCount + 1);
    document.body.removeChild(attrEditableDiv);

    // Event on non-HTMLElement target (e.g. document/window)
    fireEvent.keyDown(document, { key: 'z', ctrlKey: true });
    expect(useStructureStore.getState().entities.length).toBe(initialCount);
    fireEvent.keyDown(document, { key: 'y', ctrlKey: true });
    expect(useStructureStore.getState().entities.length).toBe(initialCount + 1);

    // Non-z, non-y keys are ignored
    fireEvent.keyDown(window, { key: 'a', ctrlKey: true });
    expect(useStructureStore.getState().entities.length).toBe(initialCount + 1);
  });
});
