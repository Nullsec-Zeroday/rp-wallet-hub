import React from "react";

type RouterValue = {
  href: string;
  pathname: string;
  push: (href: string) => void;
  replace: (href: string) => void;
  prefetch: (_href: string) => void;
};

const RouterContext = React.createContext<RouterValue | null>(null);

function getHref() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [href, setHref] = React.useState(() => getHref());

  React.useEffect(() => {
    const onPopState = () => setHref(getHref());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = React.useCallback((nextHref: string, replace = false) => {
    if (replace) {
      window.history.replaceState({}, "", nextHref);
    } else {
      window.history.pushState({}, "", nextHref);
    }
    setHref(getHref());
  }, []);

  const value = React.useMemo<RouterValue>(() => {
    const url = new URL(href, window.location.origin);
    return {
      href,
      pathname: url.pathname,
      prefetch: () => {},
      push: (nextHref) => navigate(nextHref, false),
      replace: (nextHref) => navigate(nextHref, true),
    };
  }, [href, navigate]);

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouterContext() {
  const value = React.useContext(RouterContext);
  if (!value) {
    throw new Error("RouterProvider is missing");
  }
  return value;
}
