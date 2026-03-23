import './styles.css';

import NProgress from 'nprogress';
import { useRef, useEffect } from 'react';
import { isEqualPath } from 'minimal-shared/utils';

import { usePathname } from 'src/routes/hooks';

// ----------------------------------------------------------------------

//  Checks if an anchor element is valid for triggering the progress bar.
function isValidAnchor(element: HTMLAnchorElement): boolean {
  if (!element) return false;

  const href = element.getAttribute('href')?.trim() ?? '';
  const target = element.getAttribute('target');
  const rel = element.getAttribute('rel');

  return (
    href.startsWith('/') &&
    target !== '_blank' &&
    (!rel || !['noopener', 'noreferrer'].some((v) => rel.includes(v)))
  );
}

// ----------------------------------------------------------------------

function useProgressBar() {
  const pathname = usePathname();
  const currentUrlRef = useRef<string>('');
  const originalHistoryMethodsRef = useRef<{
    pushState: History['pushState'];
    replaceState: History['replaceState'];
  } | null>(null);

  // Initialize currentUrlRef in the browser
  useEffect(() => {
    if (typeof window !== 'undefined') {
      currentUrlRef.current = window.location.href;
    }
  }, []);

  useEffect(() => {
    originalHistoryMethodsRef.current = {
      pushState: window.history.pushState,
      replaceState: window.history.replaceState,
    };

    // Starts the progress bar if navigating to a different URL.
    const handleNavigation = (newUrl: string) => {
      try {
        if (newUrl && !isEqualPath(newUrl, currentUrlRef.current, { deep: false })) {
          currentUrlRef.current = newUrl;
          NProgress.start();
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Navigation progress error:', error);
        }
        NProgress.done();
      }
    };

    // Handles anchor tag clicks via event delegation.
    const handleClickAnchor = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const anchor = target.closest('a[href]') as HTMLAnchorElement | null;

      if (anchor && isValidAnchor(anchor)) {
        handleNavigation(anchor.href);
      }
    };

    // Handles `popstate` events for browser back/forward navigation.
    const handlePopState = () => {
      handleNavigation(window.location.href);
    };

    // Patches a history method to intercept client-side navigations.
    const patchHistoryMethod = (method: 'pushState' | 'replaceState') => {
      const originalMethod = originalHistoryMethodsRef.current?.[method];
      if (!originalMethod) return;

      window.history[method] = function patchedHistoryMethod(
        this: History,
        data: unknown,
        unused: string,
        url?: string | URL | null
      ) {
        if (typeof url === 'string') {
          handleNavigation(new URL(url, window.location.origin).href);
        } else if (url instanceof URL) {
          handleNavigation(url.href);
        }

        return originalMethod.call(this, data, unused, url);
      };
    };

    patchHistoryMethod('pushState');
    patchHistoryMethod('replaceState');

    document.addEventListener('click', handleClickAnchor);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('click', handleClickAnchor);
      window.removeEventListener('popstate', handlePopState);

      if (originalHistoryMethodsRef.current) {
        window.history.pushState = originalHistoryMethodsRef.current.pushState;
        window.history.replaceState = originalHistoryMethodsRef.current.replaceState;
      }
    };
  }, []);

  // Completes the progress bar when pathname changes
  useEffect(() => {
    const timeout = setTimeout(() => NProgress.done(), 100);
    return () => clearTimeout(timeout);
  }, [pathname]);
}

// ----------------------------------------------------------------------

export function ProgressBar() {
  useEffect(() => {
    NProgress.configure({ showSpinner: false });
    return () => {
      NProgress.done();
    };
  }, []);

  useProgressBar();

  return null;
}
