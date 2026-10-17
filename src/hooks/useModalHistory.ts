'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook to manage modal lifecycle with browser history (back button / swipe gesture),
 * Esc key support, body scroll lock, and cleanup.
 *
 * Prevents mobile users from accidentally leaving the website when tapping "Back".
 */
export function useModalHistory(isOpen: boolean, onClose: () => void, modalId: string) {
  const isPoppedByHistory = useRef(false);
  const pushedRef = useRef(false);
  const stateKey = `_modal_${modalId}`;

  const closeDirectly = useCallback(() => {
    isPoppedByHistory.current = true;
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    isPoppedByHistory.current = false;
    pushedRef.current = true;

    try {
      const currentState = window.history.state || {};
      window.history.pushState({ ...currentState, [stateKey]: true }, '');
    } catch {
      // Fallback if history state fails (e.g. cross-origin iframe)
    }

    const handlePopState = () => {
      isPoppedByHistory.current = true;
      pushedRef.current = false;
      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;

      // If modal was closed by UI action (X button, backdrop, etc.) rather than back button,
      // pop the history entry we pushed so browser history remains clean.
      if (pushedRef.current && !isPoppedByHistory.current) {
        pushedRef.current = false;
        try {
          if (window.history.state && window.history.state[stateKey]) {
            window.history.back();
          }
        } catch {
          // Ignore history errors
        }
      }
    };
  }, [isOpen, modalId, onClose, stateKey]);

  return { closeDirectly };
}
