import { describe, it, expect, beforeEach, vi } from 'vitest';
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

  it('opens and closes photo import modal via Import dropdown', () => {
    render(<App />);

    const importDropdown = screen.getByRole('button', { name: /^Import$/i });
    fireEvent.click(importDropdown);

    const photoOption = screen.getByRole('button', { name: /Import from Photo/i });
    fireEvent.click(photoOption);

    expect(screen.getByText(/Import from Photo \/ Hand-drawn Chart/i)).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: /Cancel|Close/i });
    fireEvent.click(cancelBtn);

    expect(screen.queryByText(/Import from Photo \/ Hand-drawn Chart/i)).not.toBeInTheDocument();
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
});
