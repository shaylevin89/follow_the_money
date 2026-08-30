import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import UpdateTimeline from '../../src/lib/components/UpdateTimeline.svelte';

describe('UpdateTimeline', () => {
  it('renders updates with duplicate dates (legacy data) without crashing', () => {
    render(UpdateTimeline, {
      updates: [
        { date: '2025-09-12', amount: 68000 },
        { date: '2025-09-12', amount: 68949 },
        { date: '2026-01-16', amount: 68949 },
      ],
      currency: 'ILS',
    });
    expect(screen.getAllByText('2025-09-12')).toHaveLength(2);
    expect(screen.getByText('2026-01-16')).toBeInTheDocument();
  });
});
