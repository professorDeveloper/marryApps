import { useRouteError } from 'react-router';

import { ErrorView } from 'src/sections/error';

// ----------------------------------------------------------------------

export function ErrorBoundary() {
  const error = useRouteError();

  // In development, you might want to log the error for debugging
  if (import.meta.env.DEV) {
    console.error('Error caught by ErrorBoundary:', error);
  }

  // Always show user-friendly error page, never stack traces
  return <ErrorView />;
}
