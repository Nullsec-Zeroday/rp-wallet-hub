export const walletHosts = {
  phantom: "app1.rpwallet.app",
  trust: "app2.rpwallet.app",
} as const;

export const apiDefaults = {
  localBaseUrl: "http://localhost:8787",
  productionBaseUrl: "https://api.rpwallet.app",
} satisfies {
  localBaseUrl: string;
  productionBaseUrl: string;
};
