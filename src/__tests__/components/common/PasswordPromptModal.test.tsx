import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PasswordPromptModal } from '../../../components/common/PasswordPromptModal';

describe('PasswordPromptModal', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <PasswordPromptModal
        isOpen={false}
        mode="export"
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders in export mode with password and confirmation inputs', () => {
    const handleSubmit = vi.fn();
    const handleClose = vi.fn();

    render(
      <PasswordPromptModal
        isOpen={true}
        mode="export"
        onSubmit={handleSubmit}
        onClose={handleClose}
      />
    );

    expect(screen.getByText('Encrypt Chart Backup')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Confirm Password/i)).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /encrypt & download/i });
    expect(submitBtn).toBeDisabled();

    const passwordInput = screen.getByLabelText(/^Password/i);
    const confirmInput = screen.getByLabelText(/^Confirm Password/i);

    fireEvent.change(passwordInput, { target: { value: 'Secret123' } });
    fireEvent.change(confirmInput, { target: { value: 'Mismatch123' } });

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    expect(submitBtn).toBeDisabled();

    fireEvent.change(confirmInput, { target: { value: 'Secret123' } });
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);
    expect(handleSubmit).toHaveBeenCalledWith('Secret123');
  });

  it('renders in import mode with single password input and error message', () => {
    const handleSubmit = vi.fn();
    const handleClose = vi.fn();

    render(
      <PasswordPromptModal
        isOpen={true}
        mode="import"
        errorMessage="Incorrect password or corrupted file"
        onSubmit={handleSubmit}
        onClose={handleClose}
      />
    );

    expect(screen.getByText('Decrypt Chart Backup')).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Confirm Password/i)).toBeNull();
    expect(screen.getByText('Incorrect password or corrupted file')).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /decrypt & load/i });
    expect(submitBtn).toBeDisabled();

    const passwordInput = screen.getByLabelText(/^Password/i);
    fireEvent.change(passwordInput, { target: { value: 'Secret123' } });
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);
    expect(handleSubmit).toHaveBeenCalledWith('Secret123');
  });

  it('toggles password visibility when eye button is clicked', () => {
    render(
      <PasswordPromptModal
        isOpen={true}
        mode="import"
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const passwordInput = screen.getByLabelText(/^Password/i) as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    const toggleBtn = screen.getByLabelText(/toggle password visibility/i);
    fireEvent.click(toggleBtn);
    expect(passwordInput.type).toBe('text');

    fireEvent.click(toggleBtn);
    expect(passwordInput.type).toBe('password');
  });

  it('toggles password and confirm password visibility in export mode', () => {
    render(
      <PasswordPromptModal
        isOpen={true}
        mode="export"
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const passwordInput = screen.getByLabelText(/^Password/i) as HTMLInputElement;
    const confirmInput = screen.getByLabelText(/^Confirm Password/i) as HTMLInputElement;
    expect(passwordInput.type).toBe('password');
    expect(confirmInput.type).toBe('password');

    const toggleBtn = screen.getByLabelText(/toggle password visibility/i);
    fireEvent.click(toggleBtn);
    expect(passwordInput.type).toBe('text');
    expect(confirmInput.type).toBe('text');
  });

  it('does not submit when form is submitted directly while invalid', () => {
    const handleSubmit = vi.fn();
    const { container } = render(
      <PasswordPromptModal
        isOpen={true}
        mode="export"
        onSubmit={handleSubmit}
        onClose={vi.fn()}
      />
    );

    const form = container.querySelector('form')!;
    fireEvent.submit(form);
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('calls onClose when cancel or close button is clicked', () => {
    const handleClose = vi.fn();

    render(
      <PasswordPromptModal
        isOpen={true}
        mode="export"
        onSubmit={vi.fn()}
        onClose={handleClose}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /^cancel$/i });
    fireEvent.click(cancelBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    const closeBtn = screen.getByLabelText(/^close$/i);
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  it('calls onClose when Escape key is pressed', () => {
    const handleClose = vi.fn();

    render(
      <PasswordPromptModal
        isOpen={true}
        mode="export"
        onSubmit={vi.fn()}
        onClose={handleClose}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders loading state correctly and disables inputs and buttons', () => {
    const handleSubmit = vi.fn();
    const handleClose = vi.fn();

    render(
      <PasswordPromptModal
        isOpen={true}
        mode="import"
        isLoading={true}
        onSubmit={handleSubmit}
        onClose={handleClose}
      />
    );

    expect(screen.getByRole('button', { name: /processing\.\.\./i })).toBeDisabled();
    expect(screen.getByLabelText(/^Password/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /^cancel$/i })).toBeDisabled();
    expect(screen.getByLabelText(/^close$/i)).toBeDisabled();

    // Escape key should not trigger onClose while loading
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('sets correct autoComplete attributes for export and import modes', () => {
    const { unmount } = render(
      <PasswordPromptModal
        isOpen={true}
        mode="export"
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const exportPasswordInput = screen.getByLabelText(/^Password/i);
    const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/i);
    expect(exportPasswordInput).toHaveAttribute('autocomplete', 'new-password');
    expect(confirmPasswordInput).toHaveAttribute('autocomplete', 'new-password');

    unmount();

    render(
      <PasswordPromptModal
        isOpen={true}
        mode="import"
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const importPasswordInput = screen.getByLabelText(/^Password/i);
    expect(importPasswordInput).toHaveAttribute('autocomplete', 'current-password');
  });
});
