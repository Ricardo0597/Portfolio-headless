import { afterEach, describe, expect, it, vi } from 'vitest';
import { cosine, itemText, rankItems, withTimeout } from './search';

describe('cosine', () => {
  it('is 1 for the same direction, 0 for orthogonal and zero vectors', () => {
    expect(cosine([1, 2], [2, 4])).toBeCloseTo(1);
    expect(cosine([1, 0], [0, 1])).toBe(0);
    expect(cosine([0, 0], [1, 1])).toBe(0);
  });
});

describe('itemText', () => {
  it('joins title and summary, or uses the title alone', () => {
    expect(itemText({ title: 'PHP', summary: '' })).toBe('PHP');
    expect(itemText({ title: 'Pipeline', summary: 'CI/CD' })).toBe('Pipeline. CI/CD');
  });
});

describe('rankItems', () => {
  const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const embeddings = [[1, 0], [0.6, 0.8], [0, 1]];

  it('orders by similarity and keeps the top K', () => {
    const ranked = rankItems([0, 1], items, embeddings, 2);
    expect(ranked.map((r) => r.id)).toEqual(['c', 'b']);
    expect(ranked[0].score).toBeCloseTo(1);
  });

  it('does not mutate the items', () => {
    rankItems([1, 0], items, embeddings);
    expect(items[0]).toEqual({ id: 'a' });
  });
});

describe('withTimeout', () => {
  afterEach(() => vi.useRealTimers());

  it('resolves when the promise wins', async () => {
    await expect(withTimeout(Promise.resolve('ok'), 1000, 'slow')).resolves.toBe('ok');
  });

  it('rejects with the message when time runs out', async () => {
    vi.useFakeTimers();
    const pending = withTimeout(new Promise(() => {}), 1000, 'The AI model took too long to load.');
    vi.advanceTimersByTime(1000);
    await expect(pending).rejects.toThrow('The AI model took too long to load.');
  });
});
