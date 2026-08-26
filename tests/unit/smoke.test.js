import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import App from '../../src/App.svelte';

describe('App', () => {
  it('renders the app', () => {
    render(App);
    expect(screen.getByText('Follow the Money')).toBeInTheDocument();
  });
});
