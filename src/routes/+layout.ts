export const prerender = true;

export async function load() {
  const module = await import('$lib/data/fragenkatalog3b_prerendered.json');
  return {
    fragenkatalog: module.default
  };
}