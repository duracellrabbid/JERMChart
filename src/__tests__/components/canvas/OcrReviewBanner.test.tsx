import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OcrReviewBanner } from '../../../components/canvas/OcrReviewBanner';
import { useStructureStore } from '../../../store/useStructureStore';

describe('OcrReviewBanner', () => {
  beforeEach(() => {
    useStructureStore.setState({ ocrReviewState: null, undoSnapshot: null });
  });

  it('renders nothing when ocrReviewState is null', () => {
    const { container } = render(<OcrReviewBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders summary and allows toggling warnings popover', () => {
    useStructureStore.setState({
      ocrReviewState: {
        summary: 'Inferred 5 entities from photo',
        warnings: ['Low confidence on ownership % of SubCo', 'Jurisdiction illegible on root trust'],
      },
      undoSnapshot: null,
    });

    render(<OcrReviewBanner />);
    expect(screen.getByText(/inferred 5 entities from photo/i)).toBeInTheDocument();

    const warningsBadge = screen.getByRole('button', { name: /2 warnings/i });
    expect(warningsBadge).toBeInTheDocument();

    // Toggle popover open
    fireEvent.click(warningsBadge);
    expect(screen.getByText(/low confidence on ownership %/i)).toBeInTheDocument();
    expect(screen.getByText(/jurisdiction illegible/i)).toBeInTheDocument();

    // Toggle closed
    fireEvent.click(warningsBadge);
    expect(screen.queryByText(/low confidence on ownership %/i)).not.toBeInTheDocument();
  });

  it('triggers restoreUndoSnapshot when Undo Import clicked', () => {
    useStructureStore.setState({
      ocrReviewState: {
        summary: 'Inferred 3 entities',
        warnings: [],
      },
      undoSnapshot: {
        metadata: { chartTitle: 'Old Title', effectiveDate: '', confidentialityNotice: '' },
        entities: [
          {
            id: 'old-1',
            name: 'Original Entity',
            type: 'Trust',
            jurisdiction: 'Jersey',
            status: 'Active',
            directors: [],
          },
        ],
        relationships: [],
      },
    });

    render(<OcrReviewBanner />);
    const undoBtn = screen.getByRole('button', { name: /undo import/i });
    fireEvent.click(undoBtn);

    expect(useStructureStore.getState().entities[0].name).toBe('Original Entity');
    expect(useStructureStore.getState().ocrReviewState).toBeNull();
  });

  it('dismisses banner when Keep button clicked', () => {
    useStructureStore.setState({
      ocrReviewState: {
        summary: 'Inferred 3 entities',
        warnings: [],
      },
    });

    render(<OcrReviewBanner />);
    const dismissBtn = screen.getByRole('button', { name: /keep/i });
    fireEvent.click(dismissBtn);

    expect(useStructureStore.getState().ocrReviewState).toBeNull();
  });
});
