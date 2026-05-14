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

        // Normalise skills
        const skills = skillJson.data.map((node) => {
          const catId = relIds(node.relationships.field_category)[0] ?? null;
          return {
            id: node.id,
            title: node.attributes.title,
            level: node.attributes.field_skill_level ?? 0,
            path: node.attributes.path?.alias ?? `/node/${node.id}`,
            categoryName: catId && skillIncluded[catId]
              ? skillIncluded[catId].attributes.name
              : 'Other',
          };
        });

        // Build tech term name map from project included resources
        const techById = {};
        Object.values(projIncluded).forEach((item) => {
          if (item.type === 'taxonomy_term--technology_stack') {
            techById[item.id] = item.attributes.name;
          }
        });

        // Index skills by lower-cased title for matching
        const skillByName = {};
        skills.forEach((s) => { skillByName[s.title.toLowerCase()] = s; });

        // Build constellation nodes
        const nodeMap = {};
        projects.forEach((project) => {
          project.stackIds.forEach((termId) => {
            const termName = techById[termId];
            if (!termName) return;
            if (!nodeMap[termId]) {
              const matchedSkill = skillByName[termName.toLowerCase()];
              nodeMap[termId] = {
                id: termId,
                name: termName,
                projectCount: 0,
                skillLevel: matchedSkill ? (matchedSkill.level ?? 0) : 0,
                category: matchedSkill?.categoryName ?? 'Other',
              };
            }
            nodeMap[termId].projectCount++;
          });
        });

        const nodes = Object.values(nodeMap).map((n) => ({
          ...n,
          weight: n.projectCount * 2 + n.skillLevel,
        }));

        // Build constellation edges (co-occurrence)
        const edgeMap = {};
        projects.forEach((project) => {
          const ids = project.stackIds.filter((id) => nodeMap[id]);
          for (let i = 0; i < ids.length; i++) {
            for (let j = i + 1; j < ids.length; j++) {
              const key = [ids[i], ids[j]].sort().join('||');
              if (!edgeMap[key]) {
                edgeMap[key] = { source: ids[i], target: ids[j], strength: 0 };
              }
              edgeMap[key].strength++;
            }
          }
        });

        const edges = Object.values(edgeMap);

        // Build search items
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
