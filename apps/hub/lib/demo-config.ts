export function isDemoFeatureEnabled() {
  return process.env.NEXT_PUBLIC_FREE_DEMO_ENABLED === "true";
}
