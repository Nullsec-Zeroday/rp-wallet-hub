export const walletHosts = {
  phantom: "app1.larperwallet.com",
  trust: "app2.larperwallet.com",
} as const;

export const apiDefaults = {
  localBaseUrl: "http://localhost:8787",
  productionBaseUrl: "https://api.larperwallet.com",
} satisfies {
  localBaseUrl: string;
  productionBaseUrl: string;
};
