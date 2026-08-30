import { useEffect } from 'react';

export default function useBodyScrollLock(isLocked) {
  useEffect(() => {
    if (!isLocked) return undefined;

    const scrollY = window.scrollY;
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyPosition = document.body.style.position;
    const previousBodyTop = document.body.style.top;
    const previousBodyWidth = document.body.style.width;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.position = previousBodyPosition;
      document.body.style.top = previousBodyTop;
      document.body.style.width = previousBodyWidth;
      window.dispatchEvent(new CustomEvent('thefinder:scroll-restored', { detail: { scrollY } }));
      window.scrollTo(0, scrollY);
      window.requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent('thefinder:scroll-restored', { detail: { scrollY } }));
      });
    };
  }, [isLocked]);
}
