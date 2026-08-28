'use client';

import { useEffect, useState } from 'react';

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isNarrow = window.matchMedia('(max-width: 900px)').matches;
    setIsMobile(hasTouch && isNarrow);
  }, []);

  return isMobile;
}
