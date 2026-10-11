import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AlertModal } from '../../../components/common/AlertModal';

describe('AlertModal', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <AlertModal
        isOpen={false}
        title="Alert Title"
        message="Alert Message"
        onClose={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders title, message, and dismiss button when open', () => {
    render(
      <AlertModal
        isOpen={true}
        title="Operation Error"
        message="Something went wrong during export."
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Operation Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong during export.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
  });

  it('calls onClose when dismiss button or close icon is clicked', () => {
    const onCloseMock = vi.fn();
    render(
      <AlertModal
        isOpen={true}
        title="Error"
        message="Message"
        buttonLabel="Acknowledge"
        onClose={onCloseMock}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Acknowledge' }));
    expect(onCloseMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByLabelText('Close alert'));
    expect(onCloseMock).toHaveBeenCalledTimes(2);
  });

  it('calls onClose when Escape or Enter key is pressed', () => {
    const onCloseMock = vi.fn();
    render(
      <AlertModal
        isOpen={true}
        title="Notice"
        message="Notice message"
        onClose={onCloseMock}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCloseMock).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: 'Enter' });
    expect(onCloseMock).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(document, { key: 'Space' });
    expect(onCloseMock).toHaveBeenCalledTimes(2);
  });
});
