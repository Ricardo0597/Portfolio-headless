import { describe, expect, it } from 'vitest';
import { PROJECTS_URL, SKILLS_URL, fetchPortfolio, normalizePortfolio, relIds } from './portfolio';
import { fetchStub, projectsDocument, skillsDocument } from '../test/fixtures';

describe('normalizePortfolio', () => {
  const result = normalizePortfolio(projectsDocument, skillsDocument);

  it('normalises projects: summary text or value, alias or node path', () => {
    expect(result.projects).toEqual([
      {
        id: 'p1',
        title: 'Drupal Deploy Pipeline',
        summary: 'CI/CD for Drupal with GitHub Actions.',
        path: '/projects/drupal-deploy-pipeline',
        stackIds: ['t-php', 't-docker'],
      },
      { id: 'p2', title: 'Portfolio', summary: 'This site.', path: '/node/p2', stackIds: ['t-php', 't-drupal', 't-docker'] },
    ]);
  });

  it('links skills to projects by technology name, ignoring case', () => {
    const byId = Object.fromEntries(result.skills.map((s) => [s.id, s]));
    expect(byId['s-php'].projectCount).toBe(2);
    expect(byId['s-drupal'].termIds).toEqual(['t-drupal']);
    expect(byId['s-drupal'].projectCount).toBe(1);
    expect(byId['s-figma'].projectCount).toBe(0);
  });

  it('falls back to the "Other" category and level 0', () => {
    const figma = result.skills.find((s) => s.id === 's-figma');
    expect(figma.categoryName).toBe('Other');
    expect(figma.level).toBe(0);
    expect(result.skills.find((s) => s.id === 's-docker').categoryName).toBe('Other');
  });

  it('weights constellation nodes by usage and level', () => {
    const php = result.nodes.find((n) => n.id === 's-php');
    expect(php.weight).toBe(2 * 2 + 5);
  });

  it('connects skills used in the same project, counting shared projects', () => {
    const edge = (a, b) => result.edges.find(
      (e) => [e.source, e.target].sort().join() === [a, b].sort().join(),
    );
    expect(edge('s-php', 's-docker').strength).toBe(2);
    expect(edge('s-php', 's-drupal').strength).toBe(1);
    expect(edge('s-figma', 's-php')).toBeUndefined();
    expect(result.edges).toHaveLength(3);
  });

  it('builds search items for projects and skills', () => {
    expect(result.searchItems).toHaveLength(6);
    expect(result.searchItems[0]).toEqual({
      id: 'p1', type: 'project', title: 'Drupal Deploy Pipeline',
      summary: 'CI/CD for Drupal with GitHub Actions.', path: '/projects/drupal-deploy-pipeline',
    });
    expect(result.searchItems.filter((i) => i.type === 'skill')).toHaveLength(4);
  });

  it('rejects documents without a data array', () => {
    expect(() => normalizePortfolio({ errors: [] }, skillsDocument)).toThrow(/missing data array/);
  });
});

describe('relIds', () => {
  it('handles single, multiple and empty relationships', () => {
    expect(relIds({ data: { id: 'a' } })).toEqual(['a']);
    expect(relIds({ data: [{ id: 'a' }, { id: 'b' }] })).toEqual(['a', 'b']);
    expect(relIds({ data: null })).toEqual([]);
    expect(relIds(undefined)).toEqual([]);
  });
});

describe('fetchPortfolio', () => {
  it('requests published nodes with sparse fieldsets and includes', async () => {
    const urls = [];
    const stub = fetchStub();
    await fetchPortfolio((url) => { urls.push(url); return stub(url); });
    expect(urls).toEqual([PROJECTS_URL, SKILLS_URL]);
    expect(PROJECTS_URL).toContain('filter[status]=1');
    expect(PROJECTS_URL).toContain('include=field_stack');
    expect(SKILLS_URL).toContain('fields[node--skill]=');
  });

  it('reports the failing HTTP status', async () => {
    await expect(fetchPortfolio(fetchStub({ status: 503 }))).rejects.toThrow('JSON:API request failed: HTTP 503');
  });
});
