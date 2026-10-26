import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SearchBox from './SearchBox';

const progress = { done: 0, total: 0 };

function ask(question) {
  fireEvent.change(screen.getByLabelText('Search question'), { target: { value: question } });
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));
}

describe('SearchBox', () => {
  afterEach(cleanup);

  it('shows the model error with a retry button and disables the input', () => {
    const onRetry = vi.fn();
    render(<SearchBox phase="error" progress={progress} search={vi.fn()} error="offline" onRetry={onRetry} />);

    expect(screen.getByRole('alert').textContent).toContain('Search is unavailable: offline');
    expect(screen.getByLabelText('Search question').disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('shows embedding progress', () => {
    render(<SearchBox phase="embedding" progress={{ done: 3, total: 8 }} search={vi.fn()} />);
    expect(screen.getByText('Building knowledge base… (3/8)')).toBeTruthy();
  });

  it('renders ranked results with their match score', async () => {
    const search = vi.fn().mockResolvedValue([
      { id: 'p1', type: 'project', title: 'Drupal Deploy Pipeline', summary: 'CI/CD', path: '/projects/p1', score: 0.8123 },
    ]);
    render(<SearchBox phase="ready" progress={progress} search={search} />);
    ask('  pipelines  ');

    await screen.findByText('Drupal Deploy Pipeline');
    expect(search).toHaveBeenCalledWith('pipelines');
    expect(screen.getByText('81.2% match')).toBeTruthy();
  });

  it('reports a failed search and lets the visitor try again', async () => {
    const search = vi.fn().mockRejectedValueOnce(new Error('out of memory')).mockResolvedValue([]);
    render(<SearchBox phase="ready" progress={progress} search={search} />);
    ask('php');

    expect((await screen.findByRole('alert')).textContent).toBe('Search failed: out of memory');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Search' }).disabled).toBe(false));

    ask('php');
    await screen.findByText('No matches.');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('does not search before the model is ready', () => {
    const search = vi.fn();
    render(<SearchBox phase="loading" progress={progress} search={search} />);
    fireEvent.submit(screen.getByLabelText('Search question').closest('form'));
    expect(search).not.toHaveBeenCalled();
  });
});
