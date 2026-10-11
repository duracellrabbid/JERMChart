import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmationModal } from '../../../components/common/ConfirmationModal';

describe('ConfirmationModal', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <ConfirmationModal
        isOpen={false}
        title="Test Title"
        message="Test Message"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders title, message, and buttons with default labels when open', () => {
    render(
      <ConfirmationModal
        isOpen={true}
        title="Confirm Deletion"
        message="This action is irreversible."
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();
    expect(screen.getByText('This action is irreversible.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    const onConfirmMock = vi.fn();
    render(
      <ConfirmationModal
        isOpen={true}
        title="Confirm"
        message="Message"
        confirmLabel="Yes, Delete"
        onConfirm={onConfirmMock}
        onCancel={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Yes, Delete' }));
    expect(onConfirmMock).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel or close button is clicked', () => {
    const onCancelMock = vi.fn();
    render(
      <ConfirmationModal
        isOpen={true}
        title="Confirm"
        message="Message"
        cancelLabel="Dismiss"
        onConfirm={vi.fn()}
        onCancel={onCancelMock}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onCancelMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByLabelText('Close dialog'));
    expect(onCancelMock).toHaveBeenCalledTimes(2);
  });

  it('calls onCancel when Escape key is pressed', () => {
    const onCancelMock = vi.fn();
    render(
      <ConfirmationModal
        isOpen={true}
        title="Confirm"
        message="Message"
        onConfirm={vi.fn()}
        onCancel={onCancelMock}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancelMock).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: 'Enter' });
    expect(onCancelMock).toHaveBeenCalledTimes(1);
  });

  it('supports warning and info variants', () => {
    const { rerender } = render(
      <ConfirmationModal
        isOpen={true}
        title="Warning"
        message="Warning Message"
        variant="warning"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByText('Warning')).toBeInTheDocument();

    rerender(
      <ConfirmationModal
        isOpen={true}
        title="Info"
        message="Info Message"
        variant="info"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByText('Info')).toBeInTheDocument();
  });
});
