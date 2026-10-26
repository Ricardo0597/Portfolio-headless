// Minimal Drupal JSON:API documents shaped like the real responses.

export const projectsDocument = {
  data: [
    {
      id: 'p1',
      type: 'node--project',
      attributes: {
        title: 'Drupal Deploy Pipeline',
        field_summary: { value: 'CI/CD for Drupal with GitHub Actions.' },
        path: { alias: '/projects/drupal-deploy-pipeline' },
      },
      relationships: { field_stack: { data: [{ id: 't-php' }, { id: 't-docker' }] } },
    },
    {
      id: 'p2',
      type: 'node--project',
      attributes: {
        title: 'Portfolio',
        field_summary: 'This site.',
        path: null,
      },
      relationships: { field_stack: { data: [{ id: 't-php' }, { id: 't-drupal' }, { id: 't-docker' }] } },
    },
  ],
  included: [
    { id: 't-php', type: 'taxonomy_term--technology_stack', attributes: { name: 'PHP' } },
    { id: 't-docker', type: 'taxonomy_term--technology_stack', attributes: { name: 'Docker' } },
    { id: 't-drupal', type: 'taxonomy_term--technology_stack', attributes: { name: 'drupal' } },
  ],
};

export const skillsDocument = {
  data: [
    {
      id: 's-php',
      type: 'node--skill',
      attributes: { title: 'PHP', field_skill_level: 5, path: { alias: '/skills/php' } },
      relationships: { field_category: { data: { id: 'c-backend' } } },
    },
    {
      id: 's-drupal',
      type: 'node--skill',
      attributes: { title: 'Drupal', field_skill_level: 5, path: { alias: '/skills/drupal' } },
      relationships: { field_category: { data: { id: 'c-cms' } } },
    },
    {
      id: 's-docker',
      type: 'node--skill',
      attributes: { title: 'Docker', field_skill_level: 3, path: { alias: '/skills/docker' } },
      relationships: { field_category: { data: null } },
    },
    {
      id: 's-figma',
      type: 'node--skill',
      attributes: { title: 'Figma', field_skill_level: null, path: { alias: '/skills/figma' } },
      relationships: {},
    },
  ],
  included: [
    { id: 'c-backend', type: 'taxonomy_term--skill_category', attributes: { name: 'Backend' } },
    { id: 'c-cms', type: 'taxonomy_term--skill_category', attributes: { name: 'CMS' } },
  ],
};

/** A fetch stub answering the two JSON:API URLs. */
export function fetchStub({ projects = projectsDocument, skills = skillsDocument, status = 200 } = {}) {
  return async (url) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => (url.startsWith('/jsonapi/node/project') ? projects : skills),
  });
}
