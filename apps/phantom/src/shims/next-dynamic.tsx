import React from "react";

export default function dynamic<T extends React.ComponentType<any>>(
  loader: () => Promise<{ default: T } | T>,
  _options?: { ssr?: boolean },
) {
  const Lazy = React.lazy(async () => {
    const mod = await loader();
    return "default" in mod ? mod : { default: mod };
  });

  return function DynamicComponent(props: React.ComponentProps<T>) {
    return (
      <React.Suspense fallback={null}>
        <Lazy {...props} />
      </React.Suspense>
    );
  };
}
