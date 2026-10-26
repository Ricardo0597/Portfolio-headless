import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MODEL_ID, MODEL_OPTIONS, useEmbeddings } from './useEmbeddings';

// The real library downloads a ~23 MB model; tests use a fake pipeline that
// maps known texts to fixed vectors.
const { pipeline } = vi.hoisted(() => ({ pipeline: vi.fn() }));
vi.mock('@huggingface/transformers', () => ({ pipeline }));

const VECTORS = {
  'PHP': [1, 0],
  'Docker': [0, 1],
  'backend code': [0.9, 0.1],
};

function fakeExtractor() {
  return async (text) => ({ data: Float32Array.from(VECTORS[text] ?? [0, 0]) });
}

const items = [
  { id: 's-php', type: 'skill', title: 'PHP', summary: '' },
  { id: 's-docker', type: 'skill', title: 'Docker', summary: '' },
];

describe('useEmbeddings', () => {
  beforeEach(() => {
    pipeline.mockReset();
  });

  it('stays idle until there are items', () => {
    const { result } = renderHook(() => useEmbeddings([]));
    expect(result.current.phase).toBe('idle');
    expect(pipeline).not.toHaveBeenCalled();
  });

  it('loads the model, embeds every item and ranks a query', async () => {
    pipeline.mockResolvedValue(fakeExtractor());
    const { result } = renderHook(() => useEmbeddings(items));

    await waitFor(() => expect(result.current.phase).toBe('ready'));
    expect(pipeline).toHaveBeenCalledWith('feature-extraction', MODEL_ID, { dtype: 'q8' });
    expect(MODEL_OPTIONS).toEqual({ dtype: 'q8' });
    expect(result.current.progress).toEqual({ done: 2, total: 2 });

    const ranked = await result.current.search('backend code');
    expect(ranked.map((r) => r.id)).toEqual(['s-php', 's-docker']);
  });

  it('shows an error instead of loading forever when the model fails', async () => {
    pipeline.mockRejectedValue(new Error('Failed to fetch model files'));
    const { result } = renderHook(() => useEmbeddings(items));

    await waitFor(() => expect(result.current.phase).toBe('error'));
    expect(result.current.error).toBe('Failed to fetch model files');
    await expect(result.current.search('PHP')).resolves.toEqual([]);
  });

  it('gives up on a model download that never finishes', async () => {
    pipeline.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useEmbeddings(items, { timeoutMs: 20 }));

    await waitFor(() => expect(result.current.phase).toBe('error'));
    expect(result.current.error).toBe('The AI model took too long to load.');
  });

  it('fails cleanly when embedding an item throws', async () => {
    pipeline.mockResolvedValue(async () => { throw new Error('WebAssembly not supported'); });
    const { result } = renderHook(() => useEmbeddings(items));

    await waitFor(() => expect(result.current.phase).toBe('error'));
    expect(result.current.error).toBe('WebAssembly not supported');
  });

  it('retries after an error', async () => {
    pipeline
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(fakeExtractor());
    const { result } = renderHook(() => useEmbeddings(items));
    await waitFor(() => expect(result.current.phase).toBe('error'));

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.phase).toBe('ready'));
    expect(result.current.error).toBeNull();
    expect(pipeline).toHaveBeenCalledTimes(2);
  });
});
