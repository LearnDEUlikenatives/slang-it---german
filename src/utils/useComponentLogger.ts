import { useEffect, useRef } from 'react';
import { logger } from './logger';

/**
 * Tracks and logs component mount, unmount, and render passes
 * to diagnose why components unmount or re-render unexpectedly.
 */
export function useComponentLifecycleLogger(componentName: string, stateSnapshot?: Record<string, any>) {
  const renderCount = useRef(0);
  renderCount.current += 1;

  useEffect(() => {
    logger.render(componentName, 'MOUNT', {
      initialState: stateSnapshot,
    });

    return () => {
      logger.render(componentName, 'UNMOUNT', {
        totalRenders: renderCount.current,
        finalState: stateSnapshot,
      });
    };
  }, [componentName]);

  // Log notable updates if render count changes
  useEffect(() => {
    if (renderCount.current > 1) {
      logger.render(componentName, 'UPDATE', {
        renderPass: renderCount.current,
        state: stateSnapshot,
      });
    }
  });
}
