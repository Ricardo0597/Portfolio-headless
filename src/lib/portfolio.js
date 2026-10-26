// Drupal JSON:API → the shapes the Tech Lab renders.
//
// Pure functions only (no React, no fetch state), so the normalisation can be
// unit-tested with fixture responses.

// Published projects with their technology terms, and published skills with
// their category. Sparse fieldsets keep the payload small; `include` pulls the
// referenced terms into `included` in the same response.
export const PROJECTS_URL =
  '/jsonapi/node/project' +
  '?include=field_stack' +
  '&filter[status]=1' +
  '&fields[node--project]=title,field_summary,field_stack,path';

export const SKILLS_URL =
  '/jsonapi/node/skill' +
  '?include=field_category' +
  '&filter[status]=1' +
  '&fields[node--skill]=title,field_skill_level,field_category,path';

export function buildIncludedMap(included) {
  if (!included) return {};
  return included.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});
}

export function relIds(relationship) {
  if (!relationship?.data) return [];
  return Array.isArray(relationship.data)
    ? relationship.data.map((d) => d.id)
    : [relationship.data.id];
}

/**
 * Turns the two JSON:API documents into projects, skills, graph and search data.
 *
 * Skills and projects are linked by name: a skill "PHP" matches the
 * technology_stack term "PHP" (case-insensitive) referenced by a project.
 */
export function normalizePortfolio(projJson, skillJson) {
  if (!Array.isArray(projJson?.data) || !Array.isArray(skillJson?.data)) {
    throw new Error('JSON:API response missing data array — check that JSON:API module is enabled');
  }

  const projIncluded = buildIncludedMap(projJson.included);
  const skillIncluded = buildIncludedMap(skillJson.included);

  const projects = projJson.data.map((node) => ({
    id: node.id,
    title: node.attributes.title,
    summary: typeof node.attributes.field_summary === 'string'
      ? node.attributes.field_summary
      : (node.attributes.field_summary?.value ?? ''),
    path: node.attributes.path?.alias ?? `/node/${node.id}`,
    stackIds: relIds(node.relationships?.field_stack),
  }));

  // Lowercased technology name → term ids (the same name can exist twice).
  const termIdsByName = {};
  Object.values(projIncluded).forEach((item) => {
    if (item.type !== 'taxonomy_term--technology_stack') return;
    const key = item.attributes.name.toLowerCase();
    (termIdsByName[key] ??= []).push(item.id);
  });

  const skills = skillJson.data.map((node) => {
    const catId = relIds(node.relationships?.field_category)[0] ?? null;
    const categoryName = catId && skillIncluded[catId]
      ? skillIncluded[catId].attributes.name
      : 'Other';
    const termIds = termIdsByName[node.attributes.title.toLowerCase()] ?? [];
    const projectCount = projects.filter((p) => termIds.some((tid) => p.stackIds.includes(tid))).length;

    return {
      id: node.id,
      title: node.attributes.title,
      level: node.attributes.field_skill_level ?? 0,
      path: node.attributes.path?.alias ?? `/node/${node.id}`,
      categoryName,
      termIds,
      projectCount,
    };
  });

  // Constellation nodes: one per skill, sized by usage and level.
  const nodes = skills.map((s) => ({
    id: s.id,
    name: s.title,
    category: s.categoryName,
    skillLevel: s.level,
    projectCount: s.projectCount,
    termIds: s.termIds,
    path: s.path,
    weight: s.projectCount * 2 + s.level,
  }));

  // Edges: skills used together in a project; strength = shared projects.
  const edgeMap = {};
  projects.forEach((project) => {
    const ids = skills
      .filter((s) => s.termIds.some((tid) => project.stackIds.includes(tid)))
      .map((s) => s.id);
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const key = [ids[i], ids[j]].sort().join('||');
        edgeMap[key] ??= { source: ids[i], target: ids[j], strength: 0 };
        edgeMap[key].strength++;
      }
    }
  });
  const edges = Object.values(edgeMap);

  const searchItems = [
    ...projects.map((p) => ({ id: p.id, type: 'project', title: p.title, summary: p.summary, path: p.path })),
    ...skills.map((s) => ({ id: s.id, type: 'skill', title: s.title, summary: '', path: s.path })),
  ];

  return { projects, skills, nodes, edges, searchItems };
}

/**
 * Fetches both collections from Drupal and normalises them.
 *
 * @param {typeof fetch} fetchImpl - injectable for tests.
 */
export async function fetchPortfolio(fetchImpl = fetch) {
  const [projRes, skillRes] = await Promise.all([fetchImpl(PROJECTS_URL), fetchImpl(SKILLS_URL)]);
  if (!projRes.ok || !skillRes.ok) {
    const failedStatus = !projRes.ok ? projRes.status : skillRes.status;
    throw new Error(`JSON:API request failed: HTTP ${failedStatus}`);
  }
  const [projJson, skillJson] = await Promise.all([projRes.json(), skillRes.json()]);
  return normalizePortfolio(projJson, skillJson);
}
