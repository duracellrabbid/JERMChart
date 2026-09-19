import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Scaffolding', () => {
  it('renders application header title', () => {
    render(<App />);
    expect(screen.getByText(/Trust Structure Chart Utility/i)).toBeInTheDocument();
  });
});
