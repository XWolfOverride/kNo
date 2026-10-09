import { CategoryNode, Item } from '../types';

/**
 * Normalizes a category path string:
 * e.g., "  proyecto / hardware  " -> "proyecto/hardware"
 */
export function normalizeCategoryPath(raw: string): string {
  return raw
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean)
    .join('/');
}

/**
 * Parses a comma-separated category string into an array of normalized paths.
 * e.g., "retro, proyecto/hardware, tecnología" -> ["retro", "proyecto/hardware", "tecnología"]
 */
export function parseCategoriesInput(input: string): string[] {
  if (!input) return [];
  const parts = input.split(',');
  const results: string[] = [];
  const seen = new Set<string>();

  for (const part of parts) {
    const normalized = normalizeCategoryPath(part);
    if (normalized && !seen.has(normalized.toLowerCase())) {
      seen.add(normalized.toLowerCase());
      results.push(normalized);
    }
  }

  return results;
}

/**
 * Determines whether an item matches a selected category filter.
 * A selected category path (e.g. "proyecto") matches if any of the item's categories
 * equals "proyecto" or begins with "proyecto/".
 * If selected category is "proyecto/hardware", it matches if an item category equals or starts with "proyecto/hardware".
 */
export function itemMatchesCategory(item: Item, filterPath: string | null): boolean {
  if (!filterPath) return true;
  const target = filterPath.toLowerCase();

  return item.categories.some((cat) => {
    const catLower = cat.toLowerCase();
    return catLower === target || catLower.startsWith(target + '/');
  });
}

/**
 * Gets all ancestral and direct paths that an item belongs to.
 * e.g. for "proyecto/hardware", returns ["proyecto", "proyecto/hardware"].
 */
export function getAllPathsForItem(item: Item): Set<string> {
  const paths = new Set<string>();

  for (const cat of item.categories) {
    const parts = cat.split('/');
    let current = '';
    for (let i = 0; i < parts.length; i++) {
      current = i === 0 ? parts[i] : `${current}/${parts[i]}`;
      paths.add(current);
    }
  }

  return paths;
}

/**
 * Builds a hierarchical CategoryNode tree from a list of items.
 */
export function buildCategoryTree(items: Item[]): CategoryNode[] {
  // Map from canonical path -> { node, childPaths }
  interface TempNode {
    name: string;
    path: string;
    depth: number;
    matchingItemIds: Set<string>;
    directItemIds: Set<string>;
    childrenMap: Map<string, TempNode>;
  }

  const rootChildren = new Map<string, TempNode>();

  for (const item of items) {
    for (const cat of item.categories) {
      const parts = cat.split('/');
      let currentPath = '';
      let parentMap = rootChildren;

      for (let i = 0; i < parts.length; i++) {
        const seg = parts[i];
        currentPath = i === 0 ? seg : `${currentPath}/${seg}`;
        const depth = i;

        let node = parentMap.get(seg);
        if (!node) {
          node = {
            name: seg,
            path: currentPath,
            depth,
            matchingItemIds: new Set<string>(),
            directItemIds: new Set<string>(),
            childrenMap: new Map<string, TempNode>(),
          };
          parentMap.set(seg, node);
        }

        // An item belongs to this node because this node is a segment or ancestor of cat
        node.matchingItemIds.add(item.id);

        if (i === parts.length - 1) {
          node.directItemIds.add(item.id);
        }

        parentMap = node.childrenMap;
      }
    }
  }

  // Convert TempNode hierarchy to CategoryNode[]
  function convert(nodeMap: Map<string, TempNode>): CategoryNode[] {
    const nodes = Array.from(nodeMap.values()).map((temp) => {
      const children = convert(temp.childrenMap);
      // Sort children alphabetically
      children.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));

      const categoryNode: CategoryNode = {
        name: temp.name,
        path: temp.path,
        depth: temp.depth,
        itemCount: temp.matchingItemIds.size,
        directCount: temp.directItemIds.size,
        children,
      };
      return categoryNode;
    });

    nodes.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
    return nodes;
  }

  return convert(rootChildren);
}
