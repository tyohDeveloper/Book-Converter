import type { ManagedFile } from './file-manager/types';
import { naturalCompare } from '@shared/utils/natural-sort';

export type SortType = 'name' | 'natural' | 'datetime' | 'type' | 'source' | 'custom';

function getFileExtension(name: string): string {
  const lastDot = name.lastIndexOf('.');
  const ext = lastDot === -1 ? '' : name.slice(lastDot + 1).toLowerCase();
  return ext === 'xhtml' ? 'html' : ext;
}

function stableSort<T>(arr: T[], compare: (a: T, b: T) => number): T[] {
  return arr
    .map((item, index) => ({ item, index }))
    .sort((a, b) => compare(a.item, b.item) || a.index - b.index)
    .map(({ item }) => item);
}

export function sortFilesByCustomOrder(files: ManagedFile[], customOrder: string[]): ManagedFile[] {
  const orderMap = new Map(customOrder.map((id, index) => [id, index]));
  return [...files].sort((a, b) => {
    const aIndex = orderMap.get(a.id) ?? Infinity;
    const bIndex = orderMap.get(b.id) ?? Infinity;
    return aIndex - bIndex;
  });
}

export function sortFiles(files: ManagedFile[], sortType: SortType, customOrder: string[]): ManagedFile[] {
  if (sortType === 'custom') {
    return sortFilesByCustomOrder(files, customOrder);
  }
  
  const compareFn = (a: ManagedFile, b: ManagedFile): number => {
    switch (sortType) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'natural':
        return naturalCompare(a.name, b.name);
      case 'datetime':
        return (b.uploadedAt || 0) - (a.uploadedAt || 0);
      case 'type':
        return getFileExtension(a.name).localeCompare(getFileExtension(b.name));
      case 'source':
        const aSource = a.isOutput ? 1 : 0;
        const bSource = b.isOutput ? 1 : 0;
        return aSource - bSource;
      default:
        return 0;
    }
  };
  
  return stableSort([...files], compareFn);
}
