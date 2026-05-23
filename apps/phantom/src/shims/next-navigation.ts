import { useRouterContext } from "./router-context";

export function usePathname() {
  return useRouterContext().pathname;
}

export function useSearchParams() {
  const { href } = useRouterContext();
  return new URL(href, window.location.origin).searchParams;
}

export function useRouter() {
  const { push, replace, prefetch } = useRouterContext();
  return {
    back: () => window.history.back(),
    prefetch,
    push,
    replace,
  };
}
