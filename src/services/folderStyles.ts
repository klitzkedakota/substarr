import { Folder } from '../types';

/**
 * Finds the top-level ancestor of a folder. Guards against broken parent
 * links and cycles by stopping when a parent is missing or already visited.
 */
export function findRootFolder(folder: Folder, byId: Map<string, Folder>): Folder {
  let current = folder;
  const seen = new Set<string>([current.id]);
  while (current.parentId) {
    const parent = byId.get(current.parentId);
    if (!parent || seen.has(parent.id)) break;
    seen.add(parent.id);
    current = parent;
  }
  return current;
}

/**
 * Subfolders always use the color and icon of their top-level folder.
 * Returns a new array; folders that already match are returned unchanged.
 */
export function applyInheritedStyles(folders: Folder[]): Folder[] {
  const byId = new Map(folders.map((f) => [f.id, f]));
  return folders.map((f) => {
    if (!f.parentId) return f;
    const root = findRootFolder(f, byId);
    if (root.id === f.id || (f.color === root.color && f.icon === root.icon)) return f;
    return { ...f, color: root.color, icon: root.icon };
  });
}
