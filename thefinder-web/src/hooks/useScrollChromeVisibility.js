import { useEffect, useRef, useState } from 'react';

export default function useScrollChromeVisibility() {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    function handleScrollRestore(event) {
      lastScrollY.current = event.detail?.scrollY ?? window.scrollY;
      setIsVisible(true);
    }

    function handleScroll() {
      const currentScrollY = Math.max(window.scrollY, 0);
      const difference = currentScrollY - lastScrollY.current;

      if (currentScrollY < 24) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
      } else if (difference > 8) {
        setIsVisible(false);
        lastScrollY.current = currentScrollY;
      } else if (difference < -8) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('thefinder:scroll-restored', handleScrollRestore);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('thefinder:scroll-restored', handleScrollRestore);
    };
  }, []);

  return isVisible;
}
