import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OwnershipEdge } from '../../../components/edges/OwnershipEdge';
import { Position } from '@xyflow/react';

vi.mock('@xyflow/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@xyflow/react')>();
  return {
    ...actual,
    EdgeLabelRenderer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="edge-label-renderer">{children}</div>
    ),
  };
});

describe('OwnershipEdge', () => {
  const baseEdgeProps = {
    id: 'e1-2',
    source: '1',
    target: '2',
    sourceX: 100,
    sourceY: 100,
    targetX: 100,
    targetY: 300,
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
  };

  it('renders ownership percentage and share class', () => {
    const { container } = render(
      <svg>
        <OwnershipEdge
          {...(baseEdgeProps as any)}
          data={{ ownershipPercentage: 100, shareClass: 'Ordinary Shares' }}
        />
      </svg>
    );

    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('Ordinary Shares')).toBeInTheDocument();

    const path = container.querySelector('path.react-flow__edge-path');
    expect(path).toBeInTheDocument();
    expect(path?.getAttribute('style')).toMatch(/stroke:\s*(#475569|rgb\(71,\s*85,\s*105\))/);
  });

  it('renders fallback "Owns" when ownership percentage is undefined and no share class', () => {
    render(
      <svg>
        <OwnershipEdge
          {...(baseEdgeProps as any)}
          data={{}}
        />
      </svg>
    );

    expect(screen.getByText('Owns')).toBeInTheDocument();
    expect(screen.queryByText('Ordinary Shares')).not.toBeInTheDocument();
  });
});
