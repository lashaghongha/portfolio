// Groups gallery items by their `group` label while preserving order. Group order
// follows first appearance; within a group, items keep their list order. Each
// entry keeps the item's flat index in the original array so callers can still
// reorder, remove or open a lightbox against the source list.

export interface GalleryEntry<T> {
  item: T;
  index: number;
}

export interface GalleryGroup<T> {
  name: string; // '' means ungrouped
  entries: GalleryEntry<T>[];
}

export function groupGallery<T extends { group?: string | null }>(items: T[]): GalleryGroup<T>[] {
  const order: string[] = [];
  const buckets = new Map<string, GalleryEntry<T>[]>();

  items.forEach((item, index) => {
    const name = (item.group ?? '').trim();
    let bucket = buckets.get(name);
    if (!bucket) {
      bucket = [];
      buckets.set(name, bucket);
      order.push(name);
    }
    bucket.push({ item, index });
  });

  return order.map((name) => ({ name, entries: buckets.get(name) ?? [] }));
}
