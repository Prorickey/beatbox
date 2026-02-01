"use client";

import { useState, useCallback, useRef, type DragEvent } from "react";

/**
 * Hook for native HTML5 drag-and-drop reordering.
 * Returns drag event handlers and the index of the item being dragged over.
 */
export function useDragReorder(onReorder: (from: number, to: number) => void) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragNode = useRef<EventTarget | null>(null);

  const handleDragStart = useCallback(
    (e: DragEvent, index: number) => {
      dragNode.current = e.target;
      setDragIndex(index);
      e.dataTransfer.effectAllowed = "move";
      // Make the drag image slightly transparent
      if (e.target instanceof HTMLElement) {
        e.target.style.opacity = "0.4";
      }
    },
    []
  );

  const handleDragEnter = useCallback(
    (index: number) => {
      if (dragIndex === null || dragIndex === index) return;
      setOverIndex(index);
    },
    [dragIndex]
  );

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDragEnd = useCallback(
    (e: DragEvent) => {
      if (e.target instanceof HTMLElement) {
        e.target.style.opacity = "1";
      }
      if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
        onReorder(dragIndex, overIndex);
      }
      setDragIndex(null);
      setOverIndex(null);
      dragNode.current = null;
    },
    [dragIndex, overIndex, onReorder]
  );

  const getDragProps = useCallback(
    (index: number) => ({
      draggable: true,
      onDragStart: (e: DragEvent) => handleDragStart(e, index),
      onDragEnter: () => handleDragEnter(index),
      onDragOver: handleDragOver,
      onDragEnd: handleDragEnd,
    }),
    [handleDragStart, handleDragEnter, handleDragOver, handleDragEnd]
  );

  const isOver = useCallback(
    (index: number) => overIndex === index && dragIndex !== index,
    [overIndex, dragIndex]
  );

  const isDragging = useCallback(
    (index: number) => dragIndex === index,
    [dragIndex]
  );

  return { getDragProps, isOver, isDragging };
}
