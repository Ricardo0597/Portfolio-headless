import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePortfolioData } from './usePortfolioData';
import { fetchStub } from '../test/fixtures';

describe('usePortfolioData', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('loads and normalises Drupal content', async () => {
    vi.stubGlobal('fetch', vi.fn(fetchStub()));
    const { result } = renderHook(() => usePortfolioData());

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
    expect(result.current.data.projects).toHaveLength(2);
    expect(result.current.data.searchItems).toHaveLength(6);
  });

  it('exposes an HTTP failure as an error', async () => {
    vi.stubGlobal('fetch', vi.fn(fetchStub({ status: 404 })));
    const { result } = renderHook(() => usePortfolioData());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('JSON:API request failed: HTTP 404');
    expect(result.current.data).toBeNull();
  });

  it('exposes a network failure and recovers on reload', async () => {
    const ok = fetchStub();
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockImplementation(ok);
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => usePortfolioData());

    await waitFor(() => expect(result.current.error).toBe('Failed to fetch'));

    act(() => result.current.reload());

    await waitFor(() => expect(result.current.data).not.toBeNull());
    expect(result.current.error).toBeNull();
  });
});
