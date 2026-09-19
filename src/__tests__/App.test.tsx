import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../App';
import { useStructureStore } from '../store/useStructureStore';

describe('App Integration', () => {
  beforeEach(() => {
    act(() => {
      useStructureStore.getState().resetToSample();
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

  it('opens and closes excel import modal when import excel button is clicked and closed', () => {
    render(<App />);

    expect(screen.queryByRole('heading', { name: /Import Structure from Excel/i })).not.toBeInTheDocument();

    // Click Import Excel button
    const importBtn = screen.getByRole('button', { name: /Import Excel/i });
    fireEvent.click(importBtn);

    // Modal is opened
    expect(screen.getByRole('heading', { name: /Import Structure from Excel/i })).toBeInTheDocument();

    // Click Cancel button
    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    // Modal is closed
    expect(screen.queryByRole('heading', { name: /Import Structure from Excel/i })).not.toBeInTheDocument();
  });
});

