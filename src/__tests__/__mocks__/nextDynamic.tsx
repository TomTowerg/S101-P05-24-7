/**
 * Mock for next/dynamic.
 * In tests we want to resolve dynamic imports synchronously so we can render
 * the component without waiting for async chunks.
 */
import React from "react";

const dynamic = (
  importFn: () => Promise<{ default: React.ComponentType<any> }>,
  _options?: { ssr?: boolean; loading?: React.ComponentType }
): React.ComponentType<any> => {
  // We return a wrapper that renders a placeholder until the real component is resolved.
  // For unit tests we just return a lazy component that renders synchronously.
  const LazyComponent = React.lazy(importFn);

  function DynamicWrapper(props: any) {
    return (
      <React.Suspense fallback={<div data-testid="dynamic-loading">Loading...</div>}>
        <LazyComponent {...props} />
      </React.Suspense>
    );
  }

  DynamicWrapper.displayName = "NextDynamic";
  return DynamicWrapper;
};

export default dynamic;
