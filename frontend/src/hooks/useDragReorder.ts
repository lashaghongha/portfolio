import { useRef, useState } from 'react';
import type { DragEvent } from 'react';

/**
 * Minimal native HTML5 drag-to-reorder for a list.
 *
 * Split into a drag *handle* (the only draggable part, e.g. a grip icon) and a
 * drop *container* (the whole row, which detects hovering). Keeping the handle
 * separate means inputs inside the row stay fully usable — text selection does
 * not start an element drag.
 *
 * `onReorder` is called with the new array when an item is dropped onto another.
 * Moves are computed against the array passed in, so always pass the latest list.
 */
export function useDragReorder<T>(items: T[], onReorder: (next: T[]) => void) {
  const dragIndex = useRef<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  function move(from: number, to: number) {
    if (from === to || from < 0 || to < 0) return;
    const next = items.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onReorder(next);
  }

  function reset() {
    dragIndex.current = null;
    setOverIndex(null);
  }

  return {
    overIndex,
    getHandleProps(index: number) {
      return {
        draggable: true,
        onDragStart: (e: DragEvent) => {
          dragIndex.current = index;
          e.dataTransfer.effectAllowed = 'move';
          // Firefox requires data for the drag to start.
          e.dataTransfer.setData('text/plain', String(index));
        },
        onDragEnd: reset,
      };
    },
    getContainerProps(index: number) {
      return {
        onDragEnter: () => dragIndex.current !== null && setOverIndex(index),
        onDragOver: (e: DragEvent) => {
          if (dragIndex.current === null) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        },
        onDrop: (e: DragEvent) => {
          e.preventDefault();
          if (dragIndex.current !== null) move(dragIndex.current, index);
          reset();
        },
      };
    },
  };
}
