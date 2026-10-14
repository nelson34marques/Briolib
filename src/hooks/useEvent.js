import { useCallback, useLayoutEffect, useRef } from 'react';

export function useEvent(handler) {
  const handlerRef = useRef(handler);

  useLayoutEffect(() => {
    handlerRef.current = handler;
  });

  return useCallback((...args) => handlerRef.current(...args), []);
}
