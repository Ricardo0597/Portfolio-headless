'use client';

import { useState, useEffect } from 'react';

function buildIncludedMap(included) {
  if (!included) return {};
  return included.reduce((acc, item) => { acc[item.id] = item; return acc; }, {});
}

function relIds(relationship) {
  if (!relationship?.data) return [];
  return Array.isArray(relationship.data)
    ? relationship.data.map((d) => d.id)
    : [relationship.data.id];
}

export function usePortfolioData() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [projRes, skillRes] = await Promise.all([
          fetch(
            '/jsonapi/node/project' +
            '?include=field_stack' +
            '&filter[status]=1' +
            '&fields[node--project]=title,field_summary,field_stack,path'
          ),
          fetch(
            '/jsonapi/node/skill' +
            '?include=field_category' +
            '&filter[status]=1' +
            '&fields[node--skill]=title,field_skill_level,field_category,path'
          ),
        ]);

        if (!projRes.ok || !skillRes.ok) {
          const failedStatus = !projRes.ok ? projRes.status : skillRes.status;
          throw new Error(`JSON:API request failed: HTTP ${failedStatus}`);
        }

        const projJson = await projRes.json();
        const skillJson = await skillRes.json();

        if (cancelled) return;

        if (!Array.isArray(projJson.data) || !Array.isArray(skillJson.data)) {
          throw new Error('JSON:API response missing data array — check that JSON:API module is enabled');
        }

        const projIncluded = buildIncludedMap(projJson.included);
        const skillIncluded = buildIncludedMap(skillJson.included);

        // Normalise projects
        const projects = projJson.data.map((node) => ({
          id: node.id,
          title: node.attributes.title,
          summary: typeof node.attributes.field_summary === 'string'
            ? node.attributes.field_summary
            : (node.attributes.field_summary?.value ?? ''),
          path: node.attributes.path?.alias ?? `/node/${node.id}`,
          stackIds: relIds(node.relationships.field_stack),
        }));

        // Build tech term name → id(s) map from project included resources
        const techById = {};
        Object.values(projIncluded).forEach((item) => {
          if (item.type === 'taxonomy_term--technology_stack') {
            techById[item.id] = item.attributes.name;
          }
        });

        // Reverse map: lowercased tech name → [termId, ...]
        const termIdsByName = {};
        Object.entries(techById).forEach(([id, name]) => {
          const key = name.toLowerCase();
          if (!termIdsByName[key]) termIdsByName[key] = [];
          termIdsByName[key].push(id);
        });

        // Normalise skills and attach matching tech term IDs + project count
        const skills = skillJson.data.map((node) => {
          const catId = relIds(node.relationships.field_category)[0] ?? null;
          const categoryName = catId && skillIncluded[catId]
            ? skillIncluded[catId].attributes.name
            : 'Other';

          // Tech term IDs whose name matches this skill title (for project lookup)
          const termIds = termIdsByName[node.attributes.title.toLowerCase()] ?? [];

          const projectCount = projects.filter((p) =>
            termIds.some((tid) => p.stackIds.includes(tid))
          ).length;

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

        // Constellation nodes — one per skill, weighted by usage + level
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

        // Edges: connect skills that co-occur in the same project
        const edgeMap = {};
        projects.forEach((project) => {
          const projectSkillIds = skills
            .filter((s) => s.termIds.some((tid) => project.stackIds.includes(tid)))
            .map((s) => s.id);

          for (let i = 0; i < projectSkillIds.length; i++) {
            for (let j = i + 1; j < projectSkillIds.length; j++) {
              const key = [projectSkillIds[i], projectSkillIds[j]].sort().join('||');
              if (!edgeMap[key]) {
                edgeMap[key] = { source: projectSkillIds[i], target: projectSkillIds[j], strength: 0 };
              }
              edgeMap[key].strength++;
            }
          }
        });

        const edges = Object.values(edgeMap);

        // Search items
        const searchItems = [
          ...projects.map((p) => ({
            id: p.id, type: 'project',
            title: p.title, summary: p.summary, path: p.path,
          })),
          ...skills.map((s) => ({
            id: s.id, type: 'skill',
            title: s.title, summary: '', path: s.path,
          })),
        ];

        setData({ projects, skills, nodes, edges, searchItems });
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { data, error, loading };
}
