// Semantic search maths: no model, no React, so it can be unit-tested.

export function cosine(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

/** The text embedded for a search item: its title, then its summary if any. */
export function itemText(item) {
  return item.title + (item.summary ? '. ' + item.summary : '');
}

/** Items with a cosine score against the query vector, best first. */
export function rankItems(queryVector, items, embeddings, topK = 5) {
  return items
    .map((item, i) => ({ ...item, score: cosine(queryVector, embeddings[i]) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/** Rejects with `message` if `promise` has not settled after `ms`. */
export function withTimeout(promise, ms, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
