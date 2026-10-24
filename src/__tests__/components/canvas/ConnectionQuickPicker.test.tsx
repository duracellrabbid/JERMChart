import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConnectionQuickPicker } from '../../../components/canvas/ConnectionQuickPicker';

describe('ConnectionQuickPicker Component', () => {
  const defaultEntityConnection = {
    sourceId: 'entity-1',
    sourceName: 'Aurelius Dynasty Trust',
    targetId: 'entity-2',
    targetName: 'Aurelius Global Holdings Ltd',
    connectionKind: 'entity-to-entity' as const,
  };

  const defaultPersonConnection = {
    sourceId: 'staged-person-1',
    sourceName: 'Alexander Wright',
    targetId: 'entity-1',
    targetName: 'Aurelius Dynasty Trust',
    connectionKind: 'person-to-entity' as const,
  };

  it('renders entity-to-entity ownership configuration form', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConnectionQuickPicker
        connection={defaultEntityConnection}
        position={{ x: 100, y: 150 }}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText('Connect Ownership')).toBeInTheDocument();
    expect(screen.getByText('Aurelius Dynasty Trust')).toBeInTheDocument();
    expect(screen.getByText('Aurelius Global Holdings Ltd')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '100%' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '50%' })).toBeInTheDocument();
    expect(screen.getByLabelText(/share class/i)).toBeInTheDocument();
  });

  it('submits selected ownership percentage and share class', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConnectionQuickPicker
        connection={defaultEntityConnection}
        position={{ x: 100, y: 150 }}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    // Click 50% preset button
    fireEvent.click(screen.getByRole('button', { name: '50%' }));
    // Click 100% preset button
    fireEvent.click(screen.getByRole('button', { name: '100%' }));
    // Change share class
    fireEvent.change(screen.getByLabelText(/share class/i), { target: { value: 'Preference Shares' } });
    // Check cross-link
    fireEvent.click(screen.getByLabelText(/cross-link/i));
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: /establish link/i }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith({
      connectionKind: 'entity-to-entity',
      ownershipPercentage: 100,
      shareClass: 'Preference Shares',
      isCrossLink: true,
    });
  });

  it('allows custom ownership percentage input', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConnectionQuickPicker
        connection={defaultEntityConnection}
        position={{ x: 100, y: 150 }}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    const input = screen.getByLabelText(/custom %/i);
    fireEvent.change(input, { target: { value: '75' } });

    fireEvent.click(screen.getByRole('button', { name: /establish link/i }));

    expect(onConfirm).toHaveBeenCalledWith({
      connectionKind: 'entity-to-entity',
      ownershipPercentage: 75,
      shareClass: 'Ordinary Shares',
      isCrossLink: false,
    });
  });

  it('renders person-to-entity role configuration form', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConnectionQuickPicker
        connection={defaultPersonConnection}
        position={{ x: 100, y: 150 }}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText('Assign Fiduciary Role')).toBeInTheDocument();
    expect(screen.getByText('Alexander Wright')).toBeInTheDocument();
    expect(screen.getByText('Aurelius Dynasty Trust')).toBeInTheDocument();
    expect(screen.getByLabelText(/appointed role/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/resident fiduciary/i)).toBeInTheDocument();
  });

  it('submits role assignment on confirmation', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConnectionQuickPicker
        connection={defaultPersonConnection}
        position={{ x: 100, y: 150 }}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    // Select Protector
    fireEvent.change(screen.getByLabelText(/appointed role/i), { target: { value: 'Protector' } });
    // Check resident
    fireEvent.click(screen.getByLabelText(/resident fiduciary/i));
    // Check corporate
    fireEvent.click(screen.getByLabelText(/corporate nominee/i));

    fireEvent.click(screen.getByRole('button', { name: /assign role/i }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith({
      connectionKind: 'person-to-entity',
      role: 'Protector',
      isResident: true,
      isCorporate: true,
    });
  });

  it('triggers onCancel when cancel button is clicked', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConnectionQuickPicker
        connection={defaultEntityConnection}
        position={{ x: 100, y: 150 }}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when Escape key is pressed', () => {
    const onCancel = vi.fn();
    render(
      <ConnectionQuickPicker
        connection={defaultEntityConnection}
        position={{ x: 300, y: 300 }}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('does not call onCancel when other keys are pressed', () => {
    const onCancel = vi.fn();
    render(
      <ConnectionQuickPicker
        connection={defaultEntityConnection}
        position={{ x: 300, y: 300 }}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('cleans up Escape key listener on unmount', () => {
    const onCancel = vi.fn();
    const { unmount } = render(
      <ConnectionQuickPicker
        connection={defaultEntityConnection}
        position={{ x: 300, y: 300 }}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    unmount();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('clamps modal position within viewport boundaries when overflowing bottom-right', () => {
    render(
      <ConnectionQuickPicker
        connection={defaultEntityConnection}
        position={{ x: 2000, y: 2000 }}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const dialog = screen.getByRole('dialog');
    const expectedLeft = `${Math.max(16, window.innerWidth - 320)}px`;
    const expectedTop = `${Math.max(16, window.innerHeight - 340)}px`;
    expect(dialog.style.left).toBe(expectedLeft);
    expect(dialog.style.top).toBe(expectedTop);
  });

  it('clamps modal position to minimum margin when near top-left boundary', () => {
    render(
      <ConnectionQuickPicker
        connection={defaultEntityConnection}
        position={{ x: 10, y: 10 }}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog.style.left).toBe('16px');
    expect(dialog.style.top).toBe('16px');
  });
});
